import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { generateSearchKeywords, quickAnalyzeVideo } from "../utils/gemini";
import { searchYouTubeVideos, getVideoTranscript } from "../utils/youtube";

export default function VideoRecommendationDirect({ onBack }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // 폼 상태
  const [gradeLevel, setGradeLevel] = useState("초등 6학년");
  const [subject, setSubject] = useState("미술");
  const [intention, setIntention] = useState("");
  const [preferredDuration, setPreferredDuration] = useState("");

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
      localStorage.setItem("safertube_recommend_limit", JSON.stringify(limitData));
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
    localStorage.setItem("safertube_recommend_limit", JSON.stringify(limitData));
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
          html: `오늘의 무료 추천 한도를 모두 사용했습니다.<br/>사용량: <b>${limitCheck.count}/${limitCheck.max}</b><br/><br/>${
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

      const keywords = await generateSearchKeywords(subject, intention, gradeLevel);
      console.log("🔍 검색어:", keywords);

      // 2단계: YouTube 검색
      await Swal.fire({
        title: "⚡ 빠른 추천 시작",
        html: `2단계: "${keywords.join(", ")}" 검색 중...`,
        icon: "info",
        showConfirmButton: false,
        timer: 1500,
      });

      const videos = await searchYouTubeVideos(keywords, 10, preferredDuration);
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

      // 안전도 순으로 정렬
      results.sort((a, b) => b.safetyScore - a.safetyScore);

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

  const handleReset = () => {
    setRecommendations(null);
    setGradeLevel("초등 6학년");
    setSubject("미술");
    setIntention("");
    setPreferredDuration("");
  };

  // 결과 화면
  if (recommendations) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            추천 영상 ({recommendations.videos.length}개)
          </h2>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            다시 검색
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.videos.map((video, idx) => (
            <div
              key={video.videoId}
              className="border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="flex gap-4">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-32 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">
                    {idx + 1}. {video.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {video.durationFormatted}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        video.safetyScore >= 85
                          ? "bg-green-100 text-green-800"
                          : video.safetyScore >= 65
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      안전도: {video.safetyScore}점
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {video.summary}
                  </p>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                  >
                    영상 보기 →
                  </a>
                </div>
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
              { short: "실과", full: "실과" },
              { short: "체육", full: "체육" },
              { short: "음악", full: "음악" },
              { short: "창체", full: "창의적 체험활동" },
              { short: "미정", full: "미정" },
            ].map((subj) => (
              <button
                key={subj.full}
                type="button"
                onClick={() => setSubject(subj.full)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold rounded-lg border transition-all ${
                  subject === subj.full
                    ? subj.full === "미정"
                      ? "text-white bg-purple-600 border-purple-600"
                      : "text-white bg-blue-600 border-blue-600"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                {subj.short}
                {subj.full === "미정" && <span className="ml-1 text-xs">✨</span>}
              </button>
            ))}
          </div>
          {subject === "미정" && (
            <p className="text-xs sm:text-sm text-purple-600 mt-2 font-medium">
              ✨ 해당 학년에 적합한 재미있고 교육적인 영상을 추천해드립니다
            </p>
          )}
        </div>

        {/* 3. 수업 의도 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            3. 수업 의도 (선택)
          </label>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="예: 학생들이 민주주의의 중요성을 이해하고..."
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
