import { useEffect, useState, useRef } from "react";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

import { addToJjim } from "../utils/jjim";
import { shareToBoard } from "../utils/share";
import SaveWizard from "./SaveWizard";

// 타임스탬프를 초 단위로 변환하는 함수
const parseTimestampToSeconds = (timestamp) => {
  if (!timestamp) return 0;
  const parts = timestamp.split(":").map((p) => parseInt(p) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
};

// 카테고리별 안전 등급 카드 컴포넌트
const CategoryRatingCard = ({ category, label, icon, rating }) => {
  if (!rating) return null;

  // 등급에 따른 스타일 설정
  const getLevelStyles = (level) => {
    switch (level) {
      case 'safe':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-500',
          badgeText: '안전',
          barColor: 'bg-emerald-500',
          barWidth: '100%'
        };
      case 'caution':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-500',
          badgeText: '주의',
          barColor: 'bg-amber-500',
          barWidth: '75%'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-500',
          badgeText: '경고',
          barColor: 'bg-orange-500',
          barWidth: '50%'
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-500',
          badgeText: '위험',
          barColor: 'bg-red-500',
          barWidth: '25%'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-400',
          badgeText: '-',
          barColor: 'bg-gray-400',
          barWidth: '0%'
        };
    }
  };

  const styles = getLevelStyles(rating.level);

  return (
    <div 
      className={`category-rating-card ${styles.bg} ${styles.border} border rounded-xl p-3 transition-all hover:shadow-md cursor-pointer`}
      title={rating.description || ''}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${styles.badge}`}>
          {styles.badgeText}
        </span>
      </div>
      <div className={`font-semibold text-sm ${styles.text} mb-1`}>{label}</div>
      {/* 점수 바 */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${styles.barColor} rounded-full transition-all duration-500`}
          style={{ width: `${rating.score || 0}%` }}
        />
      </div>
      <div className={`text-xs ${styles.text} mt-1 text-right font-medium`}>
        {rating.score || 0}점
      </div>
    </div>
  );
};

export default function AnalysisResult({ requestId, directResult, progress, onReset }) {
  const { user, loginWithGoogle } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailNotificationEnabled, setEmailNotificationEnabled] =
    useState(false);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showSaveWizard, setShowSaveWizard] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categoryRatings: false,
    comprehension: false,
  });

  // 섹션 토글 함수
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // YouTube 플레이어로 특정 시간으로 이동
  const seekToTime = (timestamp) => {
    const seconds = parseTimestampToSeconds(timestamp);
    if (playerRef.current && playerRef.current.contentWindow) {
      // YouTube iframe API를 통해 시간 이동
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [seconds, true]
        }),
        '*'
      );
      // 영상 재생 시작
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }),
        '*'
      );
      // 영상 플레이어로 스크롤
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // directResult가 있으면 즉시 사용
  useEffect(() => {
    if (directResult) {
      // directResult에 status가 있으면 그대로 사용 (긴 영상의 경우 processing)
      if (directResult.status) {
        setResult(directResult);
        // completed나 processing 모두 loading false (progress 화면 표시 위해)
        setLoading(false);
      } else {
        // status가 없으면 완료된 결과로 간주
        // ★ directResult에 이미 videoId/videoUrl이 있으면 우선 사용
        const vid = directResult.videoId || requestId;
        const vurl = directResult.videoUrl || (vid ? `https://www.youtube.com/watch?v=${vid}` : '');
        setResult({
          status: "completed",
          analysis: directResult,  // analysis 필드로 설정 (기존 코드와 호환)
          videoId: vid,
          videoUrl: vurl,
        });
        setLoading(false);
      }
      return;
    }
  }, [directResult, requestId]);

  // 결과를 로컬 스토리지에 캐싱 (찜보따리와 동기화용)
  useEffect(() => {
    if (result?.analysis && result?.videoId) {
      try {
        const key = `analysis_result_${result.videoId}`;
        localStorage.setItem(key, JSON.stringify(result.analysis));
      } catch (e) {
        console.warn('failed to cache analysis to localStorage', e);
      }
    }
  }, [result?.analysis, result?.videoId]);

  useEffect(() => {
    if (!requestId || directResult) return;

    // Firestore 실시간 리스닝
    const unsubscribe = onSnapshot(
      doc(db, "analysisRequests", requestId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();

          // 청크 분석 중일 때 partialResults 처리
          if (data.partialResults && data.partialResults.chunks) {
            // 청크를 chunkIndex 순서로 정렬
            const sortedChunks = [...data.partialResults.chunks].sort(
              (a, b) => a.chunkIndex - b.chunkIndex
            );

            // 정렬된 청크들을 하나의 배열로 병합
            const mergedWarnings = [];
            const mergedFlow = [];

            sortedChunks.forEach((chunk) => {
              if (chunk.warnings) mergedWarnings.push(...chunk.warnings);
              if (chunk.flow) mergedFlow.push(...chunk.flow);
            });

            // 임시 결과를 만들어서 화면에 표시
            const tempResult = {
              ...data,
              status: "processing", // 청크 분석 중임을 명시
              totalChunks: data.totalChunks,
              completedChunks: data.completedChunks,
              result: {
                warnings: mergedWarnings,
                flow: mergedFlow,
                chapters: [],
                summary: `분석 진행 중... (${data.completedChunks || 0}/${data.totalChunks || 0} 청크 완료)`,
                safetyScore: null,
                safetyDescription: "분석 중입니다...",
              },
            };

            setResult(tempResult);
          } else {
            // 일반 결과
            setResult(data);
          }

          if (data.status === "completed" || data.status === "error") {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  const handleEmailNotification = async () => {
    if (!user) {
      // 비로그인 상태: 로그인 유도
      const result = await Swal.fire({
        title: "로그인이 필요합니다",
        text: "분석 완료 시 이메일로 결과를 받으시려면 구글 로그인이 필요합니다.",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#4285f4",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "구글 로그인하기",
        cancelButtonText: "취소",
      });

      if (result.isConfirmed) {
        try {
          const loggedInUser = await loginWithGoogle();
          setEmailNotificationEnabled(true);

          // 로그인 직후 user 정보가 업데이트될 때까지 잠시 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const userEmail = loggedInUser?.user?.email || user?.email;

          if (userEmail) {
            await Swal.fire({
              title: "이메일 알림 설정 완료!",
              text: `분석이 완료되면 ${userEmail}로 결과를 보내드립니다.`,
              icon: "success",
              confirmButtonColor: "#3b82f6",
              timer: 2000,
            });

            // Firestore에 이메일 알림 요청 저장
            await updateDoc(doc(db, "analysisRequests", requestId), {
              sendEmail: true,
              userEmail: userEmail,
            });

            console.log("이메일 알림 설정 저장:", userEmail);
          } else {
            throw new Error("이메일 정보를 가져올 수 없습니다");
          }
        } catch (error) {
          console.error("Login error:", error);
          await Swal.fire({
            title: "오류",
            text: "로그인 중 문제가 발생했습니다. 다시 시도해주세요.",
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } else {
      // 로그인 상태: 이메일 알림 토글
      const newState = !emailNotificationEnabled;
      setEmailNotificationEnabled(newState);

      if (newState) {
        await Swal.fire({
          title: "이메일 알림 설정 완료!",
          text: `분석이 완료되면 ${user.email}로 결과를 보내드립니다.`,
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 2000,
        });

        // Firestore에 이메일 알림 요청 저장
        await updateDoc(doc(db, "analysisRequests", requestId), {
          sendEmail: true,
          userEmail: user.email,
        });

        console.log(
          "이메일 알림 설정 저장:",
          user.email,
          "requestId:",
          requestId
        );
      } else {
        await Swal.fire({
          title: "이메일 알림 해제",
          text: "이메일 알림이 해제되었습니다.",
          icon: "info",
          confirmButtonColor: "#6b7280",
          timer: 1500,
        });

        // Firestore에서 이메일 알림 해제
        await updateDoc(doc(db, "analysisRequests", requestId), {
          sendEmail: false,
        });
      }
    }
  };

  if (
    loading ||
    result?.status === "pending" ||
    result?.status === "processing"
  ) {
    // progress 또는 result에서 청크 정보 가져오기
    const totalChunks = progress?.totalChunks || result?.totalChunks || 0;
    const completedChunks = progress?.completedChunks || result?.completedChunks || 0;
    const isChunking = progress?.status === "chunking" || totalChunks > 0;

    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <div className="w-full p-12 bg-white rounded-lg shadow-xl text-center">
          <div className="mx-auto mb-6 w-12 h-12 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
          <h2 className="text-gray-900 text-xl font-semibold mb-2">
            영상 분석 중
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            콘텐츠를 분석하고 있습니다. 잠시만 기다려주세요.
            <br />
            <span className="text-xs text-gray-400">약 30초~1분 소요</span>
          </p>
        </div>

        {/* 긴 영상 감지 메시지 */}
        {isChunking && progress?.status === "chunking" && (
          <div className="w-full p-5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-amber-900 font-medium text-sm">
                  긴 영상 감지
                </h3>
                <p className="text-amber-700 text-xs mt-0.5">
                  {progress.message || `${totalChunks}개 구간으로 분할하여 분석합니다`}
                </p>
              </div>
            </div>
            <p className="text-amber-600 text-xs mt-3 pl-11">
              분석에 시간이 걸릴 수 있습니다. 이메일 알림을 설정해보세요.
            </p>
          </div>
        )}

        {/* 청크 분석 진행 상황 표시 */}
        {isChunking && progress?.status === "analyzing" && (
          <div className="w-full p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 font-medium text-sm">
                분석 진행 중
              </span>
              <span className="text-gray-900 font-semibold text-sm">
                {completedChunks}/{totalChunks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${totalChunks > 0 ? (completedChunks / totalChunks) * 100 : 0}%`,
                }}
              ></div>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {progress?.message || "영상을 구간별로 분석하고 있습니다."}
            </p>
          </div>
        )}

        {/* 이메일 알림 버튼 */}
        <button
          onClick={handleEmailNotification}
          className={`w-full py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            emailNotificationEnabled
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : user
              ? "bg-gray-900 hover:bg-gray-800 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {user
            ? emailNotificationEnabled
              ? "이메일 알림 설정됨"
              : "완료 시 이메일 받기"
            : "로그인 후 이메일 알림 받기"}
        </button>
      </div>
    );
  }

  if (result?.status === "error") {
    return (
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-gray-900 text-lg font-semibold">분석 실패</h2>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          {result.error || "알 수 없는 오류가 발생했습니다. 다시 시도해주세요."}
        </p>
      </div>
    );
  }

  if (!result?.analysis) {
    return null;
  }

  const { analysis } = result;

  // 제목 생성 헬퍼 함수
  const getVideoTitle = () => {
    // 1. analysis.title이 있으면 사용
    if (analysis.title && analysis.title.trim()) {
      return analysis.title;
    }

    // 2. summary의 첫 문장 사용 (최대 50자)
    if (analysis.summary && analysis.summary.trim()) {
      const firstSentence = analysis.summary.split(/[.!?]/)[0].trim();
      return firstSentence.length > 50
        ? firstSentence.substring(0, 50) + '...'
        : firstSentence;
    }

    // 3. intro가 있으면 사용
    if (analysis.intro && analysis.intro.trim()) {
      const firstSentence = analysis.intro.split(/[.!?]/)[0].trim();
      return firstSentence.length > 50
        ? firstSentence.substring(0, 50) + '...'
        : firstSentence;
    }

    // 4. 기본값
    return '영상 분석 결과';
  };

  const videoTitle = getVideoTitle();

  // 난이도 레벨에 따른 클래스 반환
  const getDifficultyClass = (level) => {
    if (!level) return '';
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('쉬움') || normalizedLevel.includes('단순')) return 'easy';
    if (normalizedLevel.includes('보통')) return 'medium';
    if (normalizedLevel.includes('어려움') || normalizedLevel.includes('복잡')) return 'hard';
    return 'medium';
  };

  return (
    <>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="analysis-header mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">분석 완료</h2>
              <p className="text-sm text-gray-500">영상 콘텐츠 안전성 분석 결과</p>
            </div>
          </div>
        </div>

        {/* YouTube 영상 플레이어 */}
        {result.videoId && (
          <div className="video-player-section mb-6">
            <div className="video-player-wrapper">
              <iframe
                ref={playerRef}
                src={`https://www.youtube.com/embed/${result.videoId}?enablejsapi=1&origin=${window.location.origin}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-player-iframe"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 아래 타임스탬프를 클릭하면 해당 시간으로 이동합니다
            </p>
          </div>
        )}

        {/* 안전 점수 및 카테고리별 등급 */}
        {analysis.safetyScore && (
          <div className="mb-6">
            {/* 종합 안전도 + 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div
                className={`flex flex-col items-center justify-center p-6 rounded-lg border ${
                  analysis.safetyScore >= 80
                    ? "bg-green-50 border-green-200"
                    : analysis.safetyScore >= 50
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <span
                  className={`text-lg font-semibold ${
                    analysis.safetyScore >= 80
                      ? "text-green-800"
                      : analysis.safetyScore >= 50
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  종합 안전도
                </span>
                <span
                  className={`text-5xl font-bold my-2 ${
                    analysis.safetyScore >= 80
                      ? "text-green-600"
                      : analysis.safetyScore >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {analysis.safetyScore >= 80
                    ? "🟢"
                    : analysis.safetyScore >= 50
                    ? "🟡"
                    : "🔴"}{" "}
                  {analysis.safetyScore}/100
                </span>
                <span className="text-sm text-gray-600">
                  {analysis.safetyDescription}
                </span>
              </div>

              {/* 요약 */}
              {analysis.summary && (
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    영상 요약
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              )}
            </div>

            {/* 카테고리별 안전 등급 (접기/펼치기) */}
            {analysis.categoryRatings && (
              <div className="collapsible-section">
                <button 
                  className="collapsible-header"
                  onClick={() => toggleSection('categoryRatings')}
                >
                  <div className="collapsible-title">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>카테고리별 안전 등급</span>
                  </div>
                  <svg 
                    className={`collapsible-chevron ${expandedSections.categoryRatings ? 'expanded' : ''}`} 
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {expandedSections.categoryRatings && (
                  <div className="collapsible-content">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <CategoryRatingCard category="sexuality" label="선정성" icon="🔞" rating={analysis.categoryRatings.sexuality} />
                      <CategoryRatingCard category="violence" label="폭력성" icon="⚔️" rating={analysis.categoryRatings.violence} />
                      <CategoryRatingCard category="profanity" label="언어" icon="🗣️" rating={analysis.categoryRatings.profanity} />
                      <CategoryRatingCard category="fear" label="공포" icon="👻" rating={analysis.categoryRatings.fear} />
                      <CategoryRatingCard category="drug" label="약물" icon="💊" rating={analysis.categoryRatings.drug} />
                      <CategoryRatingCard category="imitation" label="모방위험" icon="⚠️" rating={analysis.categoryRatings.imitation} />
                    </div>
                    <div className="rating-legend">
                      <div className="legend-item"><div className="legend-dot safe"></div><span>안전</span></div>
                      <div className="legend-item"><div className="legend-dot caution"></div><span>주의</span></div>
                      <div className="legend-item"><div className="legend-dot warning"></div><span>경고</span></div>
                      <div className="legend-item"><div className="legend-dot danger"></div><span>위험</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 이해도 분석 섹션 (접기/펼치기) */}
            {analysis.comprehensionAnalysis && (
              <div className="collapsible-section comprehension">
                <button 
                  className="collapsible-header"
                  onClick={() => toggleSection('comprehension')}
                >
                  <div className="collapsible-title">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>이해도 분석</span>
                    <span className="collapsible-badge">
                      {analysis.comprehensionAnalysis.recommendedAge || ""}
                    </span>
                  </div>
                  <svg 
                    className={`collapsible-chevron ${expandedSections.comprehension ? 'expanded' : ''}`} 
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                
                {expandedSections.comprehension && (
                  <div className="collapsible-content">
                    <div className="comprehension-grid">
                      <div className="comprehension-card recommended-age">
                        <div className="comprehension-card-header">
                          <span className="comprehension-label">AI 추천 연령</span>
                        </div>
                        <div className="comprehension-value-large">
                          {analysis.comprehensionAnalysis.recommendedAge || "분석 중"}
                        </div>
                        <p className="comprehension-disclaimer">
                          ⚠️ AI 추정치이며, 공식 등급이 아닙니다
                        </p>
                      </div>

                      <div className="comprehension-card difficulty-summary">
                        <div className="difficulty-item">
                          <span className="difficulty-label">어휘 수준</span>
                          <span className={`difficulty-badge ${getDifficultyClass(analysis.comprehensionAnalysis.vocabularyLevel)}`}>
                            {analysis.comprehensionAnalysis.vocabularyLevel || "-"}
                          </span>
                        </div>
                        <div className="difficulty-item">
                          <span className="difficulty-label">주제 복잡도</span>
                          <span className={`difficulty-badge ${getDifficultyClass(analysis.comprehensionAnalysis.topicComplexity)}`}>
                            {analysis.comprehensionAnalysis.topicComplexity || "-"}
                          </span>
                        </div>
                        <div className="difficulty-item">
                          <span className="difficulty-label">종합 난이도</span>
                          <span className={`difficulty-badge ${getDifficultyClass(analysis.comprehensionAnalysis.overallDifficulty)}`}>
                            {analysis.comprehensionAnalysis.overallDifficulty || "-"}
                          </span>
                        </div>
                      </div>
                      
                      {/* 🆕 콘텐츠 깊이 분석 - Apple 스타일 카드 */}
                      <div className="content-depth-card">
                        <div className="depth-card-header">
                          <span className="depth-card-title">콘텐츠 깊이</span>
                        </div>
                        
                        <div className="depth-metrics">
                          {/* 추상화 레벨 - 시각적 게이지 */}
                          <div className="depth-metric-item">
                            <div className="metric-icon-wrapper abstraction">
                              <span className="metric-icon">🧠</span>
                            </div>
                            <div className="metric-content">
                              <span className="metric-label">추상화 수준</span>
                              <div className="abstraction-gauge">
                                <div className="gauge-track">
                                  <div 
                                    className="gauge-fill"
                                    style={{ 
                                      width: `${((analysis.comprehensionAnalysis.abstractConceptLevel || 1) / 5) * 100}%` 
                                    }}
                                  />
                                  <div 
                                    className="gauge-indicator"
                                    style={{ 
                                      left: `${((analysis.comprehensionAnalysis.abstractConceptLevel || 1) / 5) * 100}%` 
                                    }}
                                  />
                                </div>
                                <div className="gauge-labels">
                                  <span>구체적</span>
                                  <span>추상적</span>
                                </div>
                              </div>
                            </div>
                            <span className={`metric-value-pill abstraction-level-${analysis.comprehensionAnalysis.abstractConceptLevel || 1}`}>
                              {(analysis.comprehensionAnalysis.abstractConceptLevel || 1) <= 2 ? '구체적' :
                               (analysis.comprehensionAnalysis.abstractConceptLevel || 1) <= 3 ? '경험적' : '추상적'}
                            </span>
                          </div>

                          {/* 어휘 밀도 */}
                          <div className="depth-metric-item">
                            <div className="metric-icon-wrapper lexical">
                              <span className="metric-icon">📝</span>
                            </div>
                            <div className="metric-content">
                              <span className="metric-label">어휘 밀도</span>
                              <span className="metric-desc">
                                {analysis.comprehensionAnalysis.lexicalDensity === 'Low' ? '일상 어휘 위주' :
                                 analysis.comprehensionAnalysis.lexicalDensity === 'High' ? '전문용어 다수' : '적절한 수준'}
                              </span>
                            </div>
                            <span className={`metric-value-pill lexical-${(analysis.comprehensionAnalysis.lexicalDensity || 'Medium').toLowerCase()}`}>
                              {analysis.comprehensionAnalysis.lexicalDensity === 'Low' ? '쉬움' :
                               analysis.comprehensionAnalysis.lexicalDensity === 'High' ? '어려움' : '보통'}
                            </span>
                          </div>

                          {/* 문장 복잡도 */}
                          <div className="depth-metric-item">
                            <div className="metric-icon-wrapper sentence">
                              <span className="metric-icon">💬</span>
                            </div>
                            <div className="metric-content">
                              <span className="metric-label">문장 구조</span>
                              <span className="metric-desc">
                                {analysis.comprehensionAnalysis.sentenceComplexity === 'Complex' ? '복문/수식어 다수' : '단문 위주'}
                              </span>
                            </div>
                            <span className={`metric-value-pill sentence-${(analysis.comprehensionAnalysis.sentenceComplexity || 'Simple').toLowerCase()}`}>
                              {analysis.comprehensionAnalysis.sentenceComplexity === 'Complex' ? '복잡' : '단순'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🎬 KMRB 등급 결과 - Google Material 스타일 */}
                      {analysis.ratingResult && (
                        <div className={`kmrb-rating-card ${analysis.ratingResult.isClassroomSafe ? 'safe' : 'unsafe'}`}>
                          {/* 상단: 등급 배지 + 상태 */}
                          <div className="kmrb-header">
                            <div className={`kmrb-badge ${
                              analysis.ratingResult.finalRating?.includes('전체') ? 'all' :
                              analysis.ratingResult.finalRating?.includes('12세') ? 'age12' :
                              analysis.ratingResult.finalRating?.includes('15세') ? 'age15' : 'adult'
                            }`}>
                              {analysis.ratingResult.finalRating?.replace('관람가', '') || '전체'}
                            </div>
                            <div className="kmrb-status">
                              <span className={`kmrb-status-dot ${analysis.ratingResult.isClassroomSafe ? 'safe' : 'unsafe'}`}></span>
                              <span className="kmrb-status-text">
                                {analysis.ratingResult.isClassroomSafe ? '교실 상영 가능' : '상영 주의'}
                              </span>
                            </div>
                          </div>
                          
                          {/* 주의 키워드 (있을 경우만) */}
                          {analysis.ratingResult.warningKeywords?.length > 0 && (
                            <div className="kmrb-warnings">
                              {analysis.ratingResult.warningKeywords.slice(0, 4).map((keyword, idx) => (
                                <span key={idx} className="kmrb-warning-tag">{keyword}</span>
                              ))}
                              {analysis.ratingResult.warningKeywords.length > 4 && (
                                <span className="kmrb-warning-more">+{analysis.ratingResult.warningKeywords.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="comprehension-details">
                      {analysis.comprehensionAnalysis.difficultWords?.length > 0 && (
                        <div className="detail-section">
                          <h5 className="detail-title">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            어려운 단어
                          </h5>
                          <div className="tag-list">
                            {analysis.comprehensionAnalysis.difficultWords.map((word, idx) => (
                              <span key={idx} className="tag tag-word">{word}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.comprehensionAnalysis.priorKnowledge?.length > 0 && (
                        <div className="detail-section">
                          <h5 className="detail-title">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            사전 지식 필요
                          </h5>
                          <div className="tag-list">
                            {analysis.comprehensionAnalysis.priorKnowledge.map((knowledge, idx) => (
                              <span key={idx} className="tag tag-knowledge">{knowledge}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.comprehensionAnalysis.abstractConcepts?.length > 0 && (
                        <div className="detail-section">
                          <h5 className="detail-title">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            추상적 개념
                          </h5>
                          <div className="tag-list">
                            {analysis.comprehensionAnalysis.abstractConcepts.map((concept, idx) => (
                              <span key={idx} className="tag tag-concept">{concept}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.comprehensionAnalysis.comprehensionNotes && (
                        <div className="comprehension-notes">
                          <p>{analysis.comprehensionAnalysis.comprehensionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 위험 구간 - 카테고리별 아이콘과 정확한 시간 표시 */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                주의 구간 <span className="text-red-600 font-bold">{analysis.warnings.length}개</span>
              </h3>
            </div>
            
            {/* 🆕 카테고리별 요약 통계 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(() => {
                const categoryIcons = {
                  profanity: { icon: "🗣️", label: "언어", color: "bg-orange-100 text-orange-700" },
                  violence: { icon: "⚔️", label: "폭력", color: "bg-red-100 text-red-700" },
                  sexuality: { icon: "🔞", label: "선정성", color: "bg-pink-100 text-pink-700" },
                  fear: { icon: "👻", label: "공포", color: "bg-purple-100 text-purple-700" },
                  drug: { icon: "💊", label: "약물", color: "bg-green-100 text-green-700" },
                  imitation: { icon: "⚠️", label: "모방위험", color: "bg-amber-100 text-amber-700" },
                };
                const counts = {};
                analysis.warnings.forEach(w => {
                  const cat = w.category || 'other';
                  counts[cat] = (counts[cat] || 0) + 1;
                });
                return Object.entries(counts).map(([cat, count]) => {
                  const info = categoryIcons[cat] || { icon: "❓", label: cat, color: "bg-gray-100 text-gray-700" };
                  return (
                    <span key={cat} className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                      {info.icon} {info.label} {count}건
                    </span>
                  );
                });
              })()}
            </div>
            
            <p className="text-gray-500 text-sm mb-4">
              💡 타임스탬프를 클릭하면 해당 시점으로 이동합니다.
            </p>
            <div className="space-y-3">
              {analysis.warnings.map((warning, idx) => {
                // 카테고리별 스타일 정의
                const categoryStyles = {
                  profanity: { icon: "🗣️", label: "언어/욕설", borderColor: "border-orange-500" },
                  violence: { icon: "⚔️", label: "폭력", borderColor: "border-red-600" },
                  sexuality: { icon: "🔞", label: "선정성", borderColor: "border-pink-500" },
                  fear: { icon: "👻", label: "공포", borderColor: "border-purple-500" },
                  drug: { icon: "💊", label: "약물", borderColor: "border-green-600" },
                  imitation: { icon: "⚠️", label: "모방위험", borderColor: "border-amber-500" },
                };
                const catStyle = categoryStyles[warning.category] || { icon: "❓", label: "기타", borderColor: "border-gray-400" };
                
                // severity에 따른 색상 선택
                const severityColors = {
                  high: {
                    bg: "bg-red-50",
                    text: "text-red-800",
                    label: "매우 부적절",
                    badgeBg: "bg-red-500",
                  },
                  medium: {
                    bg: "bg-yellow-50",
                    text: "text-yellow-800",
                    label: "주의 필요",
                    badgeBg: "bg-yellow-500",
                  },
                  low: {
                    bg: "bg-blue-50",
                    text: "text-blue-800",
                    label: "약간 주의",
                    badgeBg: "bg-blue-500",
                  },
                };
                const colors = severityColors[warning.severity] || severityColors.medium;

                return (
                  <div
                    key={idx}
                    className={`p-4 ${colors.bg} border-l-4 ${catStyle.borderColor} rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {/* 카테고리 아이콘 */}
                      <span className="text-xl" title={catStyle.label}>{catStyle.icon}</span>
                      
                      {/* 🆕 정확한 시간 표시 (분:초) */}
                      <button
                        onClick={() => seekToTime(warning.startTime || warning.timestamp)}
                        className={`text-base ${colors.text} font-bold flex items-center gap-1 hover:underline`}
                        title="클릭하면 해당 시점으로 이동"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        {warning.startTime && warning.endTime
                          ? `${warning.startTime} ~ ${warning.endTime}`
                          : warning.startTime || warning.timestamp || `구간 ${idx + 1}`}
                      </button>
                      
                      {/* 카테고리 라벨 */}
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        {catStyle.label}
                      </span>
                      
                      {/* 심각도 배지 */}
                      {warning.severity && (
                        <span className={`px-2 py-0.5 ${colors.badgeBg} text-white rounded text-xs font-bold`}>
                          {colors.label}
                        </span>
                      )}
                    </div>
                    
                    {/* 🆕 실제 문제가 된 대사/장면 인용 */}
                    {warning.quote && (
                      <div className="mb-2 p-3 bg-white/80 border-l-2 border-gray-400 rounded">
                        <p className="text-gray-900 text-sm font-medium leading-relaxed">
                          💬 "{warning.quote}"
                        </p>
                      </div>
                    )}
                    
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {warning.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주요 장면 타임라인 */}
        {analysis.chapters && analysis.chapters.length > 0 && (
          <div className="mb-6">
            {/* 찜/공유 버튼 영역 */}
            <div className="flex flex-row gap-3 mb-4 justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={async () => {
                  if (!user) {
                    await Swal.fire({
                      title: "로그인이 필요합니다",
                      text: "찜보따리 기능은 로그인 후 이용할 수 있습니다.",
                      icon: "info",
                      confirmButtonColor: "#4285f4",
                    });
                    return;
                  }

                  // 학년/과목/학기 선택 팝업
                  const { value: formValues } = await Swal.fire({
                    title: '찜보따리에 저장',
                    html: `
                      <div style="text-align: left;">
                        <div style="margin-bottom: 20px;">
                          <label style="display: block; font-weight: bold; margin-bottom: 8px;">
                            학년 선택 (필수)
                          </label>
                          <select id="swal-grade" class="swal2-input" style="width: 90%; margin: 0;">
                            <option value="">-- 학년을 선택하세요 --</option>
                            <option value="elementary-1">초등 1학년</option>
                            <option value="elementary-2">초등 2학년</option>
                            <option value="elementary-3">초등 3학년</option>
                            <option value="elementary-4">초등 4학년</option>
                            <option value="elementary-5">초등 5학년</option>
                            <option value="elementary-6">초등 6학년</option>
                          </select>
                        </div>

                        <div style="margin-bottom: 20px;">
                          <label style="display: block; font-weight: bold; margin-bottom: 8px;">
                            과목 선택 (필수)
                          </label>
                          <select id="swal-subject" class="swal2-input" style="width: 90%; margin: 0;">
                            <option value="">-- 과목을 선택하세요 --</option>
                            <option value="국어">국어</option>
                            <option value="도덕">도덕</option>
                            <option value="사회">사회</option>
                            <option value="수학">수학</option>
                            <option value="과학">과학</option>
                            <option value="실과">실과</option>
                            <option value="음악">음악</option>
                            <option value="미술">미술</option>
                            <option value="체육">체육</option>
                            <option value="영어">영어</option>
                          </select>
                        </div>

                        <div style="margin-bottom: 10px;">
                          <label style="display: block; font-weight: bold; margin-bottom: 8px;">
                            학기 선택 (선택)
                          </label>
                          <select id="swal-semester" class="swal2-input" style="width: 90%; margin: 0;">
                            <option value="">-- 선택 안함 --</option>
                            <option value="1">1학기</option>
                            <option value="2">2학기</option>
                          </select>
                        </div>

                        <p style="font-size: 12px; color: #666; margin-top: 15px;">
                          💡 학년과 과목 정보는 나중에 찜한 영상을 쉽게 찾는데 도움이 됩니다.
                        </p>
                      </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: '저장',
                    cancelButtonText: '취소',
                    confirmButtonColor: '#3b82f6',
                    cancelButtonColor: '#6b7280',
                    preConfirm: () => {
                      const grade = document.getElementById('swal-grade').value;
                      const subject = document.getElementById('swal-subject').value;
                      const semester = document.getElementById('swal-semester').value;

                      if (!grade) {
                        Swal.showValidationMessage('학년을 선택해주세요');
                        return false;
                      }
                      if (!subject) {
                        Swal.showValidationMessage('과목을 선택해주세요');
                        return false;
                      }

                      return { grade, subject, semester };
                    }
                  });

                  if (!formValues) {
                    return; // 취소된 경우
                  }

                  try {
                    // 분석 결과에 학년/과목/학기 정보 추가
                    const enrichedAnalysis = {
                      ...analysis,
                      metadata: {
                        grade: formValues.grade,
                        subject: formValues.subject,
                        semester: formValues.semester || null,
                      }
                    };

                    await addToJjim({
                      user,
                      videoUrl: result.videoUrl,
                      videoId: result.videoId,
                      analysis: enrichedAnalysis,
                      title: videoTitle,
                    });
                    await Swal.fire({
                      title: "찜 완료!",
                      text: "찜 보따리에 영상이 저장되었습니다.",
                      icon: "success",
                      confirmButtonColor: "#3b82f6",
                      timer: 1500,
                    });
                  } catch (err) {
                    await Swal.fire({
                      title: "오류",
                      text: err.message || "찜 저장 중 오류가 발생했습니다",
                      icon: "error",
                      confirmButtonColor: "#ef4444",
                    });
                  }
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                저장
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                onClick={async () => {
                  if (!user) {
                    await Swal.fire({
                      title: "로그인이 필요합니다",
                      text: "공유 기능은 로그인 후 이용할 수 있습니다.",
                      icon: "info",
                      confirmButtonColor: "#4285f4",
                    });
                    return;
                  }
                  try {
                    await shareToBoard({
                      user,
                      videoUrl: result.videoUrl,
                      videoId: result.videoId,
                      analysis,
                      title: videoTitle,
                      grade: analysis.gradeLevel || "",
                      subject: analysis.subject || "",
                      semester: analysis.semester || "",
                    });
                    await Swal.fire({
                      title: "공유 완료",
                      text: "풀어보따리에 영상이 공유되었습니다.",
                      icon: "success",
                      confirmButtonColor: "#3b82f6",
                      timer: 1500,
                    });
                  } catch (err) {
                    await Swal.fire({
                      title: "오류",
                      text: err.message || "공유 중 오류가 발생했습니다",
                      icon: "error",
                      confirmButtonColor: "#ef4444",
                    });
                  }
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                공유
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">주요 장면</h3>
            </div>
            <div className="space-y-2">
              {analysis.chapters.map((chapter, idx) => (
                <div
                  key={idx}
                  className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded hover:bg-blue-50 transition-colors"
                >
                  <button
                    onClick={() => seekToTime(chapter.timestamp)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {chapter.timestamp}
                  </button>
                  <span className="text-gray-800 ml-2">- {chapter.title}</span>
                  {chapter.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {chapter.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 흐름 요약 */}
        {analysis.flow && analysis.flow.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">영상 타임라인</h3>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              시간대별로 클릭하면 해당 구간으로 이동합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.flow.map((segment, idx) => (
                <div
                  key={idx}
                  className="flow-item p-3 bg-gray-50 border-l-4 border-green-500 rounded hover:bg-green-50 transition-colors"
                >
                  <button
                    onClick={() => seekToTime(segment.timestamp)}
                    className="timestamp-btn text-green-600 hover:text-green-800 font-bold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {segment.timestamp}
                  </button>
                  <p className="mt-1 text-sm text-gray-700 leading-snug">
                    {segment.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 하단 액션 버튼 영역 */}
      <div className="w-full max-w-4xl">
        <div className="action-buttons-grid">
          {/* YouTube에서 보기 */}
          <a
            href={result.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn action-btn-youtube"
          >
            <svg className="action-btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            YouTube에서 보기
          </a>

          {/* 찜보따리에 저장 */}
          <button
            onClick={() => {
              if (!user) {
                Swal.fire({
                  title: "로그인이 필요합니다",
                  text: "찜보따리 기능은 로그인 후 이용할 수 있습니다.",
                  icon: "info",
                  confirmButtonColor: "#4285f4",
                });
                return;
              }
              setShowSaveWizard(true);
            }}
            className="action-btn action-btn-save"
          >
            <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            찜보따리에 저장
          </button>

          {/* 다른 영상 분석 */}
          {onReset && (
            <button
              onClick={onReset}
              className="action-btn action-btn-new"
            >
              <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              다른 영상 분석
            </button>
          )}
        </div>
      </div>

      {/* SaveWizard 모달 */}
      {showSaveWizard && (
        <SaveWizard
          videoData={{
            url: result.videoUrl,
            title: videoTitle || analysis.title || "",
            tags: []
          }}
          user={user}
          onClose={() => setShowSaveWizard(false)}
          onSuccess={() => {
            setShowSaveWizard(false);
            Swal.fire({
              title: "저장 완료!",
              text: "찜보따리에 영상이 저장되었습니다.",
              icon: "success",
              confirmButtonColor: "#3b82f6",
              timer: 1500,
            });
          }}
        />
      )}
    </>
  );
}
