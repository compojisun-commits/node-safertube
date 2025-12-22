import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { analyzeVideo, analyzeVideoQuick } from "../utils/videoAnalysis";
import Swal from "sweetalert2";
import SaveWizard from "./SaveWizard";

const HISTORY_KEY = "tubering_search_history";
const MAX_HISTORY = 10;

// URL 타입 감지 함수
const detectUrlType = (url) => {
  if (!url || !url.trim()) return null;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // YouTube 패턴 감지
  if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  // 일반 URL 감지 (http/https로 시작)
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return 'generic';
  }
  
  // www로 시작하는 경우도 일반 URL로 처리
  if (trimmedUrl.startsWith('www.')) {
    return 'generic';
  }
  
  return null;
};

// 아이콘 컴포넌트들
const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function VideoInput({ onAnalysisStart, onProgressUpdate, onBack, autoAnalyzeRequest = null }) {
  const { user } = useAuth();
  // 멀티 링크 상태 (배열로 관리)
  const [links, setLinks] = useState([{ id: Date.now(), url: '' }]);
  const [loading, setLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("elementary-5-6");
  const [progress, setProgress] = useState({
    status: "",
    message: "",
    totalChunks: 0,
    completedChunks: 0,
  });
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [showSaveWizard, setShowSaveWizard] = useState(false);
  const [linksToSave, setLinksToSave] = useState([]); // 일괄 저장할 링크들
  const [searchHistory, setSearchHistory] = useState([]);
  const [autoAnalyzePending, setAutoAnalyzePending] = useState(false);

  // 검색 기록 로드
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // 찜보따리 등에서 넘어온 자동 분석 요청 처리
  useEffect(() => {
    if (autoAnalyzeRequest && autoAnalyzeRequest.videoUrl) {
      setLinks([{ id: Date.now(), url: autoAnalyzeRequest.videoUrl }]);
      if (autoAnalyzeRequest.gradeLevel) {
        setGradeLevel(autoAnalyzeRequest.gradeLevel);
      }
      setAutoAnalyzePending(true);
    }
  }, [autoAnalyzeRequest]);

  // 링크 세팅 후 자동 분석 실행
  useEffect(() => {
    if (autoAnalyzePending && links.length > 0 && links[0].url.trim() && !loading) {
      handleAnalyze();
      setAutoAnalyzePending(false);
    }
  }, [autoAnalyzePending, links, loading]);

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setSearchHistory(history);
    } catch (error) {
      console.error("검색 기록 로드 실패:", error);
      setSearchHistory([]);
    }
  };

  // 검색 기록에 추가 (분석 결과 포함 가능)
  const addToHistory = async (videoId, title, analysisResult = null) => {
    try {
      const newItem = {
        id: videoId,
        title: title || "제목 없음",
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        timestamp: Date.now(),
        hasAnalysis: !!analysisResult,
        analysisResult: analysisResult, // 분석 결과 저장
      };

      let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      
      // 중복 제거
      history = history.filter(item => item.id !== videoId);
      
      // 맨 앞에 추가
      history.unshift(newItem);
      
      // 최대 개수 제한
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error("검색 기록 저장 실패:", error);
    }
  };

  // 검색 기록에서 삭제
  const removeFromHistory = (videoId) => {
    try {
      let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      history = history.filter(item => item.id !== videoId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error("검색 기록 삭제 실패:", error);
    }
  };

  // 검색 기록 전체 삭제
  const clearAllHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
  };

  // 링크 추가
  const addLink = () => {
    setLinks([...links, { id: Date.now(), url: '' }]);
  };

  // 링크 삭제
  const removeLink = (id) => {
    if (links.length === 1) {
      // 마지막 하나는 삭제하지 않고 비우기만
      setLinks([{ id: Date.now(), url: '' }]);
    } else {
      setLinks(links.filter(link => link.id !== id));
    }
  };

  // 링크 URL 업데이트
  const updateLinkUrl = (id, newUrl) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, url: newUrl } : link
    ));
  };

  // 모든 링크의 타입 분석
  const analyzeLinks = () => {
    const filledLinks = links.filter(link => link.url.trim());
    const types = filledLinks.map(link => detectUrlType(link.url));
    
    const hasYoutube = types.includes('youtube');
    const hasGeneric = types.includes('generic');
    const hasAny = filledLinks.length > 0;
    
    // Case A: 아무것도 입력 안 됨
    if (!hasAny) {
      return { case: 'A', hasYoutube: false, hasGeneric: false };
    }
    
    // Case C: 일반 링크가 하나라도 섞여 있을 때
    if (hasGeneric) {
      return { case: 'C', hasYoutube, hasGeneric: true };
    }
    
    // Case B: 오직 유튜브 링크만 있을 때
    if (hasYoutube && !hasGeneric) {
      return { case: 'B', hasYoutube: true, hasGeneric: false };
    }
    
    return { case: 'A', hasYoutube: false, hasGeneric: false };
  };

  const linkAnalysis = analyzeLinks();

  // 검색 기록 클릭 시 바로 분석 시작
  const handleHistoryClick = async (item) => {
    // 이미 분석된 영상이면 바로 결과 페이지로 이동
    if (item.hasAnalysis && item.analysisResult) {
      onAnalysisStart(item.id, {
        status: "completed",
        analysis: item.analysisResult,
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      });
      return;
    }

    // 분석되지 않은 영상이면 바로 분석 시작
    const videoId = item.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 일일 한도 체크
    const checkDailyLimit = () => {
      const today = new Date().toDateString();
      const limitData = JSON.parse(
        localStorage.getItem("safertube_analysis_limit") || "{}"
      );
      if (limitData.date !== today) {
        limitData.date = today;
        limitData.count = 0;
      }
      const maxLimit = user ? 10 : 3;
      return {
        exceeded: limitData.count >= maxLimit,
        count: limitData.count,
        max: maxLimit,
      };
    };

    const limitInfo = checkDailyLimit();

    if (!isLocalDev && limitInfo.exceeded) {
      await Swal.fire({
        title: "하루 한도 초과",
        html: `오늘의 무료 분석 한도를 모두 사용했습니다.<br/>사용량: <b>${limitInfo.count}/${limitInfo.max}</b>`,
        icon: "warning",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeVideo(
        videoUrl,
        videoId,
        gradeLevel,
        (progressInfo) => {
          setProgress(progressInfo);
          onProgressUpdate?.(progressInfo);
          if (progressInfo.status === "chunking" && !hasStartedAnalysis) {
            setHasStartedAnalysis(true);
            onAnalysisStart(videoId, {
              status: "processing",
              analysis: null,
            });
          }
        }
      );

      if (!isLocalDev) {
        const limitData = JSON.parse(
          localStorage.getItem("safertube_analysis_limit") || "{}"
        );
        limitData.count = (limitData.count || 0) + 1;
        localStorage.setItem(
          "safertube_analysis_limit",
          JSON.stringify(limitData)
        );
      }

      // 분석 결과와 함께 검색 기록 업데이트
      addToHistory(videoId, item.title, result);

      onAnalysisStart(videoId, {
        status: "completed",
        analysis: result,
        videoId: videoId,
        videoUrl: videoUrl,
      });
    } catch (error) {
      console.error("영상 분석 실패:", error);
      await Swal.fire({
        title: "분석 실패",
        text: error.message || "영상 분석 중 오류가 발생했습니다",
        icon: "error",
        confirmButtonColor: "#dc3232",
      });
    } finally {
      setLoading(false);
      setProgress({
        status: "",
        message: "",
        totalChunks: 0,
        completedChunks: 0,
      });
      setHasStartedAnalysis(false);
    }
  };

  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // YouTube 제목 가져오기 (oEmbed API 사용)
  const fetchVideoTitle = async (videoUrl) => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return data.title || "";
      }
    } catch (error) {
      console.error("YouTube 제목 가져오기 실패:", error);
    }
    return "";
  };

  // 일괄 찜보따리 담기 (일반 링크 포함)
  const handleBulkSave = async () => {
    // 로그인 확인
    if (!user) {
      await Swal.fire({
        title: "로그인 필요",
        text: "찜보따리 기능은 로그인 후 사용 가능합니다",
        icon: "info",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    // 유효한 링크들만 필터링
    const validLinks = links.filter(link => {
      const type = detectUrlType(link.url);
      return type !== null;
    });

    if (validLinks.length === 0) {
      await Swal.fire({
        title: "유효한 URL 없음",
        text: "저장할 수 있는 유효한 URL을 입력해주세요",
        icon: "warning",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    // 링크 정보 수집 (제목 가져오기)
    const linksWithInfo = await Promise.all(
      validLinks.map(async (link) => {
        const type = detectUrlType(link.url);
        let title = "";
        let thumbnail = "";
        
        if (type === 'youtube') {
          const videoId = extractVideoId(link.url);
          title = await fetchVideoTitle(link.url);
          thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";
        } else {
          // 일반 URL의 경우 도메인 추출
          try {
            const urlObj = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
            title = urlObj.hostname;
            thumbnail = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
          } catch {
            title = link.url;
          }
        }
        
        return {
          url: link.url,
          title,
          thumbnail,
          type
        };
      })
    );

    setLinksToSave(linksWithInfo);
    setShowSaveWizard(true);
  };

  // 유튜브 영상 분석하기 (기존 handleSubmit 대체)
  // mode: 'quick' (간편분석) | 'detailed' (상세분석)
  const handleAnalyze = async (mode = 'detailed') => {
    // 유튜브 링크만 필터링
    const youtubeLinks = links.filter(link => detectUrlType(link.url) === 'youtube');
    
    if (youtubeLinks.length === 0) {
      await Swal.fire({
        title: "YouTube URL 필요",
        text: "분석할 YouTube URL을 입력해주세요",
        icon: "warning",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    // 첫 번째 유튜브 링크로 분석 시작 (기존 로직 유지)
    const url = youtubeLinks[0].url;
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      alert("유효한 YouTube URL을 입력해주세요");
      return;
    }

    const isLocalDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const checkDailyLimit = () => {
      const today = new Date().toDateString();
      const limitData = JSON.parse(
        localStorage.getItem("safertube_analysis_limit") || "{}"
      );
      if (limitData.date !== today) {
        limitData.date = today;
        limitData.count = 0;
      }
      const maxLimit = user ? 10 : 3;
      return {
        exceeded: limitData.count >= maxLimit,
        count: limitData.count,
        max: maxLimit,
      };
    };

    const limitInfo = checkDailyLimit();

    if (!isLocalDev && limitInfo.exceeded) {
      await Swal.fire({
        title: "하루 한도 초과",
        html: `오늘의 무료 분석 한도를 모두 사용했습니다.<br/>사용량: <b>${limitInfo.count}/${limitInfo.max}</b>`,
        icon: "warning",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    setLoading(true);

    // 제목 먼저 가져오기
    const title = await fetchVideoTitle(url);

    try {
      // 간편분석 vs 상세분석 안내
      if (mode === 'quick') {
        await Swal.fire({
          title: "⚡ 간편분석 시작",
          html: `
            <div style="text-align: left; line-height: 1.6;">
              <p style="margin-bottom: 10px;">자막 기반으로 빠르게 안전도를 확인합니다.</p>
              <div style="background-color: #e8f4fd; padding: 12px; border-radius: 8px; margin-top: 10px;">
                <p style="margin: 0; color: #2563eb; font-size: 14px;">
                  <b>⚡ 5~15초 내 완료!</b><br/>
                  종합 안전 점수와 유해 구간만 빠르게 확인하세요.
                </p>
              </div>
            </div>
          `,
          icon: "info",
          confirmButtonText: "확인",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        await Swal.fire({
          title: "🔍 상세분석 시작",
          html: `
            <div style="text-align: left; line-height: 1.6;">
              <p style="margin-bottom: 10px;">프론트엔드에서 직접 영상을 분석합니다.</p>
              <div style="background-color: #fff4f4; padding: 12px; border-radius: 8px; margin-top: 10px;">
                <p style="margin: 0; color: #dc3232; font-size: 14px;">
                  <b>🔍 정밀한 분석</b><br/>
                  장면과 소리, 자막 모두를 분석합니다.<br/>
                  분석 시간이 조금 더 소요됩니다.
                </p>
              </div>
            </div>
          `,
          icon: "info",
          confirmButtonText: "확인",
          confirmButtonColor: "#dc3232",
          timer: 3000,
          timerProgressBar: true,
        });
      }

      // 분석 함수 선택 (간편 vs 상세)
      const analyzeFunction = mode === 'quick' ? analyzeVideoQuick : analyzeVideo;
      
      const result = await analyzeFunction(
        `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        gradeLevel,
        (progressInfo) => {
          setProgress(progressInfo);
          onProgressUpdate?.(progressInfo);
          if (progressInfo.status === "chunking" && !hasStartedAnalysis) {
            setHasStartedAnalysis(true);
            onAnalysisStart(videoId, {
              status: "processing",
              analysis: null,
              analysisType: mode, // 분석 타입 전달
            });
          }
        }
      );

      if (!isLocalDev) {
        const limitData = JSON.parse(
          localStorage.getItem("safertube_analysis_limit") || "{}"
        );
        limitData.count = (limitData.count || 0) + 1;
        localStorage.setItem(
          "safertube_analysis_limit",
          JSON.stringify(limitData)
        );
      }

      // 분석 결과와 함께 검색 기록에 추가
      addToHistory(videoId, title, result);

      onAnalysisStart(videoId, {
        status: "completed",
        analysis: result,
        videoId: videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        analysisType: mode, // 간편/상세 구분
      });
      
      // 입력창 초기화
      setLinks([{ id: Date.now(), url: '' }]);
    } catch (error) {
      console.error("영상 분석 실패:", error);
      await Swal.fire({
        title: "분석 실패",
        text: error.message || "영상 분석 중 오류가 발생했습니다",
        icon: "error",
        confirmButtonColor: "#dc3232",
      });
    } finally {
      setLoading(false);
      setProgress({
        status: "",
        message: "",
        totalChunks: 0,
        completedChunks: 0,
      });
      setHasStartedAnalysis(false);
    }
  };

  const handleSaveWizardSuccess = async () => {
    setShowSaveWizard(false);
    const count = linksToSave.length;
    await Swal.fire({
      title: "저장 완료!",
      text: count > 1 
        ? `${count}개의 링크가 찜보따리에 추가되었습니다` 
        : "찜보따리에 링크가 추가되었습니다",
      icon: "success",
      confirmButtonColor: "#3b82f6",
      timer: 2000,
    });
    // 입력창 초기화
    setLinks([{ id: Date.now(), url: '' }]);
    setLinksToSave([]);
  };

  return (
    <div className="main-content">
      {/* 로고 이미지 */}
      <img
        src="/logo_large.png"
        alt="튜브링"
        className="main-logo"
      />

      {/* 태그라인 */}
      <div className="tagline">
        <p>유튜브의 바다에서</p>
        <p>
          수업 자료만 <span className="highlight-red">안전하게</span> 건져내세요
        </p>
      </div>

      {/* 검색 컨테이너 */}
      <div className="search-container">
        <div className="multi-link-form">
          {/* 멀티 링크 입력 영역 */}
          <div className="multi-link-inputs">
            {links.map((link, index) => {
              const urlType = detectUrlType(link.url);
              return (
                <div key={link.id} className={`link-input-row ${urlType ? `type-${urlType}` : ''}`}>
                  {/* URL 타입 아이콘 */}
                  <div className={`link-type-icon ${urlType || 'empty'}`}>
                    {urlType === 'youtube' ? (
                      <YoutubeIcon />
                    ) : urlType === 'generic' ? (
                      <GlobeIcon />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8M12 8v8"/>
                      </svg>
                    )}
                  </div>
                  
                  {/* URL 입력창 */}
                  <input
                    type="text"
                    className="link-input"
                    value={link.url}
                    onChange={(e) => updateLinkUrl(link.id, e.target.value)}
                    placeholder={index === 0 ? "YouTube 또는 웹사이트 URL을 입력하세요" : "추가 URL 입력"}
                    disabled={loading}
                  />
                  
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    className="link-remove-btn"
                    onClick={() => removeLink(link.id)}
                    disabled={loading}
                    title="삭제"
                  >
                    <XIcon />
                  </button>
                </div>
              );
            })}
          </div>

          {/* 링크 추가 버튼 */}
          <button
            type="button"
            className="add-link-btn"
            onClick={addLink}
            disabled={loading}
          >
            <PlusIcon />
            <span>링크 추가하기</span>
          </button>

          {/* 액션 버튼들 */}
          {linkAnalysis.case === 'A' && (
            // Case A: 입력 없음 - 비활성화 버튼
            <button
              type="button"
              className="smart-btn disabled"
              disabled={true}
            >
              URL을 입력하세요
            </button>
          )}

          {linkAnalysis.case === 'B' && (
            // Case B: 유튜브만 - 세 버튼 표시 (찜보따리 + 간편분석 + 상세분석)
            <div className="action-buttons-container">
              <button
                type="button"
                className="btn-jjim-new"
                onClick={handleBulkSave}
                disabled={loading}
              >
                🎁 찜보따리 넣기
              </button>
              <div className="analysis-buttons-row">
                <button
                  type="button"
                  className="btn-quick-analyze"
                  onClick={() => handleAnalyze('quick')}
                  disabled={loading}
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">
                    <span className="btn-main">간편분석</span>
                    <span className="btn-sub">안전도만 빠르게</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-detailed-analyze"
                  onClick={() => handleAnalyze('detailed')}
                  disabled={loading}
                >
                  <span className="btn-icon">🔍</span>
                  <span className="btn-text">
                    <span className="btn-main">상세분석</span>
                    <span className="btn-sub">전체 분석</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {linkAnalysis.case === 'C' && (
            // Case C: 일반 링크 포함 - 일괄 저장 버튼만
            <>
              <button
                type="button"
                className="smart-btn secondary"
                onClick={handleBulkSave}
                disabled={loading}
              >
                {loading ? "처리중..." : "🎁 일괄 찜보따리에 담기"}
              </button>
              <div className="bulk-save-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>일반 링크는 분석 없이 바로 저장됩니다</span>
              </div>
            </>
          )}
        </div>

        {/* 진행 상황 표시 */}
        {loading && progress.totalChunks > 0 && progress.message && (
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">{progress.message}</span>
              <span className="progress-count">
                {progress.completedChunks}/{progress.totalChunks}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(progress.completedChunks / progress.totalChunks) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 하단 안내 */}
        <div className={`info-footer ${user ? 'logged-in' : ''}`}>
          {user ? (
            <span>✅ 로그인 완료 - 하루 10개 영상 분석 가능</span>
          ) : (
            <span>⚠️ 비로그인 - 하루 3개 / 로그인 시 10개</span>
          )}
        </div>

        {/* 최근 검색 기록 */}
        {searchHistory.length > 0 && (
          <div className="search-history">
            <div className="history-header">
              <span className="history-title">최근 검색</span>
              <button 
                className="history-clear-all"
                onClick={clearAllHistory}
              >
                전체 삭제
              </button>
            </div>
            <div className="history-grid">
              {searchHistory.map((item) => (
                <div 
                  key={item.id} 
                  className={`history-item ${item.hasAnalysis ? 'analyzed' : ''} ${loading ? 'disabled' : ''}`}
                  onClick={() => !loading && handleHistoryClick(item)}
                  title={item.hasAnalysis ? "분석 결과 보기" : "클릭하여 분석 시작"}
                >
                  <div className="history-thumbnail-wrapper">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="history-thumbnail"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${item.id}/default.jpg`;
                      }}
                    />
                    {/* 호버 시 재생/분석 아이콘 */}
                    <div className="history-play-overlay">
                      {item.hasAnalysis ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M9 15l2 2 4-4"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </div>
                    {/* 분석 완료 배지 */}
                    {item.hasAnalysis && (
                      <div className="history-analyzed-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}
                    <button
                      className="history-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      title="삭제"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <p className="history-item-title">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SaveWizard 모달 - 멀티 링크 지원 */}
      {showSaveWizard && (
        <SaveWizard
          videoData={linksToSave.length === 1 ? {
            url: linksToSave[0].url,
            title: linksToSave[0].title,
            thumbnail: linksToSave[0].thumbnail,
            type: linksToSave[0].type,
            tags: []
          } : null}
          multiLinks={linksToSave.length > 1 ? linksToSave : null}
          user={user}
          onClose={() => {
            setShowSaveWizard(false);
            setLinksToSave([]);
          }}
          onSuccess={handleSaveWizardSuccess}
        />
      )}
    </div>
  );
}
