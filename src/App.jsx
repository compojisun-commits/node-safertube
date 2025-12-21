import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import VideoInput from "./components/VideoInput";
import AnalysisResult from "./components/AnalysisResult";
import QuickAnalysisResult from "./components/QuickAnalysisResult";
import VideoRecommendationDirect from "./components/VideoRecommendationDirect";
import PhysicalArtsRecommendation from "./components/PhysicalArtsRecommendation";
import Board from "./components/Board";
import JjimList from "./components/JjimList";
import UserHistory from "./components/UserHistory";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import NewSettingsModal from "./components/NewSettingsModal";

function AppContent() {
  const { user } = useAuth();
  // 🆕 localStorage에서 초기 화면 설정 읽기
  const [mode, setMode] = useState(() => {
    try {
      const savedLanding = localStorage.getItem('default_landing_page');
      // analyze, recommend, jjim 중 하나로 매핑
      if (savedLanding === 'recommend') return 'recommend';
      if (savedLanding === 'jjim') return 'jjim';
      return 'analyze'; // 기본값
    } catch {
      return 'analyze';
    }
  });
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [currentProgress, setCurrentProgress] = useState({
    status: "",
    message: "",
    totalChunks: 0,
    completedChunks: 0,
  });
  const [showSettings, setShowSettings] = useState(false);

  const handleAnalysisStart = (requestId, result = null) => {
    setCurrentRequestId(requestId);
    setCurrentResult(result);
  };

  const handleProgressUpdate = (progress) => {
    setCurrentProgress(progress);
  };

  const handleReset = () => {
    setCurrentRequestId(null);
    setCurrentResult(null);
    setCurrentProgress({
      status: "",
      message: "",
      totalChunks: 0,
      completedChunks: 0,
    });
    setMode("analyze");
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setCurrentRequestId(null);
    setCurrentResult(null);
  };

  const handleFooterNavigate = (page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMode(page);
    setCurrentRequestId(null);
    setCurrentResult(null);
  };

  const handleSettingsClick = () => {
    if (user) {
      setShowSettings(true);
    }
  };

  return (
    <div className="app">
      <Header 
        mode={mode} 
        onModeChange={handleModeSelect} 
        onSettingsClick={handleSettingsClick}
      />

        {mode === "analyze" && !currentRequestId && (
          <VideoInput
            onAnalysisStart={handleAnalysisStart}
            onProgressUpdate={handleProgressUpdate}
            onBack={() => setMode("home")}
          />
        )}

        {mode === "analyze" && currentRequestId && (
          <div className="main-content">
            {/* 간편분석 결과 vs 상세분석 결과 */}
            {currentResult?.analysisType === "quick" ? (
              <QuickAnalysisResult
                result={currentResult}
                videoId={currentResult?.videoId || currentRequestId}
                videoUrl={currentResult?.videoUrl}
                onReset={handleReset}
                onDetailedAnalysis={() => {
                  // 상세분석으로 전환 (같은 영상을 상세분석)
                  handleAnalysisStart(currentRequestId, {
                    ...currentResult,
                    analysisType: "detailed",
                    status: "pending-detailed", // 상세분석 대기 상태
                  });
                }}
              />
            ) : (
              <AnalysisResult
                requestId={currentRequestId}
                directResult={currentResult}
                progress={currentProgress}
                onReset={handleReset}
              />
            )}
          </div>
        )}

        {mode === "recommend" && (
          <div className="main-content">
            <VideoRecommendationDirect onBack={() => setMode("home")} />
          </div>
        )}

        {mode === "physical-arts" && (
          <div className="main-content">
            <PhysicalArtsRecommendation onBack={() => setMode("home")} />
          </div>
        )}

        {mode === "board" && (
          <div className="main-content">
            <Board onBack={() => setMode("home")} />
          </div>
        )}

        {mode === "jjim" && (
          <div className="main-content">
            <JjimList onBack={() => setMode("home")} />
          </div>
        )}

        {mode === "history" && (
          <div className="main-content">
            <UserHistory onBack={() => setMode("analyze")} />
          </div>
        )}

        {mode === "terms" && (
          <div className="main-content">
            <Terms onBack={() => setMode("home")} />
          </div>
        )}

        {mode === "privacy" && (
          <div className="main-content">
            <Privacy onBack={() => setMode("home")} />
          </div>
        )}

        <Footer onNavigate={handleFooterNavigate} />

        {/* 설정 모달 */}
        <NewSettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
