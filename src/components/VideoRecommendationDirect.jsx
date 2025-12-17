import { useState, useEffect, use } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import {
  generateSearchKeywords,
  generateAlternativeKeywords,
  quickAnalyzeVideo,
  checkSimilarityWithGemini,
} from "../utils/gemini";
import { searchYouTubeVideos, getVideoTranscript, searchTrustedChannelVideos } from "../utils/youtube";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { addToJjim } from "../utils/jjim";
import { addLikeSubject, removeLikeSubject } from "../utils/likeSubject";
import { gradeSubject } from "../data/curriculum/gradeSubject";

export default function VideoRecommendationDirect({ onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // 폼 상태
  const [gradeLevel, setGradeLevel] = useState("초등 고학년");
  const [subject, setSubject] = useState("미술");
  const [intention, setIntention] = useState("");
  const [preferredDuration, setPreferredDuration] = useState("");

  // 정렬 및 좋아요/찜 상태
  const [sortBy, setSortBy] = useState("views"); // 'safetyScore', 'views', 'likes'
  const [likedVideos, setLikedVideos] = useState({});
  const [jjimedVideos, setJjimedVideos] = useState({});
  const [previousKeywords, setPreviousKeywords] = useState([]); // 이전 검색 키워드 저장
  const [playingVideo, setPlayingVideo] = useState(null); // 현재 재생 중인 영상
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set()); // 새로 추가된 영상 ID

  //
  const [sortedVideos, setSortedVideos] = useState([]);

  // 인기 영상 상태
  const [popularVideos, setPopularVideos] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);

  useEffect(() => {
    if (recommendations) {
      const sorted = sortVideos(recommendations.videos);
      setSortedVideos(sorted);
    }
  }, [recommendations, sortBy]);

  // 학년별 인기 영상 가져오기
  useEffect(() => {
    if (!recommendations) {
      fetchPopularVideos();
    }
  }, [gradeLevel, recommendations]);

  // 인기 영상 가져오기 함수
  const fetchPopularVideos = async () => {
    setLoadingPopular(true);
    try {
      // recommendKeywords 컬렉션에서 해당 학년으로 시작하는 문서들 조회
      const keywordsRef = collection(db, "recommendKeywords");
      const snapshot = await getDocs(keywordsRef);

      const allPopularVideos = [];
      const seenVideoIds = new Set();

      snapshot.forEach((doc) => {
        const docId = doc.id;
        // 해당 학년으로 시작하는 문서만 필터링
        if (docId.startsWith(gradeLevel)) {
          const data = doc.data();
          const lists = data.lists || [];

          // 좋아요 많은 순으로 정렬
          const sortedLists = [...lists].sort((a, b) => (b.likes || 0) - (a.likes || 0));

          // 상위 리스트에서 영상 추출
          sortedLists.forEach((list) => {
            const videos = list.videos || [];
            videos.forEach((video) => {
              if (!seenVideoIds.has(video.videoId) && video.safetyScore > 70) {
                seenVideoIds.add(video.videoId);
                allPopularVideos.push({
                  ...video,
                  likes: list.likes || 0,
                  keywords: list.keywords || "",
                  subject: data.subject || docId.split("-")[1] || "",
                });
              }
            });
          });
        }
      });

      // 좋아요 + 안전도 기준 정렬 후 상위 10개
      allPopularVideos.sort((a, b) => {
        const scoreA = (a.likes || 0) * 10 + (a.safetyScore || 0);
        const scoreB = (b.likes || 0) * 10 + (b.safetyScore || 0);
        return scoreB - scoreA;
      });

      setPopularVideos(allPopularVideos.slice(0, 10));
    } catch (error) {
      console.error("인기 영상 가져오기 실패:", error);
      setPopularVideos([]);
    } finally {
      setLoadingPopular(false);
    }
  };

  // 정렬 함수
  const sortVideos = (videos) => {
    const sorted = [...videos];
    console.log(sorted);
    if (sortBy === "safetyScore") {
      return sorted.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));
    } else if (sortBy === "likes") {
      return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    // 조회수 순
    // 기본값: viewCount
    return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  };

  // 하루 한도 체크
  const checkDailyLimit = () => {
    const today = new Date().toDateString();
    const limitData = JSON.parse(
      localStorage.getItem("safertube_recommend_limit") || "{}"
    );

    // 날짜가 바뀌면 리셋
    if (limitData.date !== today) {
      limitData.date = today;
      limitData.count = 0;
      localStorage.setItem(
        "safertube_recommend_limit",
        JSON.stringify(limitData)
      );
    }

    const maxLimit = user ? 10 : 3;

    if (limitData.count >= maxLimit) {
      return { exceeded: true, count: limitData.count, max: maxLimit };
    }

    return { exceeded: false, count: limitData.count, max: maxLimit };
  };

  // 한도 증가
  const incrementLimit = () => {
    const today = new Date().toDateString();
    const limitData = JSON.parse(
      localStorage.getItem("safertube_recommend_limit") || "{}"
    );

    limitData.date = today;
    limitData.count = (limitData.count || 0) + 1;
    localStorage.setItem(
      "safertube_recommend_limit",
      JSON.stringify(limitData)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject) {
      Swal.fire({
        title: "입력 필요",
        text: "주제를 선택해주세요",
        icon: "warning",
        confirmButtonColor: "#4285f4",
      });
      return;
    }

    // 로컬 환경 체크
    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 하루 한도 체크
    if (!isLocalDev) {
      const limitCheck = checkDailyLimit();
      if (limitCheck.exceeded) {
        await Swal.fire({
          title: "하루 한도 초과",
          html: `오늘의 무료 추천 한도를 모두 사용했습니다.<br/>사용량: <b>${
            limitCheck.count
          }/${limitCheck.max}</b><br/><br/>${
            !user ? "<small>로그인하면 10개까지 사용 가능!</small>" : ""
          }`,
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 🔄 개선된 로직: 항상 신뢰채널 우선 검색 (저장된 목록 스킵)
      // 키워드 생성: 수업의도가 있으면 사용, 없으면 기본 키워드 생성
      let searchKeywords = intention.trim() || null;
      
      // 안전교육은 교육과정 기반 키워드 사용
      if (subject === "안전교육" && !searchKeywords) {
        const weightedKeywords = findKeywordsFromCurriculum(gradeLevel, subject);
        if (weightedKeywords && weightedKeywords.length > 0) {
          const totalWeight = weightedKeywords.reduce((sum, item) => sum + item.weight, 0);
          let random = Math.random() * totalWeight;
          searchKeywords = weightedKeywords[0].keyword;
          for (const item of weightedKeywords) {
            random -= item.weight;
            if (random <= 0) {
              searchKeywords = item.keyword;
              break;
            }
          }
          console.log(`🔍 안전교육 키워드: "${searchKeywords}"`);
        }
      }
      
      // 수업의도 없으면 기본 키워드 생성 (과목 수업)
      if (!searchKeywords) {
        searchKeywords = `${subject} 수업`;
        console.log(`🔍 기본 키워드 생성: "${searchKeywords}"`);
      }

      // 1단계: 신뢰채널 검색 (항상 우선)
      Swal.fire({
        title: "⚡ 신뢰채널 검색",
        html: `${subject} 신뢰채널에서 영상 검색 중...<br/><small>키워드: ${searchKeywords}</small><br/><small>안전도 70점 이상 영상만 선별합니다</small>`,
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // 신뢰채널에서 키워드로 검색
      let trustedVideos = await searchTrustedChannelVideos(
        subject,
        20,
        preferredDuration,
        searchKeywords
      );

      console.log(`📺 신뢰채널 검색 결과: ${trustedVideos.length}개`);

      // 2단계: 신뢰채널 결과가 부족하면 전체 YouTube 검색으로 보완
      let fromTrustedChannels = true;
      if (trustedVideos.length < 5) {
        console.log(`⚠️ 신뢰채널 결과 부족 (${trustedVideos.length}개). 전체 YouTube 검색 보완...`);
        
        Swal.fire({
          title: "⚡ 추가 검색 중",
          html: `신뢰채널 결과가 부족하여 전체 YouTube에서 추가 검색 중...<br/><small>키워드: ${searchKeywords}</small>`,
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const youtubeVideos = await searchYouTubeVideos(
          searchKeywords,
          15,
          preferredDuration,
          subject
        );
        
        // 중복 제거 후 합치기
        const existingIds = new Set(trustedVideos.map(v => v.videoId));
        const newVideos = youtubeVideos.filter(v => !existingIds.has(v.videoId));
        trustedVideos = [...trustedVideos, ...newVideos].slice(0, 20);
        fromTrustedChannels = false;
        
        console.log(`📺 전체 검색 후 총: ${trustedVideos.length}개`);
      }

      if (trustedVideos.length === 0) {
        Swal.close();
        await Swal.fire({
          title: "검색 결과 없음",
          text: "조건에 맞는 영상을 찾을 수 없습니다. 다른 키워드로 시도해보세요!",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

      // 3단계: 영상 분석
      Swal.fire({
        title: "⚡ 영상 분석 중",
        html: `${trustedVideos.length}개 영상 안전도 분석 중...<br/><small>잠시만 기다려주세요</small>`,
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const analysisPromises = trustedVideos.map(async (video) => {
        try {
          const transcript = await getVideoTranscript(video.videoId);
          const analysis = await quickAnalyzeVideo(
            video.videoId,
            transcript,
            gradeLevel,
            subject,
            intention.trim() || ""
          );
          return {
            ...video,
            safetyScore: analysis.safetyScore,
            safetyDescription: analysis.summary,
            summary: analysis.summary,
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        } catch (error) {
          console.error(`분석 실패 (${video.videoId}):`, error);
          return {
            ...video,
            safetyScore: 0,
            safetyDescription: "분석 실패",
            summary: "분석 중 오류가 발생했습니다",
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        }
      });

      const allResults = await Promise.all(analysisPromises);

      // 안전도 70점 초과 영상만 필터링
      const safeResults = allResults.filter((video) => video.safetyScore > 70);
      console.log(`✅ 안전도 필터링: ${allResults.length}개 → ${safeResults.length}개 (70점 초과)`);

      if (safeResults.length === 0) {
        Swal.close();
        await Swal.fire({
          title: "적합한 영상 없음",
          text: "안전도 기준을 충족하는 영상을 찾지 못했습니다. 다른 키워드로 시도해보세요!",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

      // 조회수 순 정렬 후 최대 10개
      safeResults.sort((a, b) => b.viewCount - a.viewCount);
      const finalResults = safeResults.slice(0, 10);

      // 한도 증가
      if (!isLocalDev) {
        incrementLimit();
      }

      setPreviousKeywords([searchKeywords]);

      setRecommendations({
        videos: finalResults,
        subject,
        gradeLevel,
        intention: intention.trim() || searchKeywords,
        fromTrustedChannels,
      });

      Swal.close();
      await Swal.fire({
        title: "✅ 추천 완료!",
        html: `${finalResults.length}개 영상 추천!<br/><small>키워드: ${searchKeywords}</small><br/><small>${fromTrustedChannels ? "🏫 신뢰채널" : "🌐 전체 YouTube"} 검색 결과</small>`,
        icon: "success",
        confirmButtonColor: "#4285f4",
        timer: 2000,
      });
    } catch (error) {
      console.error("추천 중 오류:", error);
      await Swal.fire({
        title: "오류",
        text: error.message || "추천 중 오류가 발생했습니다",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    } finally {
      setLoading(false);
    }
  };

  // 학년 매핑 함수 (초등 저학년 -> 1학년, 2학년 등)
  const getGradeNumbers = (grade) => {
    switch (grade) {
      case "초등 저학년":
        return ["1학년", "2학년"];
      case "초등 중학년":
        return ["3학년", "4학년"];
      case "초등 고학년":
        return ["5학년", "6학년"];
      default:
        return [];
    }
  };

  // 현재 월에 맞는 키워드 찾기 (가중치 기반 랜덤)
  const findKeywordsFromCurriculum = (grade, subj) => {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // 안전교육은 학년 상관없이 "안전교육" 키에서 검색
    if (subj === "안전교육") {
      const curriculumData = gradeSubject["안전교육"];
      if (!curriculumData) return null;

      const weightedKeywords = []; // { keyword, weight }

      for (const item of curriculumData) {
        const itemMonthMatch = item.month.match(/(\d+)월/);
        if (itemMonthMatch) {
          const itemMonth = parseInt(itemMonthMatch[1]);
          let monthDiff = Math.abs(currentMonth - itemMonth);
          if (monthDiff > 6) monthDiff = 12 - monthDiff;

          const validKeywords = item.keywords.filter(
            (k) => typeof k === "string" && k.length > 0
          );

          // 월 차이에 따라 가중치 부여
          // 0개월: 10, 1개월: 5, 2개월: 3, 3개월 이상: 1
          let weight = 1;
          if (monthDiff === 0) weight = 10;
          else if (monthDiff === 1) weight = 5;
          else if (monthDiff === 2) weight = 3;

          validKeywords.forEach((kw) => {
            weightedKeywords.push({ keyword: kw, weight });
          });
        }
      }

      return weightedKeywords.length > 0 ? weightedKeywords : null;
    }

    const gradeNumbers = getGradeNumbers(grade);
    if (gradeNumbers.length === 0) return null;

    // 주제별 매핑
    const subjectMapping = {
      "미술": {
        "1학년": ["통합교과"],
        "2학년": ["통합교과"],
        "3학년": ["미술"],
        "4학년": ["미술"],
        "5학년": ["미술"],
        "6학년": ["미술"],
      },
      "체육": {
        "1학년": ["통합교과"],
        "2학년": ["통합교과"],
        "3학년": ["체육"],
        "4학년": ["체육"],
        "5학년": ["체육"],
        "6학년": ["체육"],
      },
      "짜투리영상": ["통합교과", "국어", "실과"],
    };

    const weightedKeywords = []; // { keyword, weight }

    // 해당 학년들에서 키워드 검색
    for (const gradeNum of gradeNumbers) {
      let targetSubjects;

      if (subj === "미술" || subj === "체육") {
        targetSubjects = subjectMapping[subj][gradeNum] || ["통합교과"];
      } else {
        targetSubjects = subjectMapping[subj] || ["통합교과"];
      }

      for (const targetSubj of targetSubjects) {
        const key = `${gradeNum}-${targetSubj}`;
        const curriculumData = gradeSubject[key];
        if (!curriculumData) continue;

        for (const item of curriculumData) {
          const itemMonthMatch = item.month.match(/(\d+)월/);
          if (itemMonthMatch) {
            const itemMonth = parseInt(itemMonthMatch[1]);
            let monthDiff = Math.abs(currentMonth - itemMonth);
            if (monthDiff > 6) monthDiff = 12 - monthDiff;

            const validKeywords = item.keywords.filter(
              (k) => typeof k === "string" && k.length > 0
            );

            // 월 차이에 따라 가중치 부여
            // 0개월: 10, 1개월: 5, 2개월: 3, 3개월 이상: 1
            let weight = 1;
            if (monthDiff === 0) weight = 10;
            else if (monthDiff === 1) weight = 5;
            else if (monthDiff === 2) weight = 3;

            validKeywords.forEach((kw) => {
              weightedKeywords.push({ keyword: kw, weight });
            });
          }
        }
      }
    }

    return weightedKeywords.length > 0 ? weightedKeywords : null;
  };

  // 랜덤 키워드 생성
  const handleRandomKeyword = async () => {
    try {
      // 1순위: Firestore 문서에서 키워드 찾기
      const docName = `${gradeLevel}-${subject}`;
      const keywordDocRef = doc(db, "recommendKeywords", docName);
      const keywordDoc = await getDoc(keywordDocRef);

      if (keywordDoc.exists()) {
        const data = keywordDoc.data();
        const keywords = data.keywords || [];

        if (keywords.length > 0) {
          const randomKeyword =
            keywords[Math.floor(Math.random() * keywords.length)];
          setIntention(randomKeyword);

          await Swal.fire({
            title: "키워드 생성!",
            text: `"${randomKeyword}" 키워드를 선택했습니다.`,
            icon: "success",
            confirmButtonColor: "#4285f4",
            timer: 1500,
          });
          return;
        }
      }

      // 2순위: gradeSubject.js에서 현재 학년/과목/월에 맞는 키워드 찾기
      console.log("📚 Firestore에 키워드 없음, 교육과정에서 검색...");
      const weightedKeywords = findKeywordsFromCurriculum(gradeLevel, subject);

      if (weightedKeywords && weightedKeywords.length > 0) {
        // 가중치 기반 랜덤 선택
        const totalWeight = weightedKeywords.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        let selectedKeyword = weightedKeywords[0].keyword;
        for (const item of weightedKeywords) {
          random -= item.weight;
          if (random <= 0) {
            selectedKeyword = item.keyword;
            break;
          }
        }

        setIntention(selectedKeyword);

        await Swal.fire({
          title: "키워드 생성!",
          html: `"${selectedKeyword}" 키워드를 선택했습니다.<br/><small>(교육과정 기반)</small>`,
          icon: "success",
          confirmButtonColor: "#4285f4",
          timer: 1500,
        });
        return;
      }

      // 키워드를 찾지 못한 경우
      await Swal.fire({
        title: "키워드 없음",
        text: `${gradeLevel} ${subject}에 대한 추천 키워드가 아직 없습니다.`,
        icon: "info",
        confirmButtonColor: "#4285f4",
      });
    } catch (error) {
      console.error("랜덤 키워드 생성 오류:", error);
      await Swal.fire({
        title: "오류",
        text: "키워드를 가져오는 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    }
  };

  // 키워드 자동 저장 함수
  const saveKeywordIfNeeded = async () => {
    if (!intention || !gradeLevel || !subject) return;

    const likedCount = Object.values(likedVideos).filter(Boolean).length;
    const jjimedCount = Object.values(jjimedVideos).filter(Boolean).length;
    const totalCount = likedCount + jjimedCount;

    if (totalCount >= 2) {
      try {
        const docName = `${gradeLevel}-${subject}`;
        const keywordDocRef = doc(db, "recommendKeywords", docName);
        const keywordDoc = await getDoc(keywordDocRef);
        const keyword = intention.trim();

        if (!keywordDoc.exists()) {
          await setDoc(keywordDocRef, {
            gradeLevel,
            subject,
            keywords: [keyword],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          console.log(`✅ 키워드 저장: "${keyword}"`);
        } else {
          const data = keywordDoc.data();
          const keywords = data.keywords || [];
          if (!keywords.includes(keyword)) {
            await updateDoc(keywordDocRef, {
              keywords: arrayUnion(keyword),
              updatedAt: Timestamp.now(),
            });
            console.log(`✅ 키워드 저장: "${keyword}"`);
          }
        }
      } catch (error) {
        console.error("키워드 저장 오류:", error);
      }
    }
  };

  // 찜하기 핸들러
  const handleJjim = async (video) => {
    if (!user) {
      const result = await Swal.fire({
        title: "로그인이 필요합니다",
        text: "찜하기 기능을 사용하려면 로그인이 필요합니다.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#4285f4",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "로그인",
        cancelButtonText: "취소",
      });
      if (result.isConfirmed) {
        await loginWithGoogle();
      }
      return;
    }

    try {
      await addToJjim({
        user,
        videoUrl: video.videoUrl,
        videoId: video.videoId,
        title: video.title,
        analysis: {
          safetyScore: video.safetyScore,
          summary: video.summary,
          warnings: [],
        },
      });

      setJjimedVideos((prev) => {
        const newState = { ...prev, [video.videoId]: true };
        setTimeout(() => saveKeywordIfNeeded(), 100);
        return newState;
      });

      await Swal.fire({
        title: "찜 완료!",
        text: "내 찜보따리에 추가되었습니다.",
        icon: "success",
        confirmButtonColor: "#4285f4",
        timer: 1500,
      });
    } catch (error) {
      console.error("찜하기 오류:", error);
      await Swal.fire({
        title: "오류",
        text: error.message || "찜하기 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    }
  };

  // 좋아요 핸들러
  const handleLike = async (video) => {
    if (!user) {
      const result = await Swal.fire({
        title: "로그인이 필요합니다",
        text: "좋아요 기능을 사용하려면 로그인이 필요합니다.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#4285f4",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "로그인",
        cancelButtonText: "취소",
      });
      if (result.isConfirmed) {
        await loginWithGoogle();
      }
      return;
    }

    try {
      const isLiked = likedVideos[video.videoId];

      if (isLiked) {
        await removeLikeSubject({ user, subject, videoId: video.videoId });
        setLikedVideos((prev) => ({ ...prev, [video.videoId]: false }));
        await Swal.fire({
          title: "좋아요 취소",
          text: "좋아요가 취소되었습니다.",
          icon: "info",
          confirmButtonColor: "#6c757d",
          timer: 1000,
        });
      } else {
        await addLikeSubject({
          user,
          subject,
          videoId: video.videoId,
          videoUrl: video.videoUrl,
          title: video.title,
          summary: video.summary || "",
          duration: video.duration || 0,
          safetyScore: video.safetyScore || 0,
        });
        setLikedVideos((prev) => {
          const newState = { ...prev, [video.videoId]: true };
          setTimeout(() => saveKeywordIfNeeded(), 100);
          return newState;
        });
        await Swal.fire({
          title: "좋아요!",
          text: `${subject} 좋아요 목록에 추가되었습니다.`,
          icon: "success",
          confirmButtonColor: "#4285f4",
          timer: 1500,
        });
      }
    } catch (error) {
      console.error("좋아요 오류:", error);
      await Swal.fire({
        title: "오류",
        text: error.message || "좋아요 처리 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    }
  };

  //목록을 추천하는 기능, 키워드에 등록됨.
  const recommendListsAdd = async () => {
    try {
      const docName = `${gradeLevel}-${subject}`; // 학년-과목 형식의 문서 ID
      const keywordDocRef = doc(db, "recommendKeywords", docName);
      const keywordDoc = await getDoc(keywordDocRef);

      const newEntry = {
        keywords: previousKeywords.join(", "), // 검색했던 키워드
        videos: sortedVideos, // 정렬된 영상 목록
        likes: 1, // 기본 좋아요 수
      };

      if (!keywordDoc.exists()) {
        // 문서가 없는 경우 새로 생성
        await setDoc(keywordDocRef, {
          gradeLevel,
          subject,
          lists: [newEntry], // lists 배열에 새 객체 추가
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log(`✅ 새 문서 생성 및 저장: ${docName}`);
      } else {
        // 문서가 있는 경우 lists 배열 확인
        const data = keywordDoc.data();
        const lists = data.lists || [];

        // 유사도가 높은 항목 찾기
        let updated = false;

        const updatedLists = await Promise.all(
          lists.map(async (item) => {
            // Gemini 2.5 Flash를 사용해 유사도 계산
            const keywordSimilarity = await checkSimilarityWithGemini(
              item.keywords,
              newEntry.keywords
            );

            const videoSimilarity = await checkSimilarityWithGemini(
              JSON.stringify(item.videos),
              JSON.stringify(newEntry.videos)
            );

            const isSimilar =
              keywordSimilarity.score > 85 && // 키워드 유사도 85% 이상
              videoSimilarity.score > 85; // 영상 유사도 85% 이상

            if (isSimilar) {
              updated = true;
              return { ...item, likes: (item.likes || 0) + 1 }; // likes 값 증가
            }
            return item;
          })
        );

        if (!updated) {
          // 유사한 항목이 없으면 새 항목 추가
          updatedLists.push({ ...newEntry, likes: 1 });
        }

        // Firestore 문서 업데이트
        await updateDoc(keywordDocRef, {
          lists: updatedLists,
          updatedAt: Timestamp.now(),
        });
        console.log(`✅ 기존 문서 업데이트: ${docName}`);
      }

      await Swal.fire({
        title: "저장 완료!",
        text: "추천 목록이 성공적으로 저장되었습니다.",
        icon: "success",
        confirmButtonColor: "#4285f4",
      });
    } catch (error) {
      console.error("추천 목록 저장 오류:", error);
      await Swal.fire({
        title: "오류",
        text: "추천 목록을 저장하는 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    }
  };

  // 새로고침 핸들러 (4개 더 추가)
  const handleRefresh = async () => {
    if (!user) {
      const result = await Swal.fire({
        title: "로그인이 필요합니다",
        text: "새로고침 기능은 로그인 후 사용 가능합니다.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#4285f4",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "로그인",
        cancelButtonText: "취소",
      });
      if (result.isConfirmed) {
        await loginWithGoogle();
      }
      return;
    }

    // 새로고침 횟수 체크
    const refreshKey = `refresh_direct_${gradeLevel}_${subject}_${intention}`;
    const refreshCount = parseInt(localStorage.getItem(refreshKey) || "0");

    if (refreshCount >= 2) {
      await Swal.fire({
        title: "새로고침 한도 초과",
        text: "이 검색 조건은 이미 2번 새로고침했습니다.",
        icon: "warning",
        confirmButtonColor: "#4285f4",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: "새로고침",
      html: `같은 조건으로 영상을 더 추가할까요?<br/><small>남은 횟수: ${
        2 - refreshCount
      }/2</small>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4285f4",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "추가",
      cancelButtonText: "취소",
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);

    try {
      // 기존 영상 ID 목록
      const existingVideoIds = new Set(
        recommendations.videos.map((v) => v.videoId)
      );

      let newVideos = [];

      // 수업의도가 비어있으면 신뢰채널에서 검색
      if (!intention.trim()) {
        console.log("🔍 새로고침: 신뢰채널에서 추가 검색");

        const trustedVideos = await searchTrustedChannelVideos(
          subject,
          15,
          preferredDuration
        );

        // 중복 제거
        newVideos = trustedVideos.filter((v) => !existingVideoIds.has(v.videoId));
      } else {
        // 수업의도가 있으면 키워드 검색
        const keywords = await generateAlternativeKeywords(
          subject,
          intention,
          gradeLevel,
          previousKeywords
        );
        console.log("🔍 새로고침 검색어:", keywords);

        const videos = await searchYouTubeVideos(
          keywords,
          8,
          preferredDuration,
          subject
        );

        // 중복 제거
        newVideos = videos.filter((v) => !existingVideoIds.has(v.videoId));

        // 사용한 키워드 추가
        setPreviousKeywords((prev) => [...prev, ...keywords]);
      }

      if (newVideos.length === 0) {
        await Swal.fire({
          title: "검색 결과 없음",
          text: "추가 영상을 찾을 수 없습니다.",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

      // 분석 진행
      const analysisPromises = newVideos.map(async (video) => {
        try {
          const transcript = await getVideoTranscript(video.videoId);
          const analysis = await quickAnalyzeVideo(
            video.videoId,
            transcript,
            gradeLevel,
            subject,
            intention
          );
          return {
            ...video,
            safetyScore: analysis.safetyScore,
            safetyDescription: analysis.summary,
            summary: analysis.summary,
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        } catch (error) {
          console.error(`분석 실패 (${video.videoId}):`, error);
          return {
            ...video,
            safetyScore: 0,
            safetyDescription: "분석 실패",
            summary: "분석 중 오류가 발생했습니다",
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        }
      });

      const allResults = await Promise.all(analysisPromises);

      // 안전도 70점 초과만 필터링 (신뢰채널 검색일 때)
      let results;
      if (!intention.trim()) {
        results = allResults.filter((video) => video.safetyScore > 70);
        console.log(`✅ 안전도 필터링: ${allResults.length}개 → ${results.length}개`);
      } else {
        results = allResults;
      }

      if (results.length === 0) {
        await Swal.fire({
          title: "적합한 영상 없음",
          text: "안전도 기준을 충족하는 추가 영상을 찾지 못했습니다.",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

      // 기존 영상에 새 영상 추가 (최대 5개)
      const finalResults = results.slice(0, 5);

      // 새로 추가된 영상 ID 저장
      const newIds = new Set(finalResults.map((v) => v.videoId));
      setNewlyAddedIds(newIds);

      setRecommendations((prev) => ({
        ...prev,
        videos: [...prev.videos, ...finalResults],
      }));

      // 새로고침 횟수 증가
      localStorage.setItem(refreshKey, (refreshCount + 1).toString());

      await Swal.fire({
        title: "추가 완료!",
        text: `${finalResults.length}개 영상이 추가되었습니다.`,
        icon: "success",
        confirmButtonColor: "#4285f4",
        timer: 1500,
      });
    } catch (error) {
      console.error("새로고침 오류:", error);
      await Swal.fire({
        title: "오류",
        text: "새로고침 중 오류가 발생했습니다.",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations(null);
    setGradeLevel("초등 고학년");
    setSubject("미술");
    setIntention("");
    setPreferredDuration("");
    setLikedVideos({});
    setJjimedVideos({});
    setNewlyAddedIds(new Set());
  };

  // 결과 화면
  if (recommendations) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            추천 영상 ({sortedVideos.length}개)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={recommendListsAdd}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              👍 목록추천
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로딩중...
                </>
              ) : (
                "🔄 새로고침"
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ✨ 처음부터
            </button>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700 font-medium">추가 영상 검색 및 분석 중...</span>
          </div>
        )}

        {/* 정렬 버튼 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSortBy("safetyScore")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "safetyScore"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🛡️ 안전도순
          </button>
          <button
            onClick={() => setSortBy("views")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "views"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ▶️ 조회수순
          </button>
          <button
            onClick={() => setSortBy("likes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "likes"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            👍 좋아요순
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedVideos.map((video, idx) => (
            <div
              key={`${video.videoId}_${idx}`}
              className={`border rounded-xl p-6 hover:shadow-2xl transition relative ${
                newlyAddedIds.has(video.videoId)
                  ? "bg-green-50 border-green-300"
                  : "bg-white"
              }`}
            >
              {/* 새로 추가된 영상 배지 */}
              {newlyAddedIds.has(video.videoId) && (
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </div>
              )}
              {/* 썸네일 또는 플레이어 */}
              {playingVideo === video.videoId ? (
                <div className="w-full h-72 mb-4">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              ) : (
                <div
                  className="relative w-full h-72 mb-4 cursor-pointer"
                  onClick={() => setPlayingVideo(video.videoId)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* 재생 버튼 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg hover:bg-opacity-40 transition">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-10 h-10 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* 제목 */}
              <h3 className="font-bold text-lg mb-2 line-clamp-2">
                {idx + 1}. {video.title}
              </h3>

              {/* 길이 & 안전도 */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm text-gray-600">
                  ⏱️ {video.durationFormatted}
                </p>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    video.safetyScore >= 85
                      ? "bg-green-100 text-green-800"
                      : video.safetyScore >= 65
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  🛡️ 안전도: {video.safetyScore}점
                </span>
              </div>

              {/* 요약 */}
              <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                {video.summary}
              </p>

              {/* 액션 버튼들 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleJjim(video)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    jjimedVideos[video.videoId]
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-yellow-100"
                  }`}
                >
                  ⭐ {jjimedVideos[video.videoId] ? "찜 완료" : "찜하기"}
                </button>
                <button
                  onClick={() => handleLike(video)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    likedVideos[video.videoId]
                      ? "bg-pink-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-pink-100"
                  }`}
                >
                  ❤️ {likedVideos[video.videoId] ? "좋아요 취소" : "좋아요"}
                </button>
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                >
                  📺 YouTube 보기
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 입력 폼
  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
        ⚡ 빠른 수업 영상 추천
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* 1. 학년 선택 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            1. 대상 학년 선택 (필수)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { value: "초등 저학년", label: "초등 저학년", sub: "1-2학년" },
              { value: "초등 중학년", label: "초등 중학년", sub: "3-4학년" },
              { value: "초등 고학년", label: "초등 고학년", sub: "5-6학년" },
              { value: "중학생", label: "중학생" },
              { value: "고등학생", label: "고등학생" },
            ].map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => setGradeLevel(grade.value)}
                className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 text-xs sm:text-sm font-medium transition-all flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] min-h-[55px] sm:min-h-[65px] ${
                  gradeLevel === grade.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                <div className="leading-tight text-center whitespace-pre-line">
                  {grade.label}
                </div>
                {grade.sub && (
                  <div className={`text-[10px] sm:text-xs mt-0.5 ${
                    gradeLevel === grade.value ? "text-blue-200" : "text-gray-400"
                  }`}>
                    {grade.sub}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 주제 선택 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            2. 주제 선택 (필수)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { short: "미술", full: "미술" },
              { short: "체육", full: "체육" },
              { short: "안전교육", full: "안전교육" },
              { short: "짜투리영상", full: "짜투리영상" },
            ].map((subj) => (
              <button
                key={subj.full}
                type="button"
                onClick={() => setSubject(subj.full)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold rounded-lg border transition-all ${
                  subject === subj.full
                    ? "text-white bg-blue-600 border-blue-600"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                {subj.short}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 수업 의도 및 준비물 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-base sm:text-lg font-semibold text-gray-700">
              3. 수업 의도 및 준비물 (선택)
            </label>
            <button
              type="button"
              onClick={handleRandomKeyword}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              🎲 랜덤 생성
            </button>
          </div>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="크리스마스 트리 만들기"
            rows={3}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 4. 영상 길이 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            4. 선호하는 영상 길이 (선택)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-3">
            {[
              { value: "", label: "상관없음" },
              { value: "5", label: "5분 이내" },
              { value: "10", label: "10분 이내" },
              { value: "20", label: "20분 이내" },
            ].map((duration) => (
              <button
                key={duration.value}
                type="button"
                onClick={() => setPreferredDuration(duration.value)}
                className={`px-3 sm:px-5 py-2 sm:py-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                  preferredDuration === duration.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>
        </div>

        {/* 찾기 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 sm:py-3 rounded-lg text-base sm:text-lg font-bold transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "⚡ 빠른 분석 중..." : "⚡ 빠르게 영상 찾기 (5-10초)"}
        </button>

        <p className="text-xs text-center text-gray-500">
          💡 프론트엔드에서 직접 분석하여 초고속 추천!
          <br />
          하루 {user ? "10" : "3"}개 무료
        </p>
      </form>

      {/* 인기 영상 섹션 */}
      {popularVideos.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              🔥 {gradeLevel} 인기 영상
            </h3>
            {loadingPopular && (
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularVideos.map((video, idx) => (
              <div
                key={`${video.videoId}_${idx}`}
                className="group relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // 인기 영상 클릭 시 수업의도에 키워드 입력하고 검색
                  if (video.keywords) {
                    setIntention(video.keywords);
                  }
                  if (video.subject) {
                    setSubject(video.subject);
                  }
                }}
              >
                {/* 썸네일 */}
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* 안전도 배지 */}
                  <div className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    video.safetyScore >= 85
                      ? "bg-green-500 text-white"
                      : video.safetyScore >= 70
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    {video.safetyScore}점
                  </div>
                  {/* 좋아요 배지 */}
                  {video.likes > 0 && (
                    <div className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500 text-white">
                      ❤️ {video.likes}
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
                    {video.title}
                  </p>
                  {video.subject && (
                    <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {video.subject}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            영상 클릭 시 해당 키워드로 검색됩니다
          </p>
        </div>
      )}

      {/* 인기 영상 로딩 중 */}
      {loadingPopular && popularVideos.length === 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">인기 영상 불러오는 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
