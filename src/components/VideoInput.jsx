import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { analyzeVideo } from "../utils/videoAnalysis";
import Swal from "sweetalert2";
import SaveWizard from "./SaveWizard";

const HISTORY_KEY = "tubering_search_history";
const MAX_HISTORY = 10;

export default function VideoInput({ onAnalysisStart, onProgressUpdate, onBack }) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
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
  const [videoTitle, setVideoTitle] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);

  // 검색 기록 로드
  useEffect(() => {
    loadSearchHistory();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      await Swal.fire({
        title: "분석 시작",
        html: `
          <div style="text-align: left; line-height: 1.6;">
            <p style="margin-bottom: 10px;">프론트엔드에서 직접 영상을 분석합니다.</p>
            <div style="background-color: #fff4f4; padding: 12px; border-radius: 8px; margin-top: 10px;">
              <p style="margin: 0; color: #dc3232; font-size: 14px;">
                <b>⚡ 정확하고 빠른 분석</b><br/>
                장면과 소리, 자막 모두를 분석하고 있습니다.<br/>
                <br/>
                분석 진행 상황을 실시간으로 확인하세요!
              </p>
            </div>
          </div>
        `,
        icon: "info",
        confirmButtonText: "확인",
        confirmButtonColor: "#dc3232",
        timer: 5000,
        timerProgressBar: true,
      });

      const result = await analyzeVideo(
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
      });
      setUrl("");
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

  const handleDirectAdd = async () => {
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

    // URL 유효성 검사
    const videoId = extractVideoId(url);
    if (!videoId) {
      await Swal.fire({
        title: "잘못된 URL",
        text: "유효한 YouTube URL을 입력해주세요",
        icon: "warning",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    // YouTube 제목 가져오기
    const title = await fetchVideoTitle(url);
    setVideoTitle(title);

    // SaveWizard 모달 열기
    setShowSaveWizard(true);
  };

  const handleSaveWizardSuccess = async () => {
    setShowSaveWizard(false);
    await Swal.fire({
      title: "저장 완료!",
      text: "찜보따리에 링크가 추가되었습니다",
      icon: "success",
      confirmButtonColor: "#3b82f6",
      timer: 2000,
    });
    setUrl("");
    setVideoTitle("");
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
        <form onSubmit={handleSubmit}>
          {/* 검색 박스 */}
          <div className="search-box">
            <div className="search-icon">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="search-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube URL을 입력하세요"
              disabled={loading}
            />
          </div>

          {/* 버튼들 */}
          <div className="buttons-container">
            <button
              type="button"
              className="btn-jjim"
              onClick={handleDirectAdd}
              disabled={!url}
            >
              찜보따리 넣기
            </button>
            <button
              type="submit"
              className="btn-analyze"
              disabled={loading || !url}
            >
              {loading ? "분석중..." : "영상 분석하기"}
            </button>
          </div>
        </form>

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

      {/* SaveWizard 모달 */}
      {showSaveWizard && (
        <SaveWizard
          videoData={{
            url: url,
            title: videoTitle,
            tags: []
          }}
          user={user}
          onClose={() => {
            setShowSaveWizard(false);
            setVideoTitle("");
          }}
          onSuccess={handleSaveWizardSuccess}
        />
      )}
    </div>
  );
}
