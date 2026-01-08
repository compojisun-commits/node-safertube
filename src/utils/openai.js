// OpenAI API를 사용한 검색 키워드 생성

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * 사용자 의도를 기반으로 YouTube 검색에 적합한 키워드 생성
 * @param {string} intention - 사용자 입력 (예: "옛 그림 먹과 색으로 표현")
 * @param {string} subject - 주제 (미술, 체육, 안전교육 등)
 * @param {string} gradeLevel - 학년 (초등 고학년, 중학생 등)
 * @returns {Promise<string[]>} - 생성된 키워드 배열 (최대 3개)
 */
export async function generateSearchKeywords(intention, subject, gradeLevel) {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API 키가 설정되지 않았습니다. 원본 키워드 사용.");
    return [intention];
  }

  try {
    const prompt = `당신은 교육용 YouTube 영상 검색 전문가입니다.

사용자 정보:
- 주제: ${subject}
- 학년: ${gradeLevel}
- 수업 의도: ${intention}

위 정보를 바탕으로 YouTube에서 교육용 영상을 찾기 위한 **검색 키워드 3개**를 생성해주세요.

요구사항:
1. 각 키워드는 짧고 명확해야 합니다 (5-10자 정도)
2. 한국어로 작성
3. YouTube 검색에 최적화된 키워드
4. 교육적 가치가 있는 영상을 찾을 수 있는 키워드
5. 서로 다른 관점의 키워드 (예: 기술, 역사, 활용법 등)

응답 형식 (JSON):
{
  "keywords": ["키워드1", "키워드2", "키워드3"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 교육용 콘텐츠 검색 전문가입니다. 항상 JSON 형식으로 응답합니다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log(`🤖 OpenAI 키워드 생성: ${result.keywords.join(", ")}`);

    return result.keywords || [intention];
  } catch (error) {
    console.error("OpenAI 키워드 생성 실패:", error);
    // 실패 시 원본 키워드 사용
    return [intention];
  }
}
