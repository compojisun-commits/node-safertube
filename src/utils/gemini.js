// Gemini API 직접 호출 유틸리티

// 여러 개의 API 키를 배열로 관리
const GEMINI_API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
].filter(Boolean); // undefined 제거

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// 가벼운 작업용 (검색어 생성 등) - 토큰 소비 적음
const GEMINI_LITE_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Rate Limiting: API 호출 사이 대기 시간 (밀리초)
const API_CALL_DELAY = 2000; // 2초

/**
 * API 호출 사이 지연 함수
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 현재 사용 중인 API 키 인덱스 가져오기
 */
function getCurrentKeyIndex() {
  const stored = localStorage.getItem("gemini_api_key_index");
  return stored ? parseInt(stored) : 0;
}

/**
 * 다음 API 키로 전환
 */
function switchToNextKey() {
  const currentIndex = getCurrentKeyIndex();
  const nextIndex = (currentIndex + 1) % GEMINI_API_KEYS.length;
  localStorage.setItem("gemini_api_key_index", nextIndex.toString());
  console.log(`🔄 Gemini API 키 전환: ${currentIndex} → ${nextIndex}`);
  return nextIndex;
}

/**
 * 현재 사용할 API 키 가져오기
 */
function getCurrentApiKey() {
  const index = getCurrentKeyIndex();
  return GEMINI_API_KEYS[index];
}

export async function checkSimilarityWithGemini(text1, text2) {
  try {
    const prompt = `다음 두 텍스트의 유사도를 0에서 100 사이의 점수로 평가하세요.

텍스트 1:
${text1}

텍스트 2:
${text2}

**유사도 평가 기준:**
- 두 텍스트의 의미적 유사성을 평가
- 0: 전혀 유사하지 않음
- 100: 거의 동일한 의미

**무조건 JSON만 출력:
{
  "score": 0-100
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5, // 안정적인 결과를 위해 낮은 온도 설정
          maxOutputTokens: 500, // 유사도 점수만 출력하므로 적은 토큰 사용
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return 0; // 유사도 계산 실패 시 기본값 반환
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return typeof analysis.similarityScore === "number"
      ? analysis.similarityScore
      : 0;
  } catch (error) {
    console.error("유사도 계산 실패:", error);
    return 0; // 오류 발생 시 기본값 반환
  }
}

/**
 * Gemini API로 빠른 영상 분석 (자막 기반)
 */
export async function quickAnalyzeVideo(
  videoId,
  transcript,
  gradeLevel,
  subject,
  intention,
  _retryCount = 0
) {
  try {
    const apiKey = getCurrentApiKey();
    // 평가 컨텍스트 생성
    let contextText = "";
    if (subject === "미정") {
      contextText = "재미있고 교육적인 영상인지";
    } else if (intention) {
      contextText = `"${intention}" 수업 의도에 적합한지`;
    } else {
      contextText = `${subject} 수업용 영상으로 적합한지`;
    }

    const gradeFilters = {
      "초등 저학년": "만 7-8세 수준 (1-2학년)",
      "초등 중학년": "만 9-10세 수준 (3-4학년)",
      "초등 고학년": "만 11-12세 수준 (5-6학년)",
      중학생: "만 13-15세 수준",
      고등학생: "만 16-18세 수준",
    };

    const gradeDescription = gradeFilters[gradeLevel] || "초등 고학년 수준";

    // 자막 텍스트 준비 (처음 1500자만 사용 - TPM 절약)
    const transcriptText = transcript.slice(0, 1500);

    const prompt = `다음은 YouTube 영상의 자막입니다. "${gradeDescription}" 학생에게 ${contextText} 빠르게 평가하세요.

자막:
${transcriptText}

JSON만 출력:
{
  "safetyScore": 0-100,
  "summary": "영상 내용 1-2문장 요약"
}

**빠른 분석 기준:**
- 명백한 부적절 콘텐츠만 체크 (폭력/성적/욕설)
- ${
      subject === "미정"
        ? "재미있고 교육적이면 높은 점수"
        : intention
        ? "수업 의도와 관련 있으면 높은 점수"
        : "수업용으로 적합하면 높은 점수"
    }
- 교육적 맥락은 관대히 평가
- **점수:** 85-100(안전)/65-84(주의)/40-64(보호자동반)/0-39(부적절)

JSON만 출력:`;

    // Rate Limiting: API 호출 전 대기
    if (_retryCount === 0) {
      await delay(API_CALL_DELAY);
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300, // TPM 절약: 4000 → 300 (JSON 응답 충분)
        },
      }),
    });

    if (!response.ok) {
      // 429 오류 처리
      if (response.status === 429) {
        const maxRetries = GEMINI_API_KEYS.length * 2;
        if (_retryCount < maxRetries) {
          const waitTime = Math.min(3000 * Math.pow(2, _retryCount), 30000);
          console.warn(`⚠️ [빠른분석] API 할당량 초과. ${waitTime/1000}초 후 재시도... (${_retryCount + 1}/${maxRetries})`);
          switchToNextKey();
          await delay(waitTime);
          return quickAnalyzeVideo(videoId, transcript, gradeLevel, subject, intention, _retryCount + 1);
        }
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        safetyScore: 75,
        summary: "빠른 분석 완료",
      };
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      safetyScore:
        typeof analysis.safetyScore === "number" ? analysis.safetyScore : 75,
      summary: analysis.summary || "영상 내용 분석 완료",
    };
  } catch (error) {
    console.error("Gemini 분석 실패:", error);
    return {
      safetyScore: 70,
      summary: "분석 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 미술 과목용 하드코딩 검색어 생성
 */
function generateArtKeywords(intention) {
  const artSuffixes = ["만들기", "그리기", "꾸미기", "감상", "전시"];

  if (!intention || intention.trim() === "") {
    return ["미술 수업", "미술 활동", "창작 활동"];
  }

  const baseKeyword = intention.trim();
  const keywords = [];

  // 이미 접미사가 포함되어 있는지 확인
  const hasSuffix = artSuffixes.some(suffix => baseKeyword.includes(suffix));

  if (hasSuffix) {
    // "크리스마스 트리 만들기" → ["크리스마스 트리 만들기", "크리스마스 트리 꾸미기", ...]
    artSuffixes.forEach(suffix => {
      // 기존 접미사 제거하고 새 접미사 추가
      const base = baseKeyword.replace(/만들기|그리기|꾸미기|감상|전시/g, "").trim();
      keywords.push(`${base} ${suffix}`);
    });
  } else {
    // "크리스마스 트리" → ["크리스마스 트리 만들기", "크리스마스 트리 그리기", ...]
    artSuffixes.forEach(suffix => {
      keywords.push(`${baseKeyword} ${suffix}`);
    });
  }

  return keywords.slice(0, 5); // 최대 5개
}

/**
 * Gemini API로 검색어 생성
 */
export async function generateSearchKeywords(subject, intention, gradeLevel, _retryCount = 0) {
  try {
    const apiKey = getCurrentApiKey();
    let prompt;

    if (subject === "미정") {
      prompt = `초등학생/중학생에게 적합한 재미있고 교육적인 YouTube 영상을 찾기 위한 검색어 3-5개 생성 (쉼표 구분, 한국어):

**목표:** 학생들이 즐겁게 보면서 배울 수 있는 영상
${intention ? `**수업 의도:** ${intention}` : ""}

**조건:**
- 재미있고 흥미로운 내용
- 교육적 가치가 있는 내용
- ${gradeLevel} 발달 단계에 적합
- 긍정적인 메시지 전달

검색어만 출력:`;
    } else if (intention) {
      prompt = `YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어, 2-4단어):

**수업 의도 (최우선 고려):** ${intention}
주제: ${subject}
학년: ${gradeLevel}

"${intention}" 내용을 포함하면서 ${subject} 수업에서 보여줄 수 있는 검색어를 만드세요.
예: "색상환" → 색상환, 색상환 그리기, 색상환 활용

검색어만 출력:`;
    } else {
      prompt = `YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어, 2-4단어):

주제: ${subject}
학년: ${gradeLevel}

검색어만 출력:`;
    }

    // Rate Limiting: API 호출 전 대기
    if (_retryCount === 0) {
      await delay(API_CALL_DELAY);
    }

    // 검색어 생성은 가벼운 모델 사용 (토큰 절약)
    const response = await fetch(`${GEMINI_LITE_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 500, // 검색어는 짧으므로 토큰 제한
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const maxRetries = GEMINI_API_KEYS.length * 2;
        if (_retryCount < maxRetries) {
          const waitTime = Math.min(3000 * Math.pow(2, _retryCount), 30000);
          console.warn(`⚠️ [검색어생성] API 할당량 초과. ${waitTime/1000}초 후 재시도... (${_retryCount + 1}/${maxRetries})`);
          switchToNextKey();
          await delay(waitTime);
          return generateSearchKeywords(subject, intention, gradeLevel, _retryCount + 1);
        }
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 쉼표로 구분된 검색어 추출
    const keywords = text
      .trim()
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return keywords.length > 0 ? keywords : [subject || "교육 영상"];
  } catch (error) {
    console.error("검색어 생성 실패:", error);

    // 미술 과목인 경우 하드코딩 검색어 사용
    if (subject === "미술") {
      console.log("🎨 미술 과목 하드코딩 검색어 사용");
      return generateArtKeywords(intention);
    }

    // 다른 과목은 기본 폴백
    return [subject || "교육 영상"];
  }
}

/**
 * Gemini API로 "다른" 검색어 생성 (새로고침용)
 */
export async function generateAlternativeKeywords(
  subject,
  intention,
  gradeLevel,
  previousKeywords = [],
  _retryCount = 0
) {
  try {
    const apiKey = getCurrentApiKey();
    let prompt;

    if (intention) {
      prompt = `YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어, 2-4단어):

**수업 의도 (최우선 고려):** ${intention}
주제: ${subject}
학년: ${gradeLevel}

**이전 검색어 (사용 금지):** ${previousKeywords.join(", ")}

"${intention}" 내용을 포함하되, 이전 검색어와 완전히 다른 새로운 검색어를 만드세요.
예: 이전 "색상환, 색상환 그리기" → 새로운 "색상환 설명, 색상환 활용법, 쉬운 색상환"

검색어만 출력:`;
    } else {
      prompt = `YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어, 2-4단어):

주제: ${subject}
학년: ${gradeLevel}

**이전에 사용한 검색어 (중복 금지):** ${previousKeywords.join(", ")}

이전 검색어와 다른 새로운 검색어만 출력:`;
    }

    // Rate Limiting: API 호출 전 대기
    if (_retryCount === 0) {
      await delay(API_CALL_DELAY);
    }

    // 대체 검색어 생성도 가벼운 모델 사용 (토큰 절약)
    const response = await fetch(`${GEMINI_LITE_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0, // 더 다양한 결과를 위해 높임
          maxOutputTokens: 500, // 검색어는 짧으므로 토큰 제한
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const maxRetries = GEMINI_API_KEYS.length * 2;
        if (_retryCount < maxRetries) {
          const waitTime = Math.min(3000 * Math.pow(2, _retryCount), 30000);
          console.warn(`⚠️ [대체검색어] API 할당량 초과. ${waitTime/1000}초 후 재시도... (${_retryCount + 1}/${maxRetries})`);
          switchToNextKey();
          await delay(waitTime);
          return generateAlternativeKeywords(subject, intention, gradeLevel, previousKeywords, _retryCount + 1);
        }
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const keywords = text
      .trim()
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return keywords.length > 0 ? keywords : [subject || "교육 영상"];
  } catch (error) {
    console.error("대체 검색어 생성 실패:", error);

    // 미술 과목인 경우 하드코딩 검색어 사용
    if (subject === "미술") {
      console.log("🎨 미술 과목 하드코딩 대체 검색어 사용");
      return generateArtKeywords(intention);
    }

    // 다른 과목은 기본 폴백
    return [subject || "교육 영상"];
  }
}
