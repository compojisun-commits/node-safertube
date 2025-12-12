// Gemini API 직접 호출 유틸리티

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
  intention
) {
  try {
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

    // 자막 텍스트 준비 (처음 3000자만 사용 - 빠른 분석)
    const transcriptText = transcript.slice(0, 3000);

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
          temperature: 0.7,
          maxOutputTokens: 4000,
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
 * Gemini API로 검색어 생성
 */
export async function generateSearchKeywords(subject, intention, gradeLevel) {
  try {
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
          temperature: 0.9,
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!response.ok) {
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
  previousKeywords = []
) {
  try {
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
          temperature: 1.0, // 더 다양한 결과를 위해 높임
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!response.ok) {
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
    return [subject || "교육 영상"];
  }
}
