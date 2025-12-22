import { useState } from "react";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import RecommendationResult from "./RecommendationResult";
import Swal from "sweetalert2";

export default function VideoRecommendation({ onBack }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // 폼 상태
  const [gradeLevel, setGradeLevel] = useState("초등 고학년");
  const [subject, setSubject] = useState("미술");
  const [intention, setIntention] = useState(""); // 수업 의도
  const [preferredDuration, setPreferredDuration] = useState(""); // 선호 영상 길이
  const [materials, setMaterials] = useState([]);
  const [customMaterial, setCustomMaterial] = useState("");

  // 랜덤 키워드 생성
  const handleRandomKeyword = async () => {
    try {
      // Firestore에서 학년-과목 조합으로 문서 찾기
      const docName = `${gradeLevel}-${subject}`;
      const keywordDocRef = doc(db, "recommendKeywords", docName);
      const keywordDoc = await getDoc(keywordDocRef);

      if (!keywordDoc.exists()) {
        await Swal.fire({
          title: '키워드 없음',
          text: `${gradeLevel} ${subject}에 대한 추천 키워드가 아직 없습니다.`,
          icon: 'info',
          confirmButtonColor: '#4285f4'
        });
        return;
      }

      const data = keywordDoc.data();
      const keywords = data.keywords || [];

      if (keywords.length === 0) {
        await Swal.fire({
          title: '키워드 없음',
          text: '저장된 키워드가 없습니다.',
          icon: 'info',
          confirmButtonColor: '#4285f4'
        });
        return;
      }

      // 랜덤으로 하나 선택
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      setIntention(randomKeyword);

      await Swal.fire({
        title: '키워드 생성!',
        text: `"${randomKeyword}" 키워드를 선택했습니다.`,
        icon: 'success',
        confirmButtonColor: '#4285f4',
        timer: 1500
      });
    } catch (error) {
      console.error('랜덤 키워드 생성 오류:', error);
      await Swal.fire({
        title: '오류',
        text: '키워드를 가져오는 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#4285f4'
      });
    }
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

    setLoading(true);

    try {
      // 로컬 개발 환경 체크
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // 크레딧 사용량 확인
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists()
          ? userDoc.data()
          : { recommendCreditsUsed: 0 };

        const creditsUsed = userData.recommendCreditsUsed || 0;
        const maxCredits = 10;

        if (isLocalDev) {
          await Swal.fire({
            title: "로컬 개발 모드",
            html: `현재 추천 크레딧 사용량: <b>${creditsUsed}/${maxCredits}</b><br/><small>(로컬에서는 무제한 사용 가능)</small>`,
            icon: "info",
            confirmButtonColor: "#4285f4",
            timer: 2000,
          });
        } else {
          if (creditsUsed >= maxCredits) {
            await Swal.fire({
              title: "하루 한도 초과",
              html: `오늘의 무료 추천 한도를 모두 사용했습니다.<br/>사용량: <b>${creditsUsed}/${maxCredits}</b>`,
              icon: "warning",
              confirmButtonColor: "#4285f4",
            });
            setLoading(false);
            return;
          }
        }
      }

      // 비로그인 사용자 고유 ID 생성
      let anonymousId = null;
      if (!user) {
        anonymousId = localStorage.getItem("safertube_anonymous_id");
        if (!anonymousId) {
          anonymousId = `anon_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}`;
          localStorage.setItem("safertube_anonymous_id", anonymousId);
        }
      }

      // Firestore에 추천 요청 생성
      const docRef = await addDoc(collection(db, "recommendationRequests"), {
        gradeLevel,
        subject,
        intention: intention.trim() || null, // 수업 의도
        objective: intention.trim() || `${subject} 수업을 위한 적합한 영상 추천`, // 목표 (수업 의도를 목표로 사용)
        preferredDuration: preferredDuration || null, // 선호 영상 길이
        materials: materials,
        userId: user?.uid || null,
        anonymousId: anonymousId,
        status: "pending",
        createdAt: Timestamp.now(),
      });

      setRequestId(docRef.id);
    } catch (error) {
      console.error("Error creating recommendation request:", error);
      Swal.fire({
        title: "오류",
        text: "추천 요청 중 오류가 발생했습니다",
        icon: "error",
        confirmButtonColor: "#4285f4",
      });
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRequestId(null);
    setGradeLevel("초등 고학년");
    setSubject("미술");
    setIntention("");
    setPreferredDuration("");
    setMaterials([]);
    setCustomMaterial("");
    setLoading(false);
  };

  const toggleMaterial = (material) => {
    setMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
  };

  const handleMaterialKeyDown = (e) => {
    if (e.key === 'Enter' && customMaterial.trim()) {
      e.preventDefault();
      if (!materials.includes(customMaterial.trim())) {
        setMaterials((prev) => [...prev, customMaterial.trim()]);
      }
      setCustomMaterial('');
    }
  };

  const removeMaterial = (material) => {
    setMaterials((prev) => prev.filter((m) => m !== material));
  };

  if (requestId) {
    return (
      <RecommendationResult
        requestId={requestId}
        onReset={handleReset}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
        수업에 사용할 유튜브 영상 찾기!
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* 1. 학년 선택 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            1. 대상 학년 선택 (필수)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              {
                value: "초등 저학년",
                label: (
                  <span>
                    초등
                    <br />
                    저학년
                  </span>
                ),
                sub: "1-2학년",
              },
              {
                value: "초등 중학년",
                label: (
                  <span>
                    초등
                    <br />
                    중학년
                  </span>
                ),
                sub: "3-4학년",
              },
              {
                value: "초등 고학년",
                label: (
                  <span>
                    초등
                    <br />
                    고학년
                  </span>
                ),
                sub: "5-6학년",
              },
              {
                value: "중학생",
                label: "중학생",
              },
              {
                value: "고등학생",
                label: "고등학생",
              },
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
                <div className="leading-tight text-center">{grade.label}</div>
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
                title={subj.full}
                className={`relative px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold rounded-lg border transition-all group ${
                  subject === subj.full
                    ? "text-white bg-blue-600 border-blue-600"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                {subj.short}
                <span className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {subj.full}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. 수업 의도 및 준비물 (선택) */}
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
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            💡 수업 의도를 입력하면 더 정확한 영상을 추천받을 수 있습니다
          </p>
        </div>

        {/* 4. 영상 길이 (선택) */}
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
              { value: "40", label: "40분 이내" },
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
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            💡 선택한 길이 위주로 영상을 우선 추천합니다
          </p>
        </div>

        {/* 5. 교실 준비물 */}
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2">
            5. 교실 준비물 (선택)
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* 기본 준비물 */}
            {["색종이", "가위", "공", "줄넘기", "풀", "색연필"].map((material) => (
              <label
                key={material}
                className="flex items-center space-x-1.5 sm:space-x-2 border rounded-md px-2 sm:px-4 py-1.5 sm:py-2 cursor-pointer hover:bg-gray-100 text-sm sm:text-base"
              >
                <input
                  type="checkbox"
                  checked={materials.includes(material)}
                  onChange={() => toggleMaterial(material)}
                  className="rounded text-blue-600"
                />
                <span>{material}</span>
              </label>
            ))}

            {/* 사용자가 추가한 준비물 */}
            {materials.filter(m => !["색종이", "가위", "공", "줄넘기", "풀", "색연필"].includes(m)).map((material) => (
              <label
                key={material}
                className="flex items-center space-x-1.5 sm:space-x-2 border rounded-md px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-50 border-blue-300 text-sm sm:text-base"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => removeMaterial(material)}
                  className="rounded text-blue-600"
                />
                <span>{material}</span>
              </label>
            ))}

            {/* 직접 입력 */}
            <input
              type="text"
              value={customMaterial}
              onChange={(e) => setCustomMaterial(e.target.value)}
              onKeyDown={handleMaterialKeyDown}
              placeholder="+ 직접 입력 (Enter)"
              className="border rounded-md px-2 sm:px-4 py-1.5 sm:py-2 w-32 sm:w-40 text-sm sm:text-base"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            💡 준비물을 입력하고 Enter를 누르면 추가됩니다
          </p>
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
          {loading ? "검색 중..." : "위 조건으로 영상 찾기"}
        </button>
      </form>
    </div>
  );
}
