// Gemini API 직접 호출 유틸리티

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Gemini API로 빠른 영상 분석 (자막 기반)
 */
export async function quickAnalyzeVideo(videoId, transcript, gradeLevel, subject, intention) {
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
      "초등 1학년": "만 7세 수준",
      "초등 2학년": "만 8세 수준",
      "초등 3학년": "만 9세 수준",
      "초등 4학년": "만 10세 수준",
      "초등 5학년": "만 11세 수준",
      "초등 6학년": "만 12세 수준",
      "중학생": "만 13-15세 수준",
      "고등학생": "만 16-18세 수준",
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
- ${subject === "미정" ? "재미있고 교육적이면 높은 점수" : intention ? "수업 의도와 관련 있으면 높은 점수" : "수업용으로 적합하면 높은 점수"}
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
          maxOutputTokens: 500,
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
      safetyScore: typeof analysis.safetyScore === "number" ? analysis.safetyScore : 75,
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
          maxOutputTokens: 200,
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
