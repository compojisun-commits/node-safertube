import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import SaveWizard from "./SaveWizard";

// 타임스탬프를 초 단위로 변환
const parseTimestampToSeconds = (timestamp) => {
  if (!timestamp) return 0;
  const parts = timestamp.split(":").map((p) => parseInt(p) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

// 점수에 따른 등급 색상
const getScoreColor = (score) => {
  if (score >= 85) return { bg: "#10b981", text: "안전", class: "safe" };
  if (score >= 70) return { bg: "#f59e0b", text: "주의", class: "caution" };
  if (score >= 50) return { bg: "#f97316", text: "경고", class: "warning" };
  return { bg: "#ef4444", text: "위험", class: "danger" };
};

// 심각도 색상
const getSeverityStyle = (severity) => {
  switch (severity) {
    case "high":
      return { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "심각" };
    case "medium":
      return { bg: "#fffbeb", border: "#fde68a", text: "#d97706", label: "주의" };
    case "low":
      return { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", label: "경미" };
    default:
      return { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280", label: "-" };
  }
};

// 카테고리 한글명
const getCategoryLabel = (category) => {
  const labels = {
    sexuality: "선정성",
    violence: "폭력성",
    profanity: "욕설",
    fear: "공포",
    drug: "약물",
    imitation: "모방위험",
  };
  return labels[category] || category;
};

export default function QuickAnalysisResult({ 
  result, 
  videoId, 
  videoUrl, 
  onReset, 
  onDetailedAnalysis 
}) {
  const { user } = useAuth();
  const playerRef = useRef(null);
  const [showSaveWizard, setShowSaveWizard] = useState(false);

  const analysis = result?.analysis || result;
  const safetyScore = analysis?.safetyScore;
  const noTranscript = analysis?.noTranscript === true;
  const scoreInfo = safetyScore ? getScoreColor(safetyScore) : { bg: "#6b7280", text: "분석필요", class: "unknown" };
  const warnings = analysis?.warnings || [];

  // 유튜브 플레이어 시간 이동
  const seekToTime = (timestamp) => {
    const seconds = parseTimestampToSeconds(timestamp);
    if (playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
        "*"
      );
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 찜보따리 저장
  const handleSaveToJjim = async () => {
    if (!user) {
      await Swal.fire({
        title: "로그인 필요",
        text: "찜보따리 기능은 로그인 후 사용 가능합니다",
        icon: "info",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setShowSaveWizard(true);
  };

  return (
    <div className="quick-result-container">
      {/* 상단 헤더 */}
      <div className="quick-result-header">
        <button className="back-button" onClick={onReset}>
          ← 돌아가기
        </button>
        <span className="quick-badge">⚡ 간편분석 결과</span>
      </div>

      {/* 영상 플레이어 */}
      <div className="video-player-section">
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="video-iframe"
        />
      </div>

      {/* 제목 */}
      <h2 className="video-title">{analysis?.title || "영상 분석 결과"}</h2>

      {/* 종합 안전 점수 */}
      {noTranscript ? (
        /* 자막 없음 - 상세분석 권장 UI */
        <div className="no-transcript-card">
          <div className="no-transcript-icon">📝</div>
          <h3>자막이 없는 영상입니다</h3>
          <p>간편분석은 자막 기반으로 빠르게 분석합니다.<br/>
          자막이 없어 <strong>상세분석</strong>을 권장드립니다.</p>
          <button className="btn-detailed-large" onClick={onDetailedAnalysis}>
            🔍 상세분석으로 정확히 분석하기
          </button>
        </div>
      ) : (
        <div className={`safety-score-card ${scoreInfo.class}`}>
          <div className="score-circle" style={{ borderColor: scoreInfo.bg }}>
            <span className="score-number" style={{ color: scoreInfo.bg }}>
              {safetyScore}
            </span>
            <span className="score-label">점</span>
          </div>
          <div className="score-info">
            <span className="score-badge" style={{ backgroundColor: scoreInfo.bg }}>
              {scoreInfo.text}
            </span>
            <p className="score-description">
              {analysis?.safetyDescription || "분석이 완료되었습니다."}
            </p>
          </div>
        </div>
      )}

      {/* 등급 정보 */}
      <div className="rating-info">
        <span className="rating-label">영상등급</span>
        <span className="rating-value">{analysis?.overallRating || "전체관람가"}</span>
      </div>

      {/* 영상 요약 */}
      {analysis?.summary && (
        <div className="summary-section">
          <h3>📝 영상 요약</h3>
          <p>{analysis.summary}</p>
        </div>
      )}

      {/* 유해 구간 목록 */}
      <div className="warnings-section">
        <h3>⚠️ 유해 구간 ({warnings.length}개)</h3>
        {warnings.length === 0 ? (
          <div className="no-warnings">
            <span className="check-icon">✅</span>
            <p>부적절한 내용이 발견되지 않았습니다.</p>
          </div>
        ) : (
          <div className="warnings-list">
            {warnings.map((warning, idx) => {
              const style = getSeverityStyle(warning.severity);
              // 새 형식(time, issue) 또는 기존 형식(startTime, description) 모두 지원
              const timeDisplay = warning.time || warning.startTime || "0:00";
              const issueText = warning.issue || warning.description || "주의 필요";
              return (
                <div
                  key={idx}
                  className="warning-item"
                  style={{ 
                    backgroundColor: style.bg, 
                    borderColor: style.border 
                  }}
                  onClick={() => seekToTime(timeDisplay)}
                >
                  <div className="warning-header">
                    <span 
                      className="warning-time"
                      style={{ color: style.text }}
                    >
                      {timeDisplay}
                    </span>
                    <span 
                      className="warning-severity"
                      style={{ backgroundColor: style.text }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="warning-description">{issueText}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="action-buttons">
        <button className="btn-save" onClick={handleSaveToJjim}>
          🎁 찜보따리에 저장
        </button>
        <button className="btn-detailed" onClick={onDetailedAnalysis}>
          🔍 상세분석 하기
        </button>
      </div>

      {/* 안내 메시지 */}
      <p className="tip-message">
        💡 더 자세한 분석(카테고리별 등급, 이해도 분석 등)이 필요하시면 상세분석을 이용하세요.
      </p>

      {/* SaveWizard 모달 */}
      {showSaveWizard && (
        <SaveWizard
          videoData={{
            url: videoUrl,
            title: analysis?.title || "제목 없음",
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            type: "youtube",
            tags: [],
            safetyScore: safetyScore,
          }}
          user={user}
          onClose={() => setShowSaveWizard(false)}
          onSuccess={async () => {
            setShowSaveWizard(false);
            await Swal.fire({
              title: "저장 완료!",
              text: "찜보따리에 영상이 추가되었습니다.",
              icon: "success",
              confirmButtonColor: "#3b82f6",
              timer: 2000,
            });
          }}
        />
      )}
    </div>
  );
}

