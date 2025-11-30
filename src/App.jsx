import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import VideoInput from "./components/VideoInput";
import AnalysisResult from "./components/AnalysisResult";
import VideoRecommendationDirect from "./components/VideoRecommendationDirect";
import PhysicalArtsRecommendation from "./components/PhysicalArtsRecommendation";
import Board from "./components/Board";
import JjimList from "./components/JjimList";
import UserHistory from "./components/UserHistory";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";

function App() {
  const [mode, setMode] = useState("analyze");
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [currentProgress, setCurrentProgress] = useState({
    status: "",
    message: "",
    totalChunks: 0,
    completedChunks: 0,
  });

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

  return (
    <AuthProvider>
      <div className="app">
        <Header mode={mode} onModeChange={handleModeSelect} />

        {mode === "analyze" && !currentRequestId && (
          <VideoInput
            onAnalysisStart={handleAnalysisStart}
            onProgressUpdate={handleProgressUpdate}
            onBack={() => setMode("home")}
          />
        )}

        {mode === "analyze" && currentRequestId && (
          <div className="main-content">
            <AnalysisResult
              requestId={currentRequestId}
              directResult={currentResult}
              progress={currentProgress}
              onReset={handleReset}
            />
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
      </div>
    </AuthProvider>
  );
}

export default App;
