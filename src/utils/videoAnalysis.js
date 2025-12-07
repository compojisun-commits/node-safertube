// 프론트엔드에서 직접 영상 분석

import { fetchTranscript, extractVideoId } from "./transcript";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
    // 자막 추출 (가능하면 활용)
    let transcript = [];
    try {
      transcript = await fetchTranscript(videoUrl);
    } catch (e) {
      console.warn("Transcript fetch failed (short):", e?.message || e);
    }

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

자막(가능한 경우, 일부 샘플):
${transcript
  .slice(0, 120)
  .map((t) => `[${Math.round(t.start)}s] ${t.text}`)
  .join("\n")}

**중요: 모든 응답은 반드시 한국어로 작성하세요!**

**응답 형식 (JSON):**
{
  "summary": "영상의 주제와 내용을 3-5문장으로 구체적으로 요약 (반드시 작성!)",
  "key_sentence": "요약의 근거가 되는 자막 문장 그대로 인용 (자막에 실제 존재하는 문장)",
  "safetyScore": (숫자 0-100),
  "safetyDescription": "안전도 설명(2-3문장)",
  "categoryRatings": {
    "sexuality": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "선정성 관련 설명"},
    "violence": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "폭력성 관련 설명"},
    "profanity": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "언어/욕설 관련 설명"},
    "fear": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "공포 관련 설명"},
    "drug": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "약물/음주/흡연 관련 설명"},
    "imitation": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "모방위험 관련 설명"}
  },
  "ratingResult": {
    "finalRating": "전체관람가/12세이상관람가/15세이상관람가/청소년관람불가",
    "schoolSafetyScore": 0-100,
    "isClassroomSafe": true/false,
    "warningKeywords": ["문제단어1", "문제단어2"]
  },
  "comprehensionAnalysis": {
    "recommendedAge": "초등 저학년/초등 고학년/중학생/고등학생 이상",
    "vocabularyLevel": "쉬움/보통/어려움",
    "topicComplexity": "단순/보통/복잡",
    "overallDifficulty": "쉬움/보통/어려움",
    "lexicalDensity": "Low/Medium/High",
    "sentenceComplexity": "Simple/Complex",
    "abstractConceptLevel": 1-5,
    "difficultWords": ["어려운단어1", "어려운단어2"],
    "priorKnowledge": ["필요한 사전지식 1", "필요한 사전지식 2"],
    "abstractConcepts": ["추상적 개념1", "추상적 개념2"],
    "comprehensionNotes": "이해도 관련 종합 설명 (1-2문장)"
  },
  "warnings": [{"startTime": "MM:SS", "endTime": "MM:SS", "description": "문제 내용 설명", "severity": "high/medium/low", "category": "sexuality/violence/profanity/fear/drug/imitation"}],
  "flow": [{"timestamp": "MM:SS", "description": "해당 구간 설명"}]
}

**타임스탬프 규칙 (중요, 추측 금지):**
- 반드시 영상의 실제 시간을 그대로 사용 (할루시네이션 금지)
- 형식: HH:MM:SS 또는 MM:SS
- 모든 시간은 0초 이상, 영상 길이 ${Math.floor(videoDuration / 60)}분 ${videoDuration % 60}초 이내
- 하나의 구간(startTime~endTime)은 start <= end 여야 함

**이해도 분석 기준:**
- **recommendedAge**: "${selectedFilter.name}" 학생이 이해할 수 있는지 판단하여 적절한 연령대 추천
- **vocabularyLevel**: 사용된 어휘의 난이도 (쉬움=초등저학년도 OK, 보통=초등고학년, 어려움=중학생 이상)
- **topicComplexity**: 주제와 내용의 복잡성
- **lexicalDensity (어휘 밀도)**: 전체 발화 중 전문 용어/개념어 비율
  - Low: 일상 어휘 위주, 전문용어 거의 없음
  - Medium: 적당한 전문용어, 설명이 함께 제공됨
  - High: 전문용어 빽빽, 배경지식 필요
- **sentenceComplexity (문장 복잡도)**:
  - Simple: 단문 위주, 직관적 이해 가능
  - Complex: 복문/수식어구 다수, 논리적 추론 필요
- **abstractConceptLevel (추상화 레벨 1~5)**:
  - 1: 눈에 보이는 구체물 (사과, 자동차, 동물)
  - 2: 일상적 행동/상황 (학교 가기, 요리하기)
  - 3: 경험적 개념 (우정, 날씨, 감정)
  - 4: 중간 추상 개념 (역사적 사건, 과학 원리)
  - 5: 고도의 추상적 개념 (민주주의, 분자의 결합, 상대성 이론)
- **difficultWords**: 해당 학년이 모를 수 있는 어려운 단어 (**반드시 3~5개 추출**, 없으면 "없음" 1개라도 반환)
- **priorKnowledge**: 영상 이해에 필요한 사전 지식 (**반드시 2~3개 추출**, 없으면 "기본 상식" 반환)
- **abstractConcepts**: 추상적이거나 어려운 개념 (**반드시 2~3개 추출**, 없으면 "특별히 없음" 반환)

**🎬 영상등급위원회(KMRB) 6대 고려사항 심의 기준:**

**1. 선정성 (Sexuality) - ratingLevel 0~3:**
- Level 0 (전체): 성적 내용 없음. 교육적 목적의 생물학적 언급만.
- Level 1 (12세): 가벼운 스킨십, 성적 맥락 없는 신체 노출.
- Level 2 (15세): 구체적이지 않은 선정적 대화나 묘사.
- Level 3 (청불): 직접적이고 노골적인 성적 행위 묘사.

**2. 폭력성 (Violence) - ratingLevel 0~3:**
- Level 0 (전체): 폭력 없음. 권선징악적/코믹한 만화적 표현.
- Level 1 (12세): 경미한 폭력(밀치기 등), 신체 손상 없는 비현실적 액션.
- Level 2 (15세): 유혈이 낭자하지 않으나 지속적인 구타, 흉기 사용 위협.
- Level 3 (청불): 신체 훼손, 살상 장면이 구체적이고 직접적임.

**3. 언어 (Profanity) - ratingLevel 0~3:**
- Level 0 (전체): 바른 언어 사용. (교육적 맥락)
- Level 1 (12세): 일상적인 비속어, 은어의 가벼운 사용 (욕설 아님).
- Level 2 (15세): 거친 욕설, 저속한 언어가 지속적으로 등장.
- Level 3 (청불): 인격 모독, 성적 비하, 입에 담기 힘든 욕설 남발.

**4. 공포 (Fear) - ratingLevel 0~3:**
- Level 0 (전체): 공포감 없음.
- Level 1 (12세): 긴장감을 주지만 지속적이지 않음 (약한 귀신/괴물).
- Level 2 (15세): 혐오감을 주는 장면이나 지속적인 공포 분위기.
- Level 3 (청불): 매우 잔혹하고 혐오스러운 장면, 심리적 충격.

**5. 약물 (Drug/Alcohol) - ratingLevel 0~3:**
- Level 0 (전체): 언급 없음.
- Level 1 (12세): 음주/흡연이 나오나 미화되지 않고 맥락상 필요함.
- Level 2 (15세): 음주/흡연 장면이 빈번하거나, 이를 즐기는 모습.
- Level 3 (청불): 마약 등 불법 약물 사용, 제조, 유통 묘사.

**6. 모방위험 (Imitation Risk) - ratingLevel 0~3:**
- Level 0 (전체): 위험 행동 없음.
- Level 1 (12세): 무기류 묘사가 있으나 현실감이 떨어져 모방 위험 낮음.
- Level 2 (15세): 청소년이 모방할 수 있는 비행 행동(따돌림, 절도 등) 묘사.
- Level 3 (청불): 범죄 수법, 자살, 자해 등이 구체적으로 묘사됨.

**📌 최종 등급 판정 (ratingLevel → level 변환):**
- ratingLevel 0 → safe (전체관람가, 90-100점)
- ratingLevel 1 → caution (12세이상관람가, 70-89점)
- ratingLevel 2 → warning (15세이상관람가, 40-69점)
- ratingLevel 3 → danger (청소년관람불가, 0-39점)

**🏫 초등 교실 적합성 추가 판단 (isClassroomSafe):**
- 등급이 낮아도 '집단 따돌림', '외모 비하', '왕따', '폭력 미화' 등은 학교에서 사용 불가
- 교육적 맥락에서도 부정적 롤모델이 있으면 false 처리

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
    let analysis = normalizeAnalysis(parseJSON(text), 0, videoDuration);
    if (transcript.length > 0) {
      analysis = alignFlowWithTranscript(analysis, transcript, 0, videoDuration);
    }

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
 * 🆕 영상 전체를 한 번에 분석하여 타임라인 생성 (가장 정확!)
 * 청크 분할 X, AI가 영상 전체를 보고 주제 전환점을 직접 찾음
 */
async function generateTimelineFromVideo(videoUrl, videoDuration, transcript) {
  console.log("[타임라인 생성] 시작 - 영상 길이:", formatTimestamp(videoDuration));
  
  // 자막이 있으면 자막 정보도 함께 제공
  let transcriptHint = "";
  if (transcript && transcript.length > 0) {
    // 자막 전체에서 균등하게 샘플링 (최대 100개)
    const step = Math.max(1, Math.floor(transcript.length / 100));
    const sampled = transcript.filter((_, i) => i % step === 0);
    
    transcriptHint = `\n\n# 참고 자막 (시간:내용)
${sampled.map(t => `[${formatTimestamp(t.start)}] ${t.text.slice(0, 60)}`).join("\n")}`;
    console.log("[타임라인 생성] 자막 참고:", sampled.length, "개");
  }
  
  const totalMinutes = Math.ceil(videoDuration / 60);
  
  const prompt = `이 YouTube 영상을 처음부터 끝까지 시청하고, **주제가 바뀌는 정확한 시점**을 찾아주세요.

# 영상 정보
- 전체 길이: ${totalMinutes}분 (${formatTimestamp(videoDuration)})
${transcriptHint}

# 규칙 (매우 중요!)
1. **실제 영상 시청 기준**: 영상에서 실제로 보이는/들리는 내용이 바뀌는 정확한 시점을 찾으세요.
2. **시간 형식**: MM:SS 형식으로 작성 (예: 3:45, 12:30)
3. **개수**: 6~10개 정도의 주요 전환점만 선택
4. **균등 분포**: 영상 전체에 고르게 분포되게 선택
5. **명확한 전환점만**: "자, 다음은~", "두 번째로~" 등 명확한 전환 신호가 있는 곳

# 출력 형식 (JSON 배열만!)
[
  {"timestamp": "0:00", "description": "영상 시작/인트로"},
  {"timestamp": "2:15", "description": "첫 번째 주제 설명"},
  {"timestamp": "5:30", "description": "두 번째 주제로 전환"}
]

**반드시 JSON 배열만 출력하세요!**`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { fileData: { fileUri: videoUrl } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });
    
    const data = await response.json();
    console.log("[타임라인 생성] API 응답 수신");
    
    if (!data.candidates || !data.candidates[0]) {
      console.error("[타임라인 생성] 응답 없음:", data);
      return [];
    }
    
    const text = data.candidates[0].content?.parts?.[0]?.text || "[]";
    console.log("[타임라인 생성] 원본 응답:", text.slice(0, 200));
    
    const chapters = parseJSON(text) || [];
    
    // 검증: 시간이 영상 범위 내인지 확인
    const validatedChapters = chapters
      .filter(ch => {
        if (!ch.timestamp) return false;
        const seconds = parseTimestamp(ch.timestamp);
        return seconds >= 0 && seconds < videoDuration;
      })
      .map(ch => ({
        timestamp: ch.timestamp,
        description: ch.description || "구간",
      }))
      .sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
    
    console.log("[타임라인 생성] 검증 완료:", validatedChapters.length, "개");
    console.log("[타임라인 생성] 결과:", validatedChapters);
    
    return validatedChapters;
    
  } catch (error) {
    console.error("[타임라인 생성] 실패:", error);
    return [];
  }
}

/**
 * 긴 영상 분석 (10분 초과)
 * 🆕 자막 기반 타임라인 + 청크별 경고 분석 분리
 */
export async function analyzeLongVideo(
  videoUrl,
  videoId,
  videoDuration,
  gradeLevel,
  onProgress
) {
  try {
    const CHUNK_DURATION = 600; // 10분 (600초)
    const numChunks = Math.ceil(videoDuration / CHUNK_DURATION);

    // 자막 추출
    let transcript = [];
    try {
      transcript = await fetchTranscript(videoUrl);
      console.log(`[자막 추출 성공] ${transcript.length}개 항목`);
    } catch (e) {
      console.warn("Transcript fetch failed (long):", e?.message || e);
    }

    onProgress?.({
      status: "timeline",
      message: `긴 영상 감지: 타임라인 생성 중...`,
      totalChunks: numChunks,
      completedChunks: 0,
    });

    // 🆕 1단계: 영상 전체로 타임라인 생성 (청크 분할 X - 가장 정확!)
    let transcriptFlow = [];
    try {
      transcriptFlow = await generateTimelineFromVideo(videoUrl, videoDuration, transcript);
    } catch (e) {
      console.error("[타임라인 생성 실패]", e);
    }

    onProgress?.({
      status: "chunking",
      message: `경고 구간 분석 중... (${numChunks}개 청크)`,
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

    // 각 청크 분석 (병렬) - 단순 분할
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
                  text: `# Role
당신은 긴 교육 영상의 대본을 구간별로 나누어 처리하는 '부분 편집자(Segment Editor)'입니다.
지금 당신이 보고 있는 텍스트는 전체 영상의 **중간 부분(Chunk)**입니다.

**중요: 모든 응답은 반드시 한국어로 작성하세요!**

# Context Variables
- **Current Chunk**: ${startMin}:00 ~ ${endMin}:00
- **Is First Chunk**: ${i === 0 ? 'true' : 'false'}
- **학년 필터**: ${selectedFilter.name}

# Critical Rules (반드시 지킬 것)

1. **'앞부분 무시' 원칙 (Start Buffer Zone)**:
   - Is First Chunk가 false라면, 텍스트의 **시작 후 30초 이내**는 이전 청크에서 이어지는 내용일 확률이 99%다.
   - 따라서, **${startMin}:00 ~ ${startMin}:30 사이에는 flow를 생성하지 마라.**
   - 문장이 중간에 잘려 있거나, "그래서", "때문에" 같은 접속사로 시작한다면 **절대 flow로 잡지 마라.**
   - 명확하게 **새로운 주제로 전환되는 지점**이 나타날 때까지 기다렸다가 flow를 생성해라.

2. **타임스탬프 기준**:
   - 출력하는 timestamp는 반드시 **${startMin}:00 이상, ${endMin}:00 미만**이어야 한다.
   - 자막에 있는 실제 시간만 사용해라. (추정 금지)

**응답 형식 (JSON):**
{
  "warnings": [{"startTime": "MM:SS", "endTime": "MM:SS", "description": "문제 내용 설명", "severity": "high/medium"}],
  "flow": [{"timestamp": "MM:SS", "description": "구간 설명"}]
}

**분석 기준:**
- warnings: 부적절한 내용 감지 (욕설, 폭력, 선정성 등)
- flow: 확실한 주제 전환(Topic Transition)이 일어나는 지점만 3~4개 선별. 없으면 빈 배열.

자막(해당 구간 샘플):
${transcript
  .filter((t) => t.start >= startTime && t.start < endTime)
  .slice(0, 60)
  .map((t) => `[${Math.round(t.start)}s] ${t.text}`)
  .join("\n")}

**타임스탬프 규칙 (중요, 추측 금지):**
- 모든 시간은 해당 청크 구간 [${startMin}:00, ${endMin}:00] 안에서만 표기
- 형식: HH:MM:SS 또는 MM:SS
- startTime/endTime/flow.timestamp 모두 실제 자막/화면 기준 시간만 사용 (임의 추측 금지)
- 한 구간에서 startTime <= endTime 이어야 함


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
          const parsed = parseJSON(text);
          let normalized = normalizeAnalysis(parsed, startTime, endTime);
          if (transcript.length > 0) {
            normalized = alignFlowWithTranscript(
              normalized,
              transcript,
              startTime,
              endTime
            );
          }

          // 🆕 "부분 편집자" 방식: 청크별 flow 보정
          let chunkFlow = normalized.flow || [];
          
          // 🆕 앞부분 무시 원칙 (Start Buffer Zone)
          // 두 번째 청크부터: 시작 30초 이내의 flow는 이전 청크 연속일 가능성 높으므로 제거
          const BUFFER_SEC = 30; // 30초 버퍼
          const bufferZone = i > 0 ? BUFFER_SEC : 0; // 첫 청크는 버퍼 없음
          
          chunkFlow = chunkFlow.filter((f) => {
            const t = parseTimestamp(f.timestamp);
            // 청크 범위 내 + 버퍼존 이후만 허용
            return t >= (startTime + bufferZone) && t < endTime;
          });
          
          console.log(`[청크 ${i + 1}] 범위: ${startMin}:00~${endMin}:00, 버퍼: ${bufferZone}초, flow 수: ${chunkFlow.length}`);

          return {
            chunkIndex: i,
            startTime,
            endTime,
            warnings: normalized.warnings || [],
            flow: chunkFlow,
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

    chunkResults
      .filter((r) => r)
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .forEach((chunk) => {
        allWarnings.push(...chunk.warnings);
      });

    // warnings는 startTime으로 정렬
    const sortWarningsByTime = (a, b) => {
      const timeA = parseTimestamp(a.startTime || a.timestamp || "0:00");
      const timeB = parseTimestamp(b.startTime || b.timestamp || "0:00");
      return timeA - timeB;
    };

    allWarnings.sort(sortWarningsByTime);

    // 🆕 타임라인: 자막 기반 타임라인 우선 사용 (가장 정확함!)
    let finalFlow = [];
    if (transcriptFlow.length > 0) {
      // 자막 기반 타임라인이 있으면 그대로 사용 (이미 정확한 시간)
      finalFlow = transcriptFlow;
      console.log("[타임라인] 자막 기반 타임라인 사용:", finalFlow.length, "개");
    } else {
      // 자막이 없으면 청크 분석 결과에서 flow 수집 (폴백)
      const allFlow = [];
      chunkResults
        .filter((r) => r)
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .forEach((chunk) => {
          allFlow.push(...(chunk.flow || []));
        });
      
      allFlow.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
      finalFlow = filterNearbyChapters(allFlow, 60);
      
      if (finalFlow.length > 8) {
        const step = Math.ceil(finalFlow.length / 8);
        finalFlow = finalFlow.filter((_, idx) => idx % step === 0).slice(0, 8);
      }
      console.log("[타임라인] 청크 기반 타임라인 사용 (폴백):", finalFlow.length, "개");
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
    "sexuality": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "선정성 관련 설명"},
    "violence": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "폭력성 관련 설명"},
    "profanity": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "언어/욕설 관련 설명"},
    "fear": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "공포 관련 설명"},
    "drug": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "약물 관련 설명"},
    "imitation": {"ratingLevel": 0-3, "level": "safe/caution/warning/danger", "score": 0-100, "description": "모방위험 관련 설명"}
  },
  "ratingResult": {
    "finalRating": "전체관람가/12세이상관람가/15세이상관람가/청소년관람불가",
    "schoolSafetyScore": 0-100,
    "isClassroomSafe": true/false,
    "warningKeywords": ["문제단어1", "문제단어2"]
  },
  "comprehensionAnalysis": {
    "recommendedAge": "초등 저학년/초등 고학년/중학생/고등학생 이상",
    "vocabularyLevel": "쉬움/보통/어려움",
    "topicComplexity": "단순/보통/복잡",
    "overallDifficulty": "쉬움/보통/어려움",
    "lexicalDensity": "Low/Medium/High",
    "sentenceComplexity": "Simple/Complex",
    "abstractConceptLevel": 1-5,
    "difficultWords": ["어려운단어1", "어려운단어2"],
    "priorKnowledge": ["필요한 사전지식"],
    "abstractConcepts": ["추상적 개념"],
    "comprehensionNotes": "이해도 관련 종합 설명"
  }
}

**🎬 영상등급위원회(KMRB) 6대 고려사항 (ratingLevel 0~3):**
1. **선정성**: 0=전체, 1=12세, 2=15세, 3=청불 (성적 내용 수위)
2. **폭력성**: 0=전체, 1=12세, 2=15세, 3=청불 (폭력 묘사 수위)
3. **언어**: 0=전체, 1=12세, 2=15세, 3=청불 (욕설/비속어 수위)
4. **공포**: 0=전체, 1=12세, 2=15세, 3=청불 (공포 분위기 수위)
5. **약물**: 0=전체, 1=12세, 2=15세, 3=청불 (음주/흡연/약물 수위)
6. **모방위험**: 0=전체, 1=12세, 2=15세, 3=청불 (위험행동 모방 가능성)

**📌 등급 변환:** ratingLevel 0→safe, 1→caution, 2→warning, 3→danger

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
            maxOutputTokens: 1024, // 점수 계산 설명을 위해 증가
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
  const parts = String(timestamp).trim().split(":").map((p) => parseInt(p) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  return 0;
}

// 초 → "MM:SS" 혹은 "HH:MM:SS"로 변환 (최소 두 자리 패딩)
function formatTimestamp(seconds) {
  const sec = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`; // m은 앞자리 0 허용
}

// 경고/flow 내 타임스탬프를 청크 범위로 정규화
function normalizeAnalysis(analysis, minSeconds = 0, maxSeconds = Infinity) {
  if (!analysis) return { warnings: [], flow: [] };
  const clamp = (sec) => Math.min(maxSeconds, Math.max(minSeconds, sec || 0));

  const normWarnings = (analysis.warnings || []).map((w) => {
    const startSec = clamp(parseTimestamp(w.startTime || w.timestamp || "0:00"));
    const endSecRaw = parseTimestamp(w.endTime || w.startTime || w.timestamp || "0:00");
    const endSec = clamp(Math.max(startSec, endSecRaw));
    return {
      ...w,
      startTime: formatTimestamp(startSec),
      endTime: formatTimestamp(endSec),
    };
  });

  const normFlow = (analysis.flow || []).map((f) => {
    const tsSec = clamp(parseTimestamp(f.timestamp || "0:00"));
    return {
      ...f,
      timestamp: formatTimestamp(tsSec),
      key_sentence: f.key_sentence || f.keySentence || "",
    };
  });

  return {
    ...analysis,
    warnings: normWarnings,
    flow: normFlow,
  };
}

/**
 * 🆕 단순화된 "O/X 판별관" 방식
 * - 복잡한 역추적 로직 제거
 * - AI가 원본 자막의 timestamp를 그대로 복사해오도록 강제
 * - 후처리에서 1분 이내 근접 챕터만 제거
 */
export function alignFlowWithTranscript(analysis, transcript, minSeconds = 0, maxSeconds = Infinity) {
  // 이 함수는 이제 단순히 flow를 그대로 반환 (복잡한 매칭 제거)
  // 대신 generateChaptersFromTranscript()에서 직접 자막 기반 챕터 생성
  if (!analysis) return { warnings: [], flow: [] };
  return analysis;
}

/**
 * 🆕 자막 기반 챕터 생성 (O/X 판별관 방식)
 * AI에게 자막 데이터를 주고 "새 챕터 시작인지 Yes/No"만 판단하게 함
 * @param {Array} transcript - [{ text, start, duration }]
 * @param {number} startSeconds - 청크 시작 시간
 * @param {number} endSeconds - 청크 끝 시간
 * @returns {Promise<Array>} 챕터 배열
 */
export async function generateChaptersFromTranscript(transcript, startSeconds, endSeconds) {
  if (!transcript || transcript.length === 0) return [];
  
  // 해당 청크의 자막만 필터링 + id 부여
  const chunkTranscript = transcript
    .filter(t => t.start >= startSeconds && t.start < endSeconds)
    .map((t, idx) => ({
      id: idx,
      start: formatTimestamp(t.start),
      text: t.text
    }));
  
  if (chunkTranscript.length === 0) return [];
  
  const prompt = `# Role
너는 영상 편집 전문가야. 주어진 자막(Transcript) 데이터를 분석해서 '유튜브 챕터(Timeline)'를 생성해야 해.

# Task
제공된 자막 리스트를 순서대로 읽으면서, **주제가 완전히 바뀌는 '변곡점(Transition Point)'**을 찾아내라.

# Input Data
${JSON.stringify(chunkTranscript.slice(0, 80), null, 2)}

# Rules (매우 중요)
1. **절대 시간 창작 금지**: 반드시 입력 데이터에 존재하는 \`start\` 시간만 사용해라.
2. **보수적 판단**: 단순히 문장이 끊기는 곳이 아니라, 명확한 '새로운 주제'가 시작될 때만 챕터로 잡아라.
3. **첫 문장 주의**: 청크의 가장 첫 번째 문장(id: 0)은 이전 내용과 이어질 확률이 높다. 명확한 접속사("자, 다음은", "첫 번째로")가 없다면 챕터로 잡지 마라.
4. **타이밍**: 주제에 대한 설명이 '끝난 후'가 아니라, 새로운 주제를 **'언급하기 시작한'** 그 문장의 시간을 선택해라.
5. **최대 3~4개**: 이 구간에서 챕터는 최대 3~4개만 잡아라.

# Output Format (JSON Only)
반드시 아래 JSON 형식으로만 출력해. 다른 설명 없이 JSON만!

[
  {"id": 10, "timestamp": "03:15", "title": "분수의 덧셈 방법"},
  {"id": 45, "timestamp": "08:20", "title": "주의할 점과 팁"}
]

만약 이 구간에 명확한 주제 전환이 없다면 빈 배열 []을 반환해.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // 매우 보수적
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return parseJSON(text) || [];
  } catch (error) {
    console.error("챕터 생성 실패:", error);
    return [];
  }
}

/**
 * 🆕 후처리: 근접 챕터 제거 (1분 이내 챕터 병합)
 * @param {Array} chapters - 전체 챕터 배열
 * @param {number} minGapSeconds - 최소 간격 (기본 60초)
 * @returns {Array} 필터링된 챕터
 */
export function filterNearbyChapters(chapters, minGapSeconds = 60) {
  if (!chapters || chapters.length === 0) return [];
  
  // 시간순 정렬
  const sorted = [...chapters].sort((a, b) => {
    const timeA = parseTimestamp(a.timestamp);
    const timeB = parseTimestamp(b.timestamp);
    return timeA - timeB;
  });
  
  const result = [];
  let lastTime = -999;
  
  for (const chapter of sorted) {
    const currentTime = parseTimestamp(chapter.timestamp);
    
    // 이전 챕터와 최소 간격 이상 차이가 나야 인정
    if (currentTime - lastTime >= minGapSeconds) {
      result.push(chapter);
      lastTime = currentTime;
    }
  }
  
  return result;
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

    let result;
    // 2. 길이에 따라 분석 방식 선택
    if (duration <= 600) {
      // 10분 이하: 일반 분석
      result = await analyzeShortVideo(
        videoUrl,
        videoId,
        duration,
        gradeLevel,
        onProgress
      );
    } else {
      // 10분 초과: 청킹 분석
      result = await analyzeLongVideo(
        videoUrl,
        videoId,
        duration,
        gradeLevel,
        onProgress
      );
    }

    // 3. ★ YouTube 원본 제목 추가 (AI가 생성한 title보다 우선)
    return {
      ...result,
      title: title || result.title || '제목 없음',
      originalTitle: title, // 원본 제목 별도 보관
      videoId,
      videoUrl,
    };
  } catch (error) {
    console.error("영상 분석 실패:", error);
    throw error;
  }
}
