import { useState, useEffect, use } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import {
  generateSearchKeywords,
  generateAlternativeKeywords,
  quickAnalyzeVideo,
  checkSimilarityWithGemini,
} from "../utils/gemini";
import { searchYouTubeVideos, getVideoTranscript } from "../utils/youtube";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { addToJjim } from "../utils/jjim";
import { addLikeSubject, removeLikeSubject } from "../utils/likeSubject";

export default function VideoRecommendationDirect({ onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // 폼 상태
  const [gradeLevel, setGradeLevel] = useState("초등 6학년");
  const [subject, setSubject] = useState("미술");
  const [intention, setIntention] = useState("");
  const [preferredDuration, setPreferredDuration] = useState("");

  // 정렬 및 좋아요/찜 상태
  const [sortBy, setSortBy] = useState("views"); // 'safetyScore', 'views', 'likes'
  const [likedVideos, setLikedVideos] = useState({});
  const [jjimedVideos, setJjimedVideos] = useState({});
  const [previousKeywords, setPreviousKeywords] = useState([]); // 이전 검색 키워드 저장
  const [playingVideo, setPlayingVideo] = useState(null); // 현재 재생 중인 영상

  //
  const [sortedVideos, setSortedVideos] = useState([]);

  useEffect(() => {
    if (recommendations) {
      const sorted = sortVideos(recommendations.videos);
      setSortedVideos(sorted);
    }
  }, [recommendations, sortBy]);

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
      // 1단계: 검색어 생성
      await Swal.fire({
        title: "⚡ 빠른 추천 시작",
        html: "1단계: 검색어 생성 중...",
        icon: "info",
        showConfirmButton: false,
        timer: 1500,
      });

      const keywords = await generateSearchKeywords(
        subject,
        intention,
        gradeLevel
      );
      setPreviousKeywords(keywords); // 초기 키워드 저장
      console.log("🔍 검색어:", keywords);

      // 2단계: YouTube 검색
      await Swal.fire({
        title: "⚡ 빠른 추천 시작",
        html: `2단계: "${keywords.join(", ")}" 검색 중...`,
        icon: "info",
        showConfirmButton: false,
        timer: 1500,
      });

      const videos = await searchYouTubeVideos(
        keywords,
        10,
        preferredDuration,
        subject
      );
      console.log(`📺 ${videos.length}개 영상 발견`);

      if (videos.length === 0) {
        await Swal.fire({
          title: "검색 결과 없음",
          text: "조건에 맞는 영상을 찾을 수 없습니다",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

      // 3단계: 빠른 분석 (병렬)
      await Swal.fire({
        title: "⚡ 빠른 분석 중",
        html: `3단계: ${videos.length}개 영상 동시 분석 중...<br/><small>약 5-10초 소요</small>`,
        icon: "info",
        showConfirmButton: false,
        timer: 2000,
      });

      const analysisPromises = videos.map(async (video) => {
        try {
          // 자막 또는 영상 정보 가져오기
          const transcript = await getVideoTranscript(video.videoId);

          // Gemini로 빠른 분석
          const analysis = await quickAnalyzeVideo(
            video.videoId,
            transcript,
            gradeLevel,
            subject,
            intention
          );

          return {
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            title: video.title,
            duration: video.duration,
            durationFormatted: video.durationFormatted,
            thumbnail: video.thumbnail,
            safetyScore: analysis.safetyScore,
            safetyDescription: analysis.summary,
            summary: analysis.summary,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        } catch (error) {
          console.error(`분석 실패 (${video.videoId}):`, error);
          return {
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            title: video.title,
            duration: video.duration,
            durationFormatted: video.durationFormatted,
            thumbnail: video.thumbnail,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            safetyScore: 70,
            safetyDescription: "분석 중 오류 발생",
            summary: "분석 중 오류가 발생했습니다",
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        }
      });

      const results = await Promise.all(analysisPromises);

      // 조회수 순으로 정렬
      results.sort((a, b) => b.viewCount - a.viewCount);

      console.log("✅ 분석 완료:", results.length);

      // 한도 증가
      if (!isLocalDev) {
        incrementLimit();
      }

      setRecommendations({
        videos: results,
        subject,
        gradeLevel,
        intention,
      });

      await Swal.fire({
        title: "✅ 분석 완료!",
        html: `${results.length}개 영상 추천이 준비되었습니다`,
        icon: "success",
        confirmButtonColor: "#4285f4",
        timer: 1500,
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

  // 랜덤 키워드 생성
  const handleRandomKeyword = async () => {
    try {
      const docName = `${gradeLevel}-${subject}`;
      const keywordDocRef = doc(db, "recommendKeywords", docName);
      const keywordDoc = await getDoc(keywordDocRef);

      if (!keywordDoc.exists()) {
        await Swal.fire({
          title: "키워드 없음",
          text: `${gradeLevel} ${subject}에 대한 추천 키워드가 아직 없습니다.`,
          icon: "info",
          confirmButtonColor: "#4285f4",
        });
        return;
      }

      const data = keywordDoc.data();
      const keywords = data.keywords || [];

      if (keywords.length === 0) {
        await Swal.fire({
          title: "키워드 없음",
          text: "저장된 키워드가 없습니다.",
          icon: "info",
          confirmButtonColor: "#4285f4",
        });
        return;
      }

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
      html: `같은 조건으로 4개의 영상을 더 추가할까요?<br/><small>남은 횟수: ${
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
      // 다른 키워드 생성 (중복 방지)
      const keywords = await generateAlternativeKeywords(
        subject,
        intention,
        gradeLevel,
        previousKeywords
      );
      console.log("🔍 새로고침 검색어:", keywords);

      // 기존 영상 ID 목록
      const existingVideoIds = new Set(
        recommendations.videos.map((v) => v.videoId)
      );

      const videos = await searchYouTubeVideos(
        keywords,
        4,
        preferredDuration,
        subject
      );

      // 중복 영상 필터링
      const newVideos = videos.filter((v) => !existingVideoIds.has(v.videoId));

      if (newVideos.length === 0) {
        await Swal.fire({
          title: "검색 결과 없음",
          text: "추가 영상을 찾을 수 없습니다. (중복 제외됨)",
          icon: "warning",
          confirmButtonColor: "#4285f4",
        });
        setLoading(false);
        return;
      }

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
            safetyScore: 70,
            safetyDescription: "분석 중 오류 발생",
            summary: "분석 중 오류가 발생했습니다",
            warnings: [],
            warningCount: 0,
            chapters: [],
            flow: [],
          };
        }
      });

      const results = await Promise.all(analysisPromises);

      // 기존 영상에 새 영상 추가
      setRecommendations((prev) => ({
        ...prev,
        videos: [...prev.videos, ...results],
      }));

      // 사용한 키워드 추가
      setPreviousKeywords((prev) => [...prev, ...keywords]);

      // 새로고침 횟수 증가
      localStorage.setItem(refreshKey, (refreshCount + 1).toString());

      await Swal.fire({
        title: "추가 완료!",
        text: `${results.length}개 영상이 추가되었습니다.`,
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
    setGradeLevel("초등 6학년");
    setSubject("미술");
    setIntention("");
    setPreferredDuration("");
    setLikedVideos({});
    setJjimedVideos({});
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
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
            >
              👍 목록추천
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
            >
              🔄 새로고침
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              ✨ 처음부터
            </button>
          </div>
        </div>

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
              className="border rounded-xl p-6 hover:shadow-2xl transition bg-white"
            >
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
              { value: "초등 1학년", label: "초등\n1학년" },
              { value: "초등 2학년", label: "초등\n2학년" },
              { value: "초등 3학년", label: "초등\n3학년" },
              { value: "초등 4학년", label: "초등\n4학년" },
              { value: "초등 5학년", label: "초등\n5학년" },
              { value: "초등 6학년", label: "초등\n6학년" },
              { value: "중학생", label: "중학생" },
              { value: "고등학생", label: "고등학생" },
            ].map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => setGradeLevel(grade.value)}
                className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 text-xs sm:text-sm font-medium transition-all flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] min-h-[50px] sm:min-h-[60px] ${
                  gradeLevel === grade.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                <div className="leading-tight text-center whitespace-pre-line">
                  {grade.label}
                </div>
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
    </div>
  );
}
