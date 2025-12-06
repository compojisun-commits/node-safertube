// 프론트엔드에서 직접 영상 분석

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * YouTube 영상 길이 가져오기
 */
export async function getVideoDuration(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const duration = parseDuration(data.items[0].contentDetails.duration);
      const title = data.items[0].snippet.title;
      return { duration, title };
    }
    return { duration: 600, title: "제목 없음" };
  } catch (error) {
    console.error("영상 정보 가져오기 실패:", error);
    return { duration: 600, title: "제목 없음" };
  }
}

/**
 * ISO 8601 duration을 초 단위로 변환
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * 짧은 영상 분석 (10분 이하)
 */
export async function analyzeShortVideo(
  videoUrl,
  videoId,
  videoDuration,
  gradeLevel,
  onProgress
) {
  try {
    onProgress?.({ status: "analyzing", message: "영상 분석 중..." });

    const gradeFilters = {
      "elementary-1-2": { name: "초등 1~2학년", criteria: "만 7-8세 수준" },
      "elementary-3-4": { name: "초등 3~4학년", criteria: "만 9-10세 수준" },
      "elementary-5-6": { name: "초등 5~6학년", criteria: "만 11-12세 수준" },
      "middle-school": { name: "중학생", criteria: "만 13-15세 수준" },
      "high-school": { name: "고등학생", criteria: "만 16-18세 수준" },
    };

    const selectedFilter =
      gradeFilters[gradeLevel] || gradeFilters["elementary-5-6"];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                fileData: {
                  fileUri: videoUrl,
                },
              },
              {
                text: `YouTube 영상을 "${selectedFilter.name}"(${selectedFilter.criteria}) 학생 시청 적합성 분석.

**중요: 모든 응답은 반드시 한국어로 작성하세요!**

**응답 형식 (JSON):**
{
  "summary": "영상의 주제와 내용을 3-5문장으로 구체적으로 요약 (반드시 작성!)",
  "safetyScore": (숫자 0-100),
  "safetyDescription": "안전도 설명(2-3문장)",
  "categoryRatings": {
    "sexuality": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "선정성 관련 설명 (없으면 '해당 없음')"},
    "violence": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "폭력성 관련 설명 (없으면 '해당 없음')"},
    "profanity": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "언어/욕설 관련 설명 (없으면 '해당 없음')"},
    "fear": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "공포 관련 설명 (없으면 '해당 없음')"},
    "drug": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "약물/음주/흡연 관련 설명 (없으면 '해당 없음')"},
    "imitation": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "모방위험 관련 설명 (없으면 '해당 없음')"}
  },
  "comprehensionAnalysis": {
    "recommendedAge": "초등 저학년/초등 고학년/중학생/고등학생 이상",
    "vocabularyLevel": "쉬움/보통/어려움",
    "topicComplexity": "단순/보통/복잡",
    "overallDifficulty": "쉬움/보통/어려움",
    "difficultWords": ["어려운단어1", "어려운단어2"],
    "priorKnowledge": ["필요한 사전지식 1", "필요한 사전지식 2"],
    "abstractConcepts": ["추상적 개념1", "추상적 개념2"],
    "comprehensionNotes": "이해도 관련 종합 설명 (1-2문장)"
  },
  "warnings": [{"startTime": "MM:SS", "endTime": "MM:SS", "description": "문제 내용 설명", "severity": "high/medium/low", "category": "sexuality/violence/profanity/fear/drug/imitation"}],
  "flow": [{"timestamp": "MM:SS", "description": "해당 구간 설명"}]
}

**이해도 분석 기준:**
- **recommendedAge**: "${selectedFilter.name}" 학생이 이해할 수 있는지 판단하여 적절한 연령대 추천
- **vocabularyLevel**: 사용된 어휘의 난이도 (쉬움=초등저학년도 OK, 보통=초등고학년, 어려움=중학생 이상)
- **topicComplexity**: 주제와 내용의 복잡성
- **difficultWords**: 해당 학년이 모를 수 있는 어려운 단어 (최대 5개)
- **priorKnowledge**: 영상 이해에 필요한 사전 지식 (최대 3개)
- **abstractConcepts**: 추상적이거나 어려운 개념 (최대 3개)

**카테고리 등급 기준 (영상등급위원회 기준):**
- **선정성(sexuality)**: 성적 표현, 노출, 신체 접촉, 선정적 의상 등
- **폭력성(violence)**: 물리적 폭력, 살상, 학대, 싸움 장면 등
- **언어(profanity)**: 욕설, 비속어, 혐오 표현, 조롱 등
- **공포(fear)**: 공포 분위기, 놀람 장면, 잔혹한 묘사 등
- **약물(drug)**: 음주, 흡연, 약물 사용 장면 등
- **모방위험(imitation)**: 위험 행동, 범죄 모방 가능성 등

**등급 판정:**
- safe: 해당 학년에 적합 (90-100점)
- caution: 주의 권장 (70-89점)
- warning: 보호자 동반 권장 (40-69점)
- danger: 시청 부적합 (0-39점)

**분석 기준:**
- 영상을 처음부터 끝까지 전체 분석
- 화면 텍스트/자막 포함 모든 콘텐츠 검사
- 탐지 대상: 폭력/성적 표현/욕설/혐오 표현
- flow: 영상 전체 흐름을 5-7개 구간만 간단히 설명

**매우 중요 - 경고 구간 설정 규칙:**

1. **모든 부적절한 내용을 빠짐없이 감지** (개수 제한 없음)
2. **비슷한 분위기/맥락이 지속되면 하나의 긴 구간으로 통합**
   - ❌ 나쁜 예: 1:29 공포, 1:32 공포, 1:43 공포, 1:46 공포 (잘게 쪼개짐)
   - ✅ 좋은 예: 1:29-2:41 지속적인 공포 분위기 (하나로 병합)
   - 시간 간격보다 **맥락의 연속성**이 중요함
3. **구간 형식:**
   - 단일 시점: {"startTime": "1:30", "endTime": "1:30", "description": "...", "severity": "..."}
   - 연속 구간: {"startTime": "1:30", "endTime": "2:28", "description": "...", "severity": "..."}
4. **심각도 분류 기준:**
   - **high**: 폭력적 장면, 선정적 내용, 약물, 심한 욕설, 강한 공포
   - **medium**: 일반 욕설, 위협적 표현, 중간 수준 공포, 갈등 장면
   - **low**: 경미한 고함, 가벼운 다툼, 단순 긴장감
5. **모든 심각도 포함** (경미한 표현도 감지)
6. **일관성 유지:** 같은 영상은 항상 같은 결과

**예시:**
{"startTime": "1:29", "endTime": "2:41", "description": "피가 붙은 얼굴로 괴성을 지르는 지속적인 공포 장면", "severity": "high"}
{"startTime": "5:10", "endTime": "5:15", "description": "욕설 사용 (여러 번)", "severity": "medium"}
{"startTime": "7:45", "endTime": "7:45", "description": "단순 고함", "severity": "low"}

**안전 점수 채점 가이드라인 (0-100):**

점수 계산 시 다음을 **반드시** 고려:

1. **구간 길이 가중치**: 긴 구간일수록 더 심각
   - 10분 구간 (high) = 짧은 1초 (high)보다 훨씬 위험
   - 구간 길이를 점수에 반영할 것

2. **영상 대비 경고 비율**: 전체 경고 시간 / 영상 길이
   - 50% 이상: 매우 부적절 (0-20점)
   - 30-50%: 부적절 (20-40점)
   - 10-30%: 주의 필요 (40-70점)
   - 5-10%: 일부 주의 (70-85점)
   - 5% 미만: 대체로 안전 (85-100점)

3. **학년별 엄격도** ("${selectedFilter.name}" 기준):
   - 초등 저학년: 가장 엄격하게 (추가 감점)
   - 초등 고학년: 엄격하게
   - 중학생: 보통
   - 고등학생: 관대하게 (완화)

4. **심각도 가중치**:
   - high: 매우 큰 감점
   - medium: 중간 감점
   - low: 작은 감점

5. **최종 판정**:
   - 85-100: 안전
   - 70-84: 주의 권장
   - 50-69: 보호자 동반
   - 30-49: 부적절
   - 0-29: 매우 부적절

**중요**: 구간이 적어도 각 구간이 길고 심각하면 낮은 점수를 줄 것!`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // 일관성을 위해 낮은 값
          maxOutputTokens: 8192, // 긴 영상의 모든 경고 포함 위해 증가
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // JSON 파싱 (파싱 실패 시 기본값 반환)
    const analysis = parseJSON(text);

    // Gemini가 이미 맥락 기반 통합과 점수 계산을 했으므로 그대로 사용
    onProgress?.({ status: "completed", message: "분석 완료!" });

    return {
      safetyScore: analysis.safetyScore || 70,
      safetyDescription: analysis.safetyDescription || "분석 완료",
      summary:
        analysis.summary ||
        "영상 요약 정보를 가져올 수 없습니다. 영상을 직접 확인해주세요.",
      categoryRatings: analysis.categoryRatings || null,
      comprehensionAnalysis: analysis.comprehensionAnalysis || null,
      warnings: analysis.warnings || [],
      chapters: [],
      flow: analysis.flow || [],
    };
  } catch (error) {
    console.error("영상 분석 실패:", error);
    throw error;
  }
}

/**
 * 긴 영상 분석 (10분 초과 - 청킹)
 */
export async function analyzeLongVideo(
  videoUrl,
  videoId,
  videoDuration,
  gradeLevel,
  onProgress
) {
  try {
    const CHUNK_DURATION = 600; // 10분
    const numChunks = Math.ceil(videoDuration / CHUNK_DURATION);

    onProgress?.({
      status: "chunking",
      message: `긴 영상 감지: ${numChunks}개 청크로 분할 분석`,
      totalChunks: numChunks,
      completedChunks: 0,
    });

    const gradeFilters = {
      "elementary-1-2": { name: "초등 1~2학년", criteria: "만 7-8세 수준" },
      "elementary-3-4": { name: "초등 3~4학년", criteria: "만 9-10세 수준" },
      "elementary-5-6": { name: "초등 5~6학년", criteria: "만 11-12세 수준" },
      "middle-school": { name: "중학생", criteria: "만 13-15세 수준" },
      "high-school": { name: "고등학생", criteria: "만 16-18세 수준" },
    };

    const selectedFilter =
      gradeFilters[gradeLevel] || gradeFilters["elementary-5-6"];

    // 각 청크 분석 (병렬)
    const chunkPromises = [];
    const chunkResults = [];

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * CHUNK_DURATION;
      const endTime = Math.min((i + 1) * CHUNK_DURATION, videoDuration);
      const startMin = Math.floor(startTime / 60);
      const endMin = Math.floor(endTime / 60);

      const promise = fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  fileData: {
                    fileUri: videoUrl,
                  },
                },
                {
                  text: `YouTube 영상의 ${startMin}:00 ~ ${endMin}:00 구간을 "${selectedFilter.name}" 학생 시청 적합성 분석.

**중요: 모든 응답은 반드시 한국어로 작성하세요!**

**응답 형식 (JSON):**
{
  "warnings": [{"startTime": "MM:SS", "endTime": "MM:SS", "description": "문제 내용 설명", "severity": "high/medium"}],
  "flow": [{"timestamp": "MM:SS", "description": "구간 설명"}]
}

**분석 기준:**
- ${startMin}:00부터 ${endMin}:00까지의 구간만 분석
- 시간은 영상 전체 기준으로 표기
- flow: ${startMin}:00부터 ${endMin}:00까지의 구간만 3-4개 타임스탬프로 간단히 설명

**매우 중요 - 경고 구간 규칙:**
1. **모든 부적절한 내용 감지** (개수 제한 없음)
2. **비슷한 분위기/맥락이 지속되면 긴 구간으로 통합**
   - ❌ 나쁜 예: ${startMin}:15 공포, ${startMin}:32 공포, ${startMin}:47 공포 (잘게 쪼개짐)
   - ✅ 좋은 예: ${startMin}:15-${endMin}:50 (구간 안내 들어있는 구체적인 내용들)
   - 시간 간격보다 **맥락의 연속성**이 중요
3. **심각도 분류 기준:**
   - **high**: 폭력적 장면, 선정적 내용, 약물, 심한 욕설, 강한 공포
   - **medium**: 일반 욕설, 위협적 표현, 중간 수준 공포, 갈등 장면
4. **일관성:** 항상 같은 기준으로 분석`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // 일관성을 위해 낮은 값
            maxOutputTokens: 8192, // 모든 경고 포함 위해 증가
            responseMimeType: "application/json",
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const result = parseJSON(text);

          return {
            chunkIndex: i,
            startTime,
            endTime,
            warnings: result.warnings || [],
            flow: result.flow || [],
          };
        })
        .then((result) => {
          chunkResults[i] = result;

          // 완료된 청크 수 계산
          const completed = chunkResults.filter((r) => r).length;

          onProgress?.({
            status: "analyzing",
            message: `청크 분석 중... (${completed}/${numChunks})`,
            totalChunks: numChunks,
            completedChunks: completed,
            partialResults: chunkResults.filter((r) => r),
          });

          return result;
        })
        .catch((error) => {
          console.error(`청크 ${i + 1} 분석 실패:`, error);
          return {
            chunkIndex: i,
            startTime,
            endTime,
            warnings: [],
            flow: [],
          };
        });

      chunkPromises.push(promise);
    }

    // 모든 청크 완료 대기
    await Promise.all(chunkPromises);

    // 결과 병합
    const allWarnings = [];
    const allFlow = [];

    chunkResults
      .filter((r) => r)
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .forEach((chunk) => {
        allWarnings.push(...chunk.warnings);
        allFlow.push(...chunk.flow);
      });

    // 타임스탬프 순 정렬
    const sortByTimestamp = (a, b) => {
      const timeA = parseTimestamp(a.timestamp);
      const timeB = parseTimestamp(b.timestamp);
      return timeA - timeB;
    };

    // warnings는 startTime으로 정렬
    const sortWarningsByTime = (a, b) => {
      const timeA = parseTimestamp(a.startTime || a.timestamp || "0:00");
      const timeB = parseTimestamp(b.startTime || b.timestamp || "0:00");
      return timeA - timeB;
    };

    allWarnings.sort(sortWarningsByTime);
    allFlow.sort(sortByTimestamp);

    // Gemini가 각 청크에서 이미 5초 이내 통합을 했으므로
    // 모든 경고를 그대로 사용 (추가 필터링 불필요)

    // flow 간소화 (8개 정도로)
    let finalFlow = allFlow;
    if (allFlow.length > 10) {
      const targetCount = 8;
      const timeInterval = videoDuration / (targetCount - 1);
      finalFlow = [];

      for (let i = 0; i < targetCount; i++) {
        const targetTime = i * timeInterval;
        let closestFlow = allFlow[0];
        let minDiff = Math.abs(
          parseTimestamp(allFlow[0].timestamp) - targetTime
        );

        allFlow.forEach((flow) => {
          const flowTime = parseTimestamp(flow.timestamp);
          const diff = Math.abs(flowTime - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestFlow = flow;
          }
        });

        if (!finalFlow.find((f) => f.timestamp === closestFlow.timestamp)) {
          finalFlow.push(closestFlow);
        }
      }

      finalFlow.sort(sortByTimestamp);
    }

    // 전체 요약 생성
    onProgress?.({ status: "summarizing", message: "전체 요약 생성 중..." });

    const summaryResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `다음은 YouTube 영상(${Math.floor(
                    videoDuration / 60
                  )}분)을 분석한 타임라인과 경고 목록입니다. "${
                    selectedFilter.name
                  }" 학생 기준으로 요약하고 안전 점수를 매겨주세요.

**중요: 모든 응답은 반드시 한국어로 작성하세요!**

**영상 타임라인:**
${finalFlow.map((f) => `${f.timestamp}: ${f.description}`).join("\n")}

**감지된 경고 구간 (총 ${allWarnings.length}개):**
${allWarnings
  .slice(0, 20)
  .map(
    (w, i) =>
      `${i + 1}. [${w.severity}] ${w.startTime}-${w.endTime}: ${w.description}`
  )
  .join("\n")}${
                    allWarnings.length > 20
                      ? `\n... 외 ${allWarnings.length - 20}개`
                      : ""
                  }

**응답 형식 (JSON):**
{
  "summary": "영상의 주제와 내용을 3-5문장으로 구체적으로 요약 (반드시 작성)",
  "safetyScore": (숫자 0-100),
  "safetyDescription": "안전도 설명(2-3문장)",
  "categoryRatings": {
    "sexuality": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "선정성 관련 설명"},
    "violence": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "폭력성 관련 설명"},
    "profanity": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "언어/욕설 관련 설명"},
    "fear": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "공포 관련 설명"},
    "drug": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "약물 관련 설명"},
    "imitation": {"level": "safe/caution/warning/danger", "score": 0-100, "description": "모방위험 관련 설명"}
  },
  "comprehensionAnalysis": {
    "recommendedAge": "초등 저학년/초등 고학년/중학생/고등학생 이상",
    "vocabularyLevel": "쉬움/보통/어려움",
    "topicComplexity": "단순/보통/복잡",
    "overallDifficulty": "쉬움/보통/어려움",
    "difficultWords": ["어려운단어1", "어려운단어2"],
    "priorKnowledge": ["필요한 사전지식"],
    "abstractConcepts": ["추상적 개념"],
    "comprehensionNotes": "이해도 관련 종합 설명"
  }
}

**카테고리 등급 기준:**
- safe (90-100점): 해당 학년에 적합
- caution (70-89점): 주의 권장
- warning (40-69점): 보호자 동반 권장
- danger (0-39점): 시청 부적합

**안전 점수 채점 가이드라인:**

점수 계산 시 다음을 **반드시** 고려:

1. **구간 길이 가중치**: 긴 구간일수록 더 심각
   - 예: "0:00-10:00" (10분) high 구간 = 매우 위험
   - 예: "0:30-0:31" (1초) medium 구간 = 경미

2. **영상 대비 경고 비율**:
   - 전체 경고 구간 시간을 합산하여 영상 길이(${Math.floor(
     videoDuration / 60
   )}분) 대비 비율 계산
   - 50% 이상: 매우 부적절 (0-20점)
   - 30-50%: 부적절 (20-40점)
   - 10-30%: 주의 필요 (40-70점)
   - 5-10%: 일부 주의 (70-85점)
   - 5% 미만: 대체로 안전 (85-100점)

3. **학년별 엄격도** ("${selectedFilter.name}" 기준):
   - 초등 저학년: 가장 엄격하게 (추가 감점)
   - 초등 고학년: 엄격하게
   - 중학생: 보통
   - 고등학생: 관대하게 (완화)

4. **심각도 가중치**:
   - high: 매우 큰 감점
   - medium: 중간 감점
   - low: 작은 감점

**중요**: 구간이 적어도 각 구간이 길고 심각하면 낮은 점수를 줄 것!`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // 일관성을 위해 낮은 값
            maxOutputTokens: 8192, // 점수 계산 설명을 위해 증가
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const summaryData = await summaryResponse.json();
    const summaryText =
      summaryData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const summaryResult = parseJSON(summaryText);

    // 요약 및 점수 결과 사용 (Gemini가 계산한 값)
    const summary =
      summaryResult.summary ||
      "영상 요약 정보를 가져올 수 없습니다. 영상을 직접 확인해주세요.";
    const safetyScore = summaryResult.safetyScore || 70;
    const safetyDescription = summaryResult.safetyDescription || "분석 완료";
    const categoryRatings = summaryResult.categoryRatings || null;
    const comprehensionAnalysis = summaryResult.comprehensionAnalysis || null;

    onProgress?.({ status: "completed", message: "분석 완료!" });

    return {
      safetyScore,
      safetyDescription,
      summary,
      categoryRatings,
      comprehensionAnalysis,
      warnings: allWarnings, // 모든 경고 포함
      chapters: [],
      flow: finalFlow,
    };
  } catch (error) {
    console.error("긴 영상 분석 실패:", error);
    throw error;
  }
}

/**
 * JSON 파싱 헬퍼 함수 - 최소한의 파싱만 수행
 */
function parseJSON(text) {
  try {
    // JSON 모드에서는 순수 JSON만 반환되므로 직접 파싱
    return JSON.parse(text);
  } catch (error) {
    console.warn("⚠️ JSON 파싱 실패 - 빈 결과 반환:", error.message);
    console.log("문제가 된 텍스트 앞부분:", text.substring(0, 200));

    // 파싱 실패 시 안전한 기본값 반환 (크래시 방지)
    return {
      warnings: [],
      flow: [],
      safetyScore: 50,
      safetyDescription: "분석 중 오류가 발생했습니다",
      summary:
        "영상 분석 중 오류가 발생하여 요약을 생성할 수 없습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 타임스탬프를 초 단위로 변환
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(":").map((p) => parseInt(p) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
}

/**
 * 안전 점수 계산 (다차원 평가 - 구간 길이 고려)
 * @param {Array} warnings - 경고 목록
 * @param {number} durationSeconds - 영상 길이 (초)
 * @param {string} gradeLevel - 학년 수준
 * @returns {Object} {safetyScore, safetyDescription}
 */
function calculateSafetyScore(warnings, durationSeconds, gradeLevel) {
  if (!warnings || warnings.length === 0) {
    return {
      safetyScore: 100,
      safetyDescription:
        "부적절한 내용이 발견되지 않았습니다. 안전하게 시청할 수 있습니다.",
    };
  }

  const durationMinutes = durationSeconds / 60;

  // 1. 구간 길이 기반 가중치 계산
  let totalWeightedScore = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalWarningDuration = 0; // 전체 경고 구간 길이 (초)

  warnings.forEach((w) => {
    // 구간 길이 계산 (startTime ~ endTime)
    const startSeconds = parseTimestamp(w.startTime || "0:00");
    const endSeconds = parseTimestamp(w.endTime || w.startTime || "0:00");
    const warningDuration = Math.max(1, endSeconds - startSeconds + 1); // 최소 1초
    totalWarningDuration += warningDuration;

    // 심각도별 기본 점수
    let baseScore = 0;
    if (w.severity === "high") {
      baseScore = 10;
      highCount++;
    } else if (w.severity === "medium") {
      baseScore = 5;
      mediumCount++;
    } else if (w.severity === "low") {
      baseScore = 2;
      lowCount++;
    }

    // 구간 길이에 비례한 가중치 적용
    // 1분 = 기본 가중치, 그 이상은 추가 가중
    const durationMinutes = warningDuration / 60;
    const durationWeight = Math.sqrt(durationMinutes); // 제곱근으로 완화 (10분 = 3.16배)

    totalWeightedScore += baseScore * durationWeight;
  });

  // 2. 영상 대비 경고 비율 계산
  const warningRatio = totalWarningDuration / durationSeconds;
  let warningRatioMultiplier = 1.0;

  if (warningRatio >= 0.5)
    warningRatioMultiplier = 2.0; // 영상의 50% 이상이 문제
  else if (warningRatio >= 0.3) warningRatioMultiplier = 1.5; // 30-50%
  else if (warningRatio >= 0.1) warningRatioMultiplier = 1.2; // 10-30%
  else if (warningRatio >= 0.05) warningRatioMultiplier = 1.0; // 5-10%
  else warningRatioMultiplier = 0.8; // 5% 미만

  const adjustedScore = totalWeightedScore * warningRatioMultiplier;

  // 3. 학년별 가중치 (어린 학생일수록 엄격하게)
  const gradeMultipliers = {
    "elementary-1-2": 1.5,
    "elementary-3-4": 1.3,
    "elementary-5-6": 1.0,
    "middle-school": 0.7,
    "high-school": 0.5,
  };
  const gradeMultiplier = gradeMultipliers[gradeLevel] || 1.0;
  const finalDeduction = adjustedScore * gradeMultiplier;

  // 4. 카테고리별 추가 감점
  let categoryDeduction = 0;
  if (highCount >= 3) categoryDeduction += 15; // 심각한 경고 다수
  if (mediumCount >= 5) categoryDeduction += 10; // 중간 경고 과다
  if (warningRatio >= 0.3) categoryDeduction += 20; // 영상의 30% 이상이 문제

  // 5. 최종 점수 계산 (0-100)
  const totalDeduction = finalDeduction / 2 + categoryDeduction;
  const safetyScore = Math.max(0, Math.min(100, 100 - totalDeduction));

  // 6. 점수에 따른 설명 생성
  let safetyDescription = "";
  const warningPercent = Math.round(warningRatio * 100);

  if (safetyScore >= 85) {
    safetyDescription = `전반적으로 안전한 콘텐츠입니다. 경미한 주의 사항 ${warnings.length}개 구간이 발견되었습니다.`;
  } else if (safetyScore >= 70) {
    safetyDescription = `일부 주의가 필요한 내용이 포함되어 있습니다. 보호자의 사전 확인을 권장합니다. (경고 구간 ${warnings.length}개, 영상의 ${warningPercent}%)`;
  } else if (safetyScore >= 50) {
    safetyDescription = `다수의 부적절한 내용이 포함되어 있습니다. 보호자와 함께 시청하시기 바랍니다. (경고 구간 ${warnings.length}개, 심각 ${highCount}개, 영상의 ${warningPercent}%)`;
  } else if (safetyScore >= 30) {
    safetyDescription = `부적절한 내용이 많이 포함되어 있어 시청에 주의가 필요합니다. (경고 구간 ${warnings.length}개, 심각 ${highCount}개, 영상의 ${warningPercent}%)`;
  } else {
    safetyDescription = `해당 학년 학생에게 매우 부적절한 콘텐츠입니다. 시청을 권장하지 않습니다. (경고 구간 ${warnings.length}개, 심각 ${highCount}개, 영상의 ${warningPercent}%)`;
  }

  return {
    safetyScore: Math.round(safetyScore),
    safetyDescription,
  };
}

/**
 * 중복 경고 필터링
 */
function filterDuplicateWarnings(warnings) {
  if (!warnings || warnings.length === 0) return [];

  // 경미한 표현 필터링 (단순 고함/비명)
  const trivialPhrases = ["야!", "아!", "어!", "오!", "우!"];
  let filtered = warnings.filter((w) => {
    const quote = (w.quote || "").trim();
    return !trivialPhrases.includes(quote);
  });

  // 타임스탬프 순 정렬
  filtered.sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  );

  // 10초 이내 중복 제거
  const result = [];
  const DUPLICATE_THRESHOLD = 10; // 10초

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    const currentTime = parseTimestamp(current.timestamp);

    // 이전 경고와 비교
    const isDuplicate = result.some((prev) => {
      const prevTime = parseTimestamp(prev.timestamp);
      const timeDiff = Math.abs(currentTime - prevTime);

      // 10초 이내이고, 같은 종류의 경고인 경우
      if (timeDiff <= DUPLICATE_THRESHOLD) {
        const currentDesc = (current.description || "").toLowerCase();
        const prevDesc = (prev.description || "").toLowerCase();

        // 같은 키워드 포함 시 중복으로 간주
        const keywords = ["욕설", "비속어", "폭력", "성적", "혐오", "위협"];
        for (const keyword of keywords) {
          if (currentDesc.includes(keyword) && prevDesc.includes(keyword)) {
            return true;
          }
        }
      }
      return false;
    });

    if (!isDuplicate) {
      result.push(current);
    }
  }

  return result;
}

/**
 * 메인 분석 함수
 */
export async function analyzeVideo(videoUrl, videoId, gradeLevel, onProgress) {
  try {
    // 1. 영상 길이 가져오기
    onProgress?.({ status: "fetching", message: "영상 정보 가져오는 중..." });
    const { duration, title } = await getVideoDuration(videoId);

    // 2. 길이에 따라 분석 방식 선택
    if (duration <= 600) {
      // 10분 이하: 일반 분석
      return await analyzeShortVideo(
        videoUrl,
        videoId,
        duration,
        gradeLevel,
        onProgress
      );
    } else {
      // 10분 초과: 청킹 분석
      return await analyzeLongVideo(
        videoUrl,
        videoId,
        duration,
        gradeLevel,
        onProgress
      );
    }
  } catch (error) {
    console.error("영상 분석 실패:", error);
    throw error;
  }
}
