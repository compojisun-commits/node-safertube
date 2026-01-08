const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { YoutubeTranscript } = require("youtube-transcript");
const nodemailer = require("nodemailer");
const { getTrustedChannelIds } = require("./trustedChannels");

initializeApp();
const db = getFirestore();
const auth = getAuth();

// ========================================
// Gemini API 키 관리
// ========================================

// 여러 개의 Gemini API 키를 배열로 관리
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean); // undefined 제거

// 현재 사용 중인 Gemini API 키 인덱스 (메모리에 저장)
let currentGeminiKeyIndex = 0;

/**
 * 현재 사용할 Gemini API 키 가져오기
 */
function getCurrentGeminiApiKey() {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error("Gemini API 키가 설정되지 않았습니다");
  }
  return GEMINI_API_KEYS[currentGeminiKeyIndex];
}

/**
 * 다음 Gemini API 키로 전환
 */
function switchToNextGeminiKey() {
  const prevIndex = currentGeminiKeyIndex;
  currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
  console.log(
    `🔄 Gemini API 키 전환: ${prevIndex} → ${currentGeminiKeyIndex} (총 ${GEMINI_API_KEYS.length}개)`
  );
  return getCurrentGeminiApiKey();
}

// Gemini API 초기화 (동적으로 키를 사용)
function getGenAI() {
  return new GoogleGenerativeAI(getCurrentGeminiApiKey());
}

// ========================================
// YouTube API 키 관리
// ========================================

// 여러 개의 API 키를 배열로 관리
const YOUTUBE_API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
].filter(Boolean); // undefined 제거

// 현재 사용 중인 API 키 인덱스 (메모리에 저장)
let currentYouTubeKeyIndex = 0;

/**
 * 현재 사용할 YouTube API 키 가져오기
 */
function getCurrentYouTubeApiKey() {
  if (YOUTUBE_API_KEYS.length === 0) {
    throw new Error("YouTube API 키가 설정되지 않았습니다");
  }
  return YOUTUBE_API_KEYS[currentYouTubeKeyIndex];
}

/**
 * 다음 YouTube API 키로 전환
 */
function switchToNextYouTubeKey() {
  const prevIndex = currentYouTubeKeyIndex;
  currentYouTubeKeyIndex =
    (currentYouTubeKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  console.log(
    `🔄 YouTube API 키 전환: ${prevIndex} → ${currentYouTubeKeyIndex} (총 ${YOUTUBE_API_KEYS.length}개)`
  );
  return currentYouTubeKeyIndex;
}

// ========================================
// API 호출 최적화 유틸리티
// ========================================

/**
 * Exponential Backoff를 사용한 재시도 로직
 * @param {Function} fn - 실행할 함수
 * @param {number} maxRetries - 최대 재시도 횟수 (기본: 5)
 * @param {number} initialDelay - 초기 지연 시간 (ms, 기본: 1000)
 */
async function retryWithExponentialBackoff(
  fn,
  maxRetries = 5,
  initialDelay = 1000
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 429 (Rate Limit) 또는 503 (Service Unavailable) 에러만 재시도
      const errorMessage = error.message || "";
      const isRetryableError =
        errorMessage.includes("429") ||
        errorMessage.includes("503") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit");

      if (!isRetryableError || attempt === maxRetries) {
        console.error(
          `❌ API 호출 실패 (재시도 불가 또는 최대 재시도 도달): ${errorMessage}`
        );
        throw error;
      }

      // Exponential backoff: 1초 -> 2초 -> 4초 -> 8초 -> 16초
      const delay = initialDelay * Math.pow(2, attempt);
      // Jitter 추가 (랜덤성): ±20%
      const jitter = delay * 0.2 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delay + jitter, 32000); // 최대 32초

      console.log(
        `⏳ Rate limit 감지. ${(actualDelay / 1000).toFixed(
          1
        )}초 후 재시도... (${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

/**
 * Gemini API 호출 래퍼 (재시도 로직 포함)
 */
async function callGeminiWithRetry(model, contents, maxRetries = 5) {
  return retryWithExponentialBackoff(async () => {
    const response = await ai.models.generateContent({
      model,
      contents,
    });
    return response;
  }, maxRetries);
}

// ========================================
// Rate Limiting (요청 속도 제한)
// ========================================

class RateLimiter {
  constructor(requestsPerMinute = 15) {
    this.requestsPerMinute = requestsPerMinute;
    this.queue = [];
    this.processing = false;
    this.requestTimestamps = []; // 최근 1분간의 요청 타임스탬프
  }

  /**
   * API 호출을 큐에 추가하고 순차적으로 처리
   */
  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * 여러 API 호출을 병렬로 처리 (Rate limit 내에서)
   */
  async enqueueBatch(fnArray) {
    if (!Array.isArray(fnArray) || fnArray.length === 0) {
      return [];
    }

    console.log(`🚀 배치 처리 시작: ${fnArray.length}개 요청`);

    // 각 함수를 Promise로 래핑하여 병렬 처리
    const promises = fnArray.map((fn) => this.enqueue(fn));

    // 모든 요청이 완료될 때까지 대기
    const results = await Promise.allSettled(promises);

    // 성공/실패 분리
    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      console.log(`⚠️ 배치 처리 중 ${failed.length}개 실패`);
    }

    console.log(
      `✅ 배치 처리 완료: ${successful.length}/${fnArray.length}개 성공`
    );

    // Promise.allSettled 결과를 그대로 반환 (fulfilled/rejected 정보 포함)
    return results;
  }

  /**
   * 큐를 순차적으로 처리
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // 1분 이상 지난 타임스탬프 제거
      const oneMinuteAgo = Date.now() - 60000;
      this.requestTimestamps = this.requestTimestamps.filter(
        (t) => t > oneMinuteAgo
      );

      // 요청 한도 체크
      if (this.requestTimestamps.length >= this.requestsPerMinute) {
        // 가장 오래된 요청이 1분이 지날 때까지 대기
        const oldestRequest = this.requestTimestamps[0];
        const waitTime = 60000 - (Date.now() - oldestRequest) + 100; // 여유 100ms

        if (waitTime > 0) {
          console.log(
            `⏳ Rate limit 보호: ${(waitTime / 1000).toFixed(1)}초 대기 중...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // 큐에서 하나 꺼내서 실행
      const { fn, resolve, reject } = this.queue.shift();

      try {
        this.requestTimestamps.push(Date.now());
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // 요청 간 최소 간격 (분산 효과) - 100ms로 축소
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

// 전역 Rate Limiter 인스턴스 (분당 15개 요청)
const geminiRateLimiter = new RateLimiter(15);

/**
 * Rate Limiting을 적용한 Gemini API 호출
 */
async function callGeminiWithRateLimit(model, contents, maxRetries = 5) {
  return geminiRateLimiter.enqueue(async () => {
    return callGeminiWithRetry(model, contents, maxRetries);
  });
}

exports.analyzeVideo = onDocumentCreated(
  {
    document: "analysisRequests/{docId}",
    region: "asia-northeast1", // Tokyo 리전
  },
  async (event) => {
    const docId = event.params.docId;
    const data = event.data.data();

    try {
      // 상태를 processing으로 변경
      await db.collection("analysisRequests").doc(docId).update({
        status: "processing",
      });

      const { videoId, videoUrl, userId, gradeLevel } = data;

      // 학년별 필터링 기준
      const gradeFilters = {
        "elementary-1-2": {
          name: "초등 1~2학년",
          criteria:
            "만 7-8세 수준. 매우 순수한 표현만 허용. 폭력, 공포, 욕설, 비속어, 연애/애정 표현, 복잡한 사회 문제 모두 부적절.",
          bannedWords: [
            "죽다",
            "때리다",
            "싸우다",
            "무섭다",
            "귀신",
            "피",
            "욕",
            "바보",
            "멍청이",
          ],
        },
        "elementary-3-4": {
          name: "초등 3~4학년",
          criteria:
            "만 9-10세 수준. 가벼운 경쟁/갈등은 가능하지만 폭력, 욕설, 선정성, 혐오 표현 부적절. 교육적 가치 중요.",
          bannedWords: ["죽이다", "폭력", "욕설", "성적", "혐오", "차별"],
        },
        "elementary-5-6": {
          name: "초등 5~6학년",
          criteria:
            "만 11-12세 수준. 사회 이슈 다룰 수 있지만 직접적 폭력, 욕설, 성적 표현, 혐오/차별 표현 부적절.",
          bannedWords: ["심한 욕설", "성적 표현", "폭력적 장면", "혐오 표현"],
        },
        "middle-school": {
          name: "중학생",
          criteria:
            "만 13-15세 수준. 비교적 자유로우나 과도한 폭력, 선정성, 욕설, 혐오 표현은 부적절. 교육적 맥락이면 일부 허용.",
          bannedWords: ["과도한 욕설", "선정적 표현", "폭력 묘사"],
        },
      };

      const selectedFilter =
        gradeFilters[gradeLevel] || gradeFilters["elementary-1-2"];

      // 영상 길이 가져오기 (YouTube oEmbed API 사용)
      const videoInfo = await fetchVideoInfo(videoId);
      const videoDuration = videoInfo?.duration || 600; // 기본 10분

      // 크레딧 계산 (10분당 1크레딧)
      const creditsNeeded = Math.ceil(videoDuration / 600);

      // 로컬 개발 환경 체크 (localhost에서는 크레딧 제한 없음)
      const isLocalDev =
        process.env.FUNCTIONS_EMULATOR === "true" ||
        process.env.NODE_ENV === "development";

      // 사용자 크레딧 확인 (프로덕션 환경에서만 실제 차감)
      if (userId) {
        // 개발자 계정 체크 (무제한 사용)
        let isDeveloper = false;
        try {
          const userRecord = await auth.getUser(userId);
          const developerEmails = ["kerbongkim@gmail.com"]; // 개발자 이메일 리스트
          if (developerEmails.includes(userRecord.email)) {
            isDeveloper = true;
            console.log(
              `👨‍💻 개발자 계정 감지: ${userRecord.email} - 크레딧 제한 없음`
            );
          }
        } catch (error) {
          console.log("개발자 계정 체크 실패:", error.message);
        }

        if (!isDeveloper) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.exists
            ? userDoc.data()
            : { creditsUsed: 0, lastReset: new Date() };

          // 하루가 지났으면 리셋
          const lastReset = userData.lastReset?.toDate
            ? userData.lastReset.toDate()
            : userData.lastReset || new Date(0);
          const now = new Date();
          const daysPassed = Math.floor(
            (now - lastReset) / (1000 * 60 * 60 * 24)
          );

          let creditsUsed = userData.creditsUsed || 0;
          if (daysPassed >= 1) {
            creditsUsed = 0;
          }

          const maxCredits = 10; // 로그인 시 10개로 증가

          if (isLocalDev) {
            // 로컬 환경: 크레딧 체크만 하고 실제 차감은 안함
            console.log(
              `[로컬 개발] 크레딧 사용: ${
                creditsUsed + creditsNeeded
              }/${maxCredits} (실제 차감 안함)`
            );
          } else {
            // 프로덕션 환경: 실제 크레딧 차감
            if (creditsUsed + creditsNeeded > maxCredits) {
              throw new Error(
                `하루 한도를 초과했습니다. (사용: ${creditsUsed}/${maxCredits}, 필요: ${creditsNeeded})`
              );
            }

            // 크레딧 차감
            await db
              .collection("users")
              .doc(userId)
              .set(
                {
                  creditsUsed: creditsUsed + creditsNeeded,
                  lastReset: daysPassed >= 1 ? now : lastReset,
                },
                { merge: true }
              );
          }
        }
      } else {
        // 비로그인 사용자 - anonymousId 기반 제한
        const maxCredits = 3; // 비로그인 시 3개
        const anonymousId = data.anonymousId;

        if (isLocalDev) {
          console.log(
            `[로컬 개발] 비로그인 크레딧: ${creditsNeeded}/${maxCredits} (실제 제한 없음)`
          );
        } else {
          if (!anonymousId) {
            console.log("비로그인 사용자 anonymousId 없음 - 제한 스킵");
          } else {
            // anonymousId 기반으로 사용량 추적
            const anonDocRef = db.collection("anonymousUsage").doc(anonymousId);
            const anonDoc = await anonDocRef.get();
            const anonData = anonDoc.exists
              ? anonDoc.data()
              : { creditsUsed: 0, lastReset: new Date() };

            // 하루가 지났으면 리셋
            const lastReset = anonData.lastReset?.toDate
              ? anonData.lastReset.toDate()
              : anonData.lastReset || new Date(0);
            const now = new Date();
            const daysPassed = Math.floor(
              (now - lastReset) / (1000 * 60 * 60 * 24)
            );

            let anonCreditsUsed = anonData.creditsUsed || 0;
            if (daysPassed >= 1) {
              anonCreditsUsed = 0;
            }

            // 한도 체크
            if (anonCreditsUsed + creditsNeeded > maxCredits) {
              throw new Error(
                `비로그인 사용자는 하루 ${maxCredits}개까지만 분석 가능합니다. (사용: ${anonCreditsUsed}/${maxCredits}, 필요: ${creditsNeeded})\n로그인하면 10개까지 사용할 수 있습니다!`
              );
            }

            // 크레딧 차감
            await anonDocRef.set(
              {
                creditsUsed: anonCreditsUsed + creditsNeeded,
                lastReset: daysPassed >= 1 ? now : lastReset,
                lastUsed: now,
              },
              { merge: true }
            );

            console.log(
              `비로그인 사용자 크레딧 차감: ${
                anonCreditsUsed + creditsNeeded
              }/${maxCredits} (ID: ${anonymousId})`
            );
          }
        }
      }

      // 영상 길이 정보 가져오기
      const videoDetails = await fetchVideoInfo(videoId);
      const videoDurationSeconds = videoDetails?.duration || 600; // 기본 10분
      const videoDurationMinutes = Math.floor(videoDurationSeconds / 60);

      console.log(
        `📺 영상 길이: ${videoDurationMinutes}분 (${videoDurationSeconds}초)`
      );

      let analysis;

      // 10분 기준으로 분석 방식 선택
      if (videoDurationSeconds > 600) {
        // 10분 초과: 청킹 분석
        console.log(`⚡ 긴 영상 감지 - 청킹 분석 방식 적용`);
        analysis = await analyzeVideoInChunks(
          docId,
          videoId,
          videoUrl,
          selectedFilter,
          videoDurationSeconds
        );
      } else {
        // 10분 이하: 기존 방식 (전체 비디오 한번에 분석)
        console.log(`⚡ 짧은 영상 - 일반 분석 방식 적용`);

        // Gemini 2.5 Flash로 YouTube URL 직접 분석 (Rate Limiting 적용)
        const response = await callGeminiWithRateLimit("gemini-2.5-flash", {
          parts: [
            {
              fileData: {
                fileUri: videoUrl,
              },
            },
            {
              text: `YouTube 영상을 "${selectedFilter.name}"(${selectedFilter.criteria}) 학생 시청 적합성 분석. JSON 응답:

**영상 총 길이: 약 ${videoDurationMinutes}분**
**필수: 영상을 처음(0:00)부터 끝(${videoDurationMinutes}:00)까지 전체를 분석하세요!**

{
  "safetyScore": 0-100,
  "safetyDescription": "안전도 설명(2-3문장)",
  "summary": "영상 요약(3-5문장)",
  "warnings": [{"timestamp": "MM:SS", "quote": "해당 시간대의 실제 대사/자막 내용", "description": "짧게 5자 이내 요약 (예: 욕설 사용)", "severity": "high/medium/low"}],
  "flow": [{"timestamp": "MM:SS", "description": "해당 구간 설명"}]
}

**중요: 영상 전체를 끝까지 시청하고 분석하세요!**

**분석 기준:**
- 영상을 0:00부터 ${videoDurationMinutes}:00까지 **전체를 끝까지** 분석
- 처음 몇 분만 보지 말고 **중간과 끝 부분도 반드시 포함**
- 화면 텍스트/자막 포함 모든 콘텐츠 검사
- 탐지 대상: 폭력/성적 표현/욕설/혐오 표현
- warnings.quote: 해당 시간대의 실제 대사나 자막 내용을 그대로 인용 (예: "이 멍청아, 죽고 싶어?")
- warnings.description: **매우 짧게 5자 이내로 요약** (예: "욕설 사용", "폭력 장면", "선정적 표현")
- 교육적 맥락은 관대히 평가
- flow: 영상 전체 흐름을 시작-중간-끝까지 5-7개 구간만 간단히 설명
  * **반드시 마지막 구간은 영상 끝부분의 타임스탬프여야 함**

**중요: 중복 제거 규칙**
- 같은 시간대(10초 이내)의 비슷한 경고는 하나만 포함
- 경미한 표현("야!", "아!" 등 단순 고함)은 제외
- 실제로 부적절한 내용만 포함
- 비슷한 비속어가 반복되면 가장 심각한 것 하나만 선택

**점수:** 85-100(안전)/65-84(주의)/40-64(보호자동반)/0-39(부적절)`,
            },
          ],
        });

        const text = response.text;

        // JSON 파싱 (Gemini가 마크다운 코드블록으로 감쌀 수 있음)
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        } catch (parseError) {
          console.error("JSON 파싱 실패:", parseError);
          analysis = {
            safetyScore: 50,
            safetyDescription: "분석 중 오류가 발생했습니다",
            summary: text.substring(0, 200),
            warnings: [],
            chapters: [],
            flow: [],
          };
        }
      }

      // 중복 경고 필터링
      if (analysis && analysis.warnings) {
        const originalCount = analysis.warnings.length;
        analysis.warnings = filterDuplicateWarnings(analysis.warnings);
        console.log(
          `🔄 중복 제거 완료: warnings ${originalCount}개 → ${analysis.warnings.length}개`
        );
      }

      // 결과를 Firestore에 저장
      await db.collection("analysisRequests").doc(docId).update({
        status: "completed",
        analysis,
        completedAt: new Date(),
      });

      // 이메일 알림 전송 - 최신 데이터를 다시 읽기 (분석 중 업데이트된 sendEmail 확인)
      const updatedDoc = await db
        .collection("analysisRequests")
        .doc(docId)
        .get();
      const updatedData = updatedDoc.data();

      console.log("이메일 체크 (최신):", {
        sendEmail: updatedData.sendEmail,
        userEmail: updatedData.userEmail,
      });

      if (updatedData.sendEmail && updatedData.userEmail) {
        console.log("이메일 전송 시작:", updatedData.userEmail);
        try {
          await sendAnalysisEmail(updatedData.userEmail, {
            videoUrl,
            videoTitle: videoInfo?.title || "알 수 없음",
            analysis,
            gradeLevel: selectedFilter.name,
          });
          console.log(`✅ 이메일 전송 성공: ${updatedData.userEmail}`);
        } catch (emailError) {
          console.error("❌ 이메일 전송 실패:", emailError);
          // 이메일 전송 실패해도 분석 결과는 저장됨
        }
      } else {
        console.log("이메일 전송 스킵 (sendEmail: false 또는 userEmail 없음)");
      }
    } catch (error) {
      console.error("분석 중 오류:", error);

      // 에러 상태로 업데이트
      await db.collection("analysisRequests").doc(docId).update({
        status: "error",
        error: error.message,
      });
    }
  }
);

// YouTube 자막 가져오기
async function fetchTranscript(videoId) {
  try {
    // youtube-transcript로 자막 가져오기
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);

    // 타임스탬프를 "MM:SS" 형식으로 변환
    const formatTimestamp = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 자막 배열을 텍스트로 변환
    const fullText = transcriptArray
      .map((item) => item.text)
      .join(" ")
      .replace(/\[.*?\]/g, "") // [음악], [박수] 같은 설명 제거
      .replace(/\s+/g, " ") // 여러 공백을 하나로
      .trim();

    // 타임스탬프 정보 포함된 세그먼트
    const segments = transcriptArray.map((item) => ({
      timestamp: formatTimestamp(item.offset / 1000),
      text: item.text,
    }));

    console.log(
      `자막 가져오기 성공 (${transcriptArray.length}개 세그먼트, ${fullText.length}자)`
    );

    return { fullText, segments };
  } catch (error) {
    console.error("자막 가져오기 실패:", error.message);

    // 자막이 없거나 가져올 수 없는 경우
    if (
      error.message.includes("Could not find captions") ||
      error.message.includes("Transcript is disabled")
    ) {
      return { fullText: null, segments: [] };
    }

    throw error;
  }
}

/**
 * 개별 청크 분석 함수
 */
async function analyzeChunk(
  videoUrl,
  chunkIndex,
  startTime,
  endTime,
  chunkTranscript,
  selectedFilter,
  videoDurationMinutes
) {
  const startMin = Math.floor(startTime / 60);
  const endMin = Math.floor(endTime / 60);

  console.log(
    `📹 청크 ${chunkIndex + 1} 분석 중 (${startMin}:00 ~ ${endMin}:00)...`
  );

  const response = await callGeminiWithRateLimit("gemini-2.5-flash", {
    parts: [
      {
        fileData: {
          fileUri: videoUrl,
        },
      },
      {
        text: `YouTube 영상의 일부 구간을 "${selectedFilter.name}"(${
          selectedFilter.criteria
        }) 학생 시청 적합성 분석. JSON 응답:

**전체 영상 길이: 약 ${videoDurationMinutes}분**
**현재 분석 구간: ${startMin}:00 ~ ${endMin}:00 (${endMin - startMin}분)**

**중요: ${startMin}:00부터 ${endMin}:00까지의 구간만 집중 분석하세요!**

**해당 구간 자막:**
${chunkTranscript || "(자막 없음 - 화면 내용으로만 분석)"}

{
  "chunkStartTime": ${startTime},
  "chunkEndTime": ${endTime},
  "warnings": [{"timestamp": "MM:SS", "quote": "해당 시간대의 실제 대사/자막 내용", "description": "짧게 5자 이내 요약 (예: 욕설 사용)", "severity": "high/medium/low"}],
  "flow": [{"timestamp": "MM:SS", "description": "해당 구간 설명"}]
}

**분석 기준:**
- ${startMin}:00부터 ${endMin}:00까지의 구간만 분석
- 타임스탬프는 영상 전체 기준(0:00부터)으로 표기
- 화면 텍스트/자막 포함 모든 콘텐츠 검사
- 탐지 대상: 폭력/성적 표현/욕설/혐오 표현
- warnings.quote: 해당 시간대의 실제 대사나 자막 내용을 그대로 인용
- warnings.description: **매우 짧게 5자 이내로 요약** (예: "욕설 사용", "폭력 장면", "선정적 표현")
- flow: 해당 구간 흐름을 3-4개 타임스탬프로 간단히 설명

**중요: 중복 제거**
- 같은 시간대(10초 이내)의 비슷한 경고는 하나만
- 경미한 표현("야!", "아!")은 제외
- 실제 부적절한 내용만 포함`,
      },
    ],
  });

  const text = response.text;

  // JSON 파싱
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const chunkAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    console.log(
      `✓ 청크 ${chunkIndex + 1} 분석 완료 (warnings: ${
        (chunkAnalysis.warnings || []).length
      }, flow: ${(chunkAnalysis.flow || []).length})`
    );

    return {
      startTime,
      endTime,
      warnings: chunkAnalysis.warnings || [],
      flow: chunkAnalysis.flow || [],
    };
  } catch (parseError) {
    console.error(`청크 ${chunkIndex + 1} JSON 파싱 실패:`, parseError);
    return {
      startTime,
      endTime,
      warnings: [],
      flow: [],
    };
  }
}

/**
 * 청크 분석 결과 병합 함수
 */
function mergeChunkResults(chunkResults, videoDuration) {
  console.log(`🔄 ${chunkResults.length}개 청크 결과 병합 중...`);

  // 모든 청크의 warnings, flow를 합치기
  const allWarnings = [];
  const allFlow = [];

  chunkResults.forEach((chunk, idx) => {
    console.log(
      `  청크 ${idx + 1}: warnings ${(chunk.warnings || []).length}개, flow ${
        (chunk.flow || []).length
      }개`
    );
    allWarnings.push(...(chunk.warnings || []));
    allFlow.push(...(chunk.flow || []));
  });

  console.log(
    `📝 병합 전 총계: warnings ${allWarnings.length}개, flow ${allFlow.length}개`
  );

  // 타임스탬프 기준 정렬
  const sortByTimestamp = (a, b) => {
    const timeA = parseTimestamp(a.timestamp);
    const timeB = parseTimestamp(b.timestamp);
    return timeA - timeB;
  };

  allWarnings.sort(sortByTimestamp);
  allFlow.sort(sortByTimestamp);

  // 중복 경고 필터링
  const filteredWarnings = filterDuplicateWarnings(allWarnings);
  console.log(
    `🔄 중복 제거: warnings ${allWarnings.length}개 → ${filteredWarnings.length}개`
  );

  // flow를 7-8개 정도로 간소화 (시간 기준)
  let finalFlow = allFlow;
  if (allFlow.length > 10) {
    const targetCount = 8;
    const timeInterval = videoDuration / (targetCount - 1); // 영상 전체를 균등하게 나눔
    finalFlow = [];

    // 각 시간대에서 가장 가까운 flow 항목 찾기
    for (let i = 0; i < targetCount; i++) {
      const targetTime = i * timeInterval;

      // targetTime에 가장 가까운 flow 찾기
      let closestFlow = allFlow[0];
      let minDiff = Math.abs(parseTimestamp(allFlow[0].timestamp) - targetTime);

      allFlow.forEach((flow) => {
        const flowTime = parseTimestamp(flow.timestamp);
        const diff = Math.abs(flowTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestFlow = flow;
        }
      });

      // 중복 방지
      if (!finalFlow.find((f) => f.timestamp === closestFlow.timestamp)) {
        finalFlow.push(closestFlow);
      }
    }

    // 타임스탬프 순으로 재정렬
    finalFlow.sort(sortByTimestamp);

    console.log(`📊 Flow 간소화: ${allFlow.length}개 → ${finalFlow.length}개`);
  } else {
    console.log(`📊 Flow ${allFlow.length}개 - 간소화 불필요`);
  }

  console.log(
    `✅ 병합 완료: warnings ${allWarnings.length}개, flow ${finalFlow.length}개`
  );

  return {
    warnings: filteredWarnings,
    flow: finalFlow,
  };
}

/**
 * 타임스탬프를 초 단위로 변환 (MM:SS 형식)
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
 * 10분 단위 청킹 분석 메인 함수
 */
async function analyzeVideoInChunks(
  docId,
  videoId,
  videoUrl,
  selectedFilter,
  videoDuration
) {
  const CHUNK_DURATION = 600; // 10분 = 600초
  const videoDurationMinutes = Math.floor(videoDuration / 60);

  console.log(
    `🎬 긴 영상 감지 (${videoDurationMinutes}분) - 청킹 분석 시작...`
  );

  // 자막 가져오기
  let transcript = null;
  try {
    const transcriptData = await fetchTranscript(videoId);
    transcript = transcriptData;
    console.log(
      `✓ 자막 가져오기 성공: ${
        transcriptData.segments ? transcriptData.segments.length : 0
      }개 세그먼트`
    );
  } catch (error) {
    console.log(
      `⚠️ 자막 가져오기 실패, 비디오만으로 분석 진행:`,
      error.message
    );
  }

  // 청크 개수 계산
  const numChunks = Math.ceil(videoDuration / CHUNK_DURATION);
  console.log(`📦 ${numChunks}개 청크로 분할하여 분석`);

  // Firestore에 총 청크 수 업데이트
  await db
    .collection("analysisRequests")
    .doc(docId)
    .update({
      totalChunks: numChunks,
      completedChunks: 0,
      partialResults: {
        chunks: [],
      },
    });

  // 완료된 청크를 저장할 배열
  const chunkResults = new Array(numChunks);
  let completedCount = 0;

  // 각 청크 분석 (병렬 처리 + 실시간 업데이트)
  const chunkPromises = [];
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * CHUNK_DURATION;
    const endTime = Math.min((i + 1) * CHUNK_DURATION, videoDuration);

    // 해당 시간대의 자막 추출
    let chunkTranscript = "";
    if (transcript && transcript.segments) {
      const relevantSegments = transcript.segments.filter((segment) => {
        const segmentTime = parseTimestamp(segment.timestamp);
        return segmentTime >= startTime && segmentTime < endTime;
      });

      chunkTranscript = relevantSegments
        .map((seg) => `[${seg.timestamp}] ${seg.text}`)
        .join("\n");
    }

    // 청크 분석 프로미스 (완료되는 즉시 Firestore 업데이트)
    const chunkIndex = i;
    chunkPromises.push(
      analyzeChunk(
        videoUrl,
        chunkIndex,
        startTime,
        endTime,
        chunkTranscript,
        selectedFilter,
        videoDurationMinutes
      ).then(async (result) => {
        // 결과 저장
        chunkResults[chunkIndex] = result;
        completedCount++;

        console.log(
          `⚡ 청크 ${
            chunkIndex + 1
          }/${numChunks} 완료 - 즉시 Firestore 업데이트`
        );

        // Firestore에 즉시 업데이트 (순서 상관없이)
        const docRef = db.collection("analysisRequests").doc(docId);
        const docSnapshot = await docRef.get();
        const currentData = docSnapshot.data();

        const updatedChunks = currentData.partialResults?.chunks || [];
        updatedChunks.push({
          chunkIndex,
          startTime,
          endTime,
          warnings: result.warnings || [],
          flow: result.flow || [],
          completedAt: new Date().toISOString(),
        });

        await docRef.update({
          completedChunks: completedCount,
          partialResults: {
            chunks: updatedChunks,
          },
        });

        return result;
      })
    );
  }

  // 모든 청크 완료 대기
  await Promise.all(chunkPromises);

  // 결과 병합
  const mergedResults = mergeChunkResults(chunkResults, videoDuration);

  // 전체 요약 생성 (Gemini에게 전체 flow를 보고 요약 요청)
  console.log(`📝 전체 영상 요약 생성 중...`);

  const flowSummary = mergedResults.flow
    .map((f) => `${f.timestamp}: ${f.description}`)
    .join("\n");

  const summaryResponse = await callGeminiWithRateLimit("gemini-2.5-flash", {
    parts: [
      {
        text: `다음은 ${videoDurationMinutes}분 길이의 YouTube 영상을 분석한 타임라인입니다.
이 정보를 바탕으로 영상 전체 내용을 3-5문장으로 요약하고, "${
          selectedFilter.name
        }" 학생에게 적합한지 0-100 점수를 매겨주세요.

**영상 타임라인:**
${flowSummary}

**감지된 경고 사항:**
${mergedResults.warnings.length}개 (${mergedResults.warnings
          .map((w) => w.timestamp)
          .join(", ")})

JSON 응답:
{
  "summary": "영상 전체 요약(3-5문장)",
  "safetyScore": 0-100,
  "safetyDescription": "안전도 설명(2-3문장)"
}

**점수 기준:** 85-100(안전)/65-84(주의)/40-64(보호자동반)/0-39(부적절)`,
      },
    ],
  });

  let summary = "영상 요약 정보";
  let safetyScore = 70;
  let safetyDescription = "전체 분석 완료";

  try {
    const summaryText = summaryResponse.text;
    const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summaryData = JSON.parse(jsonMatch[0]);
      summary = summaryData.summary || summary;
      safetyScore = summaryData.safetyScore || safetyScore;
      safetyDescription = summaryData.safetyDescription || safetyDescription;
    }
  } catch (error) {
    console.error("요약 파싱 실패:", error.message);
  }

  console.log(`✅ 청킹 분석 완료 - 안전도: ${safetyScore}`);

  return {
    safetyScore,
    safetyDescription,
    summary,
    warnings: mergedResults.warnings,
    chapters: [],
    flow: mergedResults.flow,
  };
}

// 이메일 전송 함수
async function sendAnalysisEmail(
  toEmail,
  { videoUrl, videoTitle, analysis, gradeLevel }
) {
  // 이메일 전송을 위한 transporter 설정
  // 실제 사용시 Gmail App Password를 환경변수로 설정 필요
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Gmail 주소
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
  });

  // 경고 섹션 HTML 생성
  const warningsHtml =
    analysis.warnings && analysis.warnings.length > 0
      ? `
      <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-left: 5px solid #ffc107; border-radius: 8px;">
        <h3 style="color: #dc3545; margin-top: 0;">🚨 부적절한 내용 감지 (${
          analysis.warnings.length
        }개)</h3>
        ${analysis.warnings
          .map(
            (w) => `
          <div style="margin: 15px 0; padding: 12px; background-color: white; border-radius: 6px;">
            <strong style="color: #dc3545;">${
              w.timestamp || "시간 미상"
            }</strong>
            <p style="margin: 5px 0;">${w.description}</p>
            ${
              w.reason
                ? `<small style="color: #666;">사유: ${w.reason}</small>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `
      : '<p style="color: #28a745;">✅ 부적절한 내용이 감지되지 않았습니다.</p>';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `[SaferTube] "${videoTitle}" 분석 완료`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">SaferTube</h1>
          <p style="color: white; margin: 10px 0 0 0;">YouTube 영상 안전 분석 결과</p>
        </div>

        <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">분석 대상 학년: ${gradeLevel}</h2>

          <div style="margin: 20px 0; padding: 20px; background-color: ${
            analysis.safetyScore >= 80
              ? "#d4edda"
              : analysis.safetyScore >= 50
              ? "#fff3cd"
              : "#f8d7da"
          }; border-radius: 8px;">
            <h3 style="margin-top: 0;">안전도: ${analysis.safetyScore}/100</h3>
            <p>${analysis.safetyDescription}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>📝 영상 요약</h3>
            <p style="line-height: 1.6; color: #555;">${analysis.summary}</p>
          </div>

          ${warningsHtml}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${videoUrl}" style="display: inline-block; padding: 15px 30px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              YouTube에서 보기
            </a>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            SaferTube는 AI 기반 YouTube 콘텐츠 안전 분석 서비스입니다.<br/>
            이 메일은 요청하신 분석 결과를 전달하기 위해 발송되었습니다.
          </p>
        </div>
      </div>
    `,
  };

  // 로컬 개발 환경에서는 이메일 전송 스킵
  if (process.env.FUNCTIONS_EMULATOR === "true" || !process.env.EMAIL_USER) {
    console.log("[로컬 개발] 이메일 전송 스킵:", toEmail);
    console.log("이메일 내용:", mailOptions.subject);
    return;
  }

  await transporter.sendMail(mailOptions);
}

// YouTube 검색 및 추천 함수
exports.recommendVideos = onDocumentCreated(
  {
    document: "recommendationRequests/{docId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const docId = event.params.docId;
    const data = event.data.data();

    try {
      // 상태를 processing으로 변경
      await db.collection("recommendationRequests").doc(docId).update({
        status: "processing",
      });

      const {
        subject,
        intention,
        objective,
        gradeLevel,
        userId,
        anonymousId,
        filters,
        isPhysicalArts,
        activityType,
        availableTools,
        teacherInvolvement,
        duration,
        studentLevel,
        preferredDuration,
      } = data;

      // 로컬 개발 환경 체크 (localhost에서는 크레딧 제한 없음)
      const isLocalDev =
        process.env.FUNCTIONS_EMULATOR === "true" ||
        process.env.NODE_ENV === "development";

      // 사용자 크레딧 확인 (프로덕션 환경에서만 실제 차감)
      if (userId) {
        // 개발자 계정 체크 (무제한 사용)
        let isDeveloper = false;
        try {
          const userRecord = await auth.getUser(userId);
          const developerEmails = ["kerbongkim@gmail.com"]; // 개발자 이메일 리스트
          if (developerEmails.includes(userRecord.email)) {
            isDeveloper = true;
            console.log(
              `👨‍💻 개발자 계정 감지 (추천): ${userRecord.email} - 크레딧 제한 없음`
            );
          }
        } catch (error) {
          console.log("개발자 계정 체크 실패:", error.message);
        }

        if (!isDeveloper) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.exists
            ? userDoc.data()
            : { recommendCreditsUsed: 0, lastRecommendReset: new Date() };

          // 하루가 지났으면 리셋
          const lastReset = userData.lastRecommendReset?.toDate
            ? userData.lastRecommendReset.toDate()
            : userData.lastRecommendReset || new Date(0);
          const now = new Date();
          const daysPassed = Math.floor(
            (now - lastReset) / (1000 * 60 * 60 * 24)
          );

          let creditsUsed = userData.recommendCreditsUsed || 0;
          if (daysPassed >= 1) {
            creditsUsed = 0;
          }

          const maxCredits = 10; // 로그인 시 10개로 증가

          if (isLocalDev) {
            console.log(
              `[로컬 개발] 추천 크레딧 사용: ${
                creditsUsed + 1
              }/${maxCredits} (실제 차감 안함)`
            );
          } else {
            // 프로덕션 환경: 실제 크레딧 차감
            if (creditsUsed >= maxCredits) {
              throw new Error(
                `하루 추천 한도를 초과했습니다. (사용: ${creditsUsed}/${maxCredits})`
              );
            }

            // 크레딧 차감
            await db
              .collection("users")
              .doc(userId)
              .set(
                {
                  recommendCreditsUsed: creditsUsed + 1,
                  lastRecommendReset: daysPassed >= 1 ? now : lastReset,
                },
                { merge: true }
              );
          }
        }
      } else {
        // 비로그인 사용자 - anonymousId 기반 제한
        const maxCredits = 3; // 비로그인 시 3개

        if (isLocalDev) {
          console.log(
            `[로컬 개발] 비로그인 추천 크레딧: 1/${maxCredits} (실제 제한 없음)`
          );
        } else {
          if (!anonymousId) {
            console.log("비로그인 사용자 anonymousId 없음 - 제한 스킵");
          } else {
            // anonymousId 기반으로 사용량 추적
            const anonDocRef = db
              .collection("anonymousRecommendUsage")
              .doc(anonymousId);
            const anonDoc = await anonDocRef.get();
            const anonData = anonDoc.exists
              ? anonDoc.data()
              : { creditsUsed: 0, lastReset: new Date() };

            // 하루가 지났으면 리셋
            const lastReset = anonData.lastReset?.toDate
              ? anonData.lastReset.toDate()
              : anonData.lastReset || new Date(0);
            const now = new Date();
            const daysPassed = Math.floor(
              (now - lastReset) / (1000 * 60 * 60 * 24)
            );

            let anonCreditsUsed = anonData.creditsUsed || 0;
            if (daysPassed >= 1) {
              anonCreditsUsed = 0;
            }

            // 한도 체크
            if (anonCreditsUsed >= maxCredits) {
              throw new Error(
                `비로그인 사용자는 하루 ${maxCredits}개까지만 추천 가능합니다. (사용: ${anonCreditsUsed}/${maxCredits})\n로그인하면 10개까지 사용할 수 있습니다!`
              );
            }

            // 크레딧 차감
            await anonDocRef.set(
              {
                creditsUsed: anonCreditsUsed + 1,
                lastReset: daysPassed >= 1 ? now : lastReset,
                lastUsed: now,
              },
              { merge: true }
            );

            console.log(
              `비로그인 사용자 추천 크레딧 차감: ${
                anonCreditsUsed + 1
              }/${maxCredits} (ID: ${anonymousId})`
            );
          }
        }
      }

      // 학년별 필터링 기준
      const gradeFilters = {
        "elementary-1-2": {
          name: "초등 1~2학년",
          criteria: "만 7-8세 수준. 매우 순수한 표현만 허용.",
        },
        "elementary-3-4": {
          name: "초등 3~4학년",
          criteria: "만 9-10세 수준. 가벼운 경쟁/갈등은 가능.",
        },
        "elementary-5-6": {
          name: "초등 5~6학년",
          criteria: "만 11-12세 수준. 사회 이슈 다룰 수 있음.",
        },
        "middle-school": {
          name: "중학생",
          criteria: "만 13-15세 수준. 비교적 자유로움.",
        },
      };

      const selectedFilter =
        gradeFilters[gradeLevel] || gradeFilters["elementary-1-2"];

      // Gemini로 최적의 검색어 생성 (학년 정보 포함)
      const searchKeywords = await generateSearchKeywords(
        subject,
        intention,
        objective,
        isPhysicalArts,
        activityType,
        availableTools,
        teacherInvolvement,
        duration,
        studentLevel,
        gradeLevel
      );
      console.log("Gemini 생성 검색어:", searchKeywords);

      // 영상 길이 필터 적용
      let appliedFilters = filters || {};

      // 체육/미술 수업의 경우 차시에 따른 영상 길이 필터 적용
      if (isPhysicalArts && duration) {
        appliedFilters = {
          ...appliedFilters,
          maxDuration: parseInt(duration) * 60, // 분을 초로 변환
        };
      }

      // 일반 수업에서 사용자가 선호 영상 길이를 선택한 경우
      if (preferredDuration && !isPhysicalArts) {
        appliedFilters = {
          ...appliedFilters,
          preferredMaxDuration: parseInt(preferredDuration) * 60, // 분을 초로 변환
        };
      }

      // 짜투리영상, 안전교육은 신뢰채널 전용 검색
      const isTrustedChannelOnly =
        subject === "짜투리영상" || subject === "안전교육";

      let searchResults;

      if (isTrustedChannelOnly) {
        // 신뢰채널 전용 검색 (학년별 맞춤 키워드 사용)
        console.log(
          `🔒 ${subject}: 신뢰채널 전용 검색 모드 (학년: ${gradeLevel})`
        );
        searchResults = await searchTrustedChannelVideos(
          subject,
          gradeLevel,
          10,
          appliedFilters
        );
      } else {
        // 일반 YouTube 검색 (기존 로직)
        searchResults = await searchYouTubeVideos(
          searchKeywords,
          10,
          appliedFilters,
          subject // 과목을 전달하여 신뢰채널 필터 적용
        );
      }

      if (!searchResults || searchResults.length === 0) {
        throw new Error(
          isTrustedChannelOnly
            ? `${subject}에 적합한 영상을 신뢰채널에서 찾을 수 없습니다.`
            : "관련 영상을 찾을 수 없습니다."
        );
      }

      console.log(
        `⚡ ${searchResults.length}개 영상 발견, 실시간 스트리밍 분석 시작...`
      );

      // 실시간 업데이트를 위한 recommendations 배열
      let recommendations = [];
      let completedCount = 0;
      const totalCount = searchResults.length;

      // 초기 상태 업데이트 (분석 시작, 총 개수 알림)
      await db.collection("recommendationRequests").doc(docId).update({
        status: "analyzing",
        totalVideos: totalCount,
        analyzedCount: 0,
        recommendations: [],
      });

      // 각 영상 분석 (병렬 처리하되, 완료될 때마다 실시간 업데이트)
      const analysisPromises = searchResults.map((video) =>
        analyzeVideoForRecommendation(
          video.videoId,
          video.videoUrl,
          selectedFilter,
          intention,
          objective,
          subject
        )
          .then(async (analysis) => {
            const filteredWarnings = filterDuplicateWarnings(
              analysis.warnings || []
            );
            const recommendation = {
              videoId: video.videoId,
              videoUrl: video.videoUrl,
              title: video.title,
              duration: video.duration,
              viewCount: video.viewCount || 0,
              likeCount: video.likeCount || 0,
              safetyScore: analysis.safetyScore,
              safetyDescription: analysis.safetyDescription,
              summary: analysis.summary || "",
              warnings: filteredWarnings,
              warningCount: filteredWarnings.length,
              chapters: analysis.chapters || [],
              flow: analysis.flow || [],
            };

            // 분석 완료된 영상을 recommendations에 추가
            recommendations.push(recommendation);
            completedCount++;

            console.log(
              `✓ [${completedCount}/${totalCount}] ${video.title} 분석 완료 (안전도: ${analysis.safetyScore})`
            );

            // 안전도 순으로 정렬 후 실시간 업데이트
            const sortedRecommendations = [...recommendations].sort(
              (a, b) => b.safetyScore - a.safetyScore
            );

            await db
              .collection("recommendationRequests")
              .doc(docId)
              .update({
                analyzedCount: completedCount,
                recommendations: sortedRecommendations,
              });

            return { success: true, video, analysis };
          })
          .catch((error) => {
            completedCount++;
            console.error(`✗ [${completedCount}/${totalCount}] ${video.title} 분석 실패: ${error.message}`);

            // 실패해도 진행 상황 업데이트
            db.collection("recommendationRequests")
              .doc(docId)
              .update({
                analyzedCount: completedCount,
              });

            return { success: false, video, error: error.message };
          })
      );

      console.log(`⏱️ ${searchResults.length}개 영상 동시 분석 중 (실시간 업데이트)...`);
      const analysisResults = await Promise.all(analysisPromises);

      const successCount = analysisResults.filter((r) => r.success).length;
      console.log(
        `✅ 분석 완료: ${successCount}/${searchResults.length}개 성공`
      );

      // 실패한 분석 로그
      const failedAnalyses = analysisResults.filter(
        (result) => !result.success
      );
      if (failedAnalyses.length > 0) {
        console.log(`⚠️ ${failedAnalyses.length}개 영상 분석 실패:`);
        failedAnalyses.forEach((result) => {
          console.error(`  - ${result.video.title}: ${result.error}`);
        });
      }

      // 최종 정렬 (안전도 점수 순)
      recommendations.sort((a, b) => b.safetyScore - a.safetyScore);

      // 최종 결과 저장
      await db.collection("recommendationRequests").doc(docId).update({
        status: "completed",
        recommendations,
        completedAt: new Date(),
      });

      console.log(`✅ 추천 완료: ${recommendations.length}개 영상`);

      // 이메일 알림 전송 (최신 데이터 다시 읽기)
      const updatedDoc = await db
        .collection("recommendationRequests")
        .doc(docId)
        .get();
      const updatedData = updatedDoc.data();

      if (updatedData.sendEmail && updatedData.userEmail) {
        console.log("이메일 전송 시작:", updatedData.userEmail);
        try {
          await sendRecommendationEmail(updatedData.userEmail, {
            subject: updatedData.subject,
            objective: updatedData.objective,
            gradeLevel: selectedFilter.name,
            recommendations,
            totalCount: recommendations.length,
          });
          console.log(`✅ 이메일 전송 성공: ${updatedData.userEmail}`);
        } catch (emailError) {
          console.error("❌ 이메일 전송 실패:", emailError);
        }
      }
    } catch (error) {
      console.error("추천 중 오류:", error);
      await db.collection("recommendationRequests").doc(docId).update({
        status: "error",
        error: error.message,
      });
    }
  }
);

// Gemini로 최적의 YouTube 검색어 생성
async function generateSearchKeywords(
  subject,
  intention,
  objective,
  isPhysicalArts = false,
  activityType = null,
  availableTools = null,
  teacherInvolvement = null,
  duration = null,
  studentLevel = null,
  gradeLevel = null
) {
  try {
    let prompt;

    if (isPhysicalArts) {
      // 학생 수준 텍스트
      const levelDescription =
        studentLevel === "하"
          ? "초급 수준 (기초 단계, 쉬운 활동)"
          : studentLevel === "중"
          ? "중급 수준 (평균 수준, 적당한 난이도)"
          : "상급 수준 (숙련 단계, 도전적인 활동)";

      // 차시 텍스트
      const durationText =
        duration === "40" ? "한 차시(40분)" : "두 차시(80분)";

      // 체육/미술 활동 전용 프롬프트
      prompt = `교실에서 바로 실행 가능한 ${activityType} 활동 YouTube 영상을 찾기 위한 검색어 3-5개 생성 (쉼표 구분, 한국어):

활동 유형: ${activityType}
수업 차시: ${durationText}
학생 수준: ${levelDescription}
사용 가능한 도구: ${availableTools}
교사 개입 정도: ${teacherInvolvement}

**조건:**
- 교실에서 바로 실행 가능한 활동
- ${durationText}에 맞는 적절한 길이의 영상
- ${levelDescription}에 맞는 난이도
- 준비물이 간단하고 실용적인 활동
- ${
        teacherInvolvement === "적음"
          ? "학생 자율 활동 중심"
          : teacherInvolvement === "보통"
          ? "교사 설명 + 학생 활동"
          : "교사 시범 및 단계별 지도"
      }
- 초등학생/중학생이 따라하기 쉬운 활동

예시) ${
        activityType === "체육"
          ? studentLevel === "하"
            ? "기초 스트레칭, 간단한 실내게임, 좌식 체조"
            : studentLevel === "중"
            ? "실내 스포츠 게임, 댄스, 줄넘기"
            : "고급 체육 기술, 복잡한 단체 게임, 체력 훈련"
          : studentLevel === "하"
          ? "기초 그리기, 쉬운 색칠하기, 간단한 만들기"
          : studentLevel === "중"
          ? "종이접기, 만들기 공예, 그림 그리기"
          : "고급 미술 기법, 복잡한 작품 제작, 창의적 미술"
      }

검색어만 출력:`;
    } else {
      // 학년별 검색어 스타일 가이드 생성
      const getGradeSearchGuide = (grade) => {
        if (!grade) return { level: "초등학생", style: "기본 개념 중심", suffix: "" };

        if (grade.includes("1학년") || grade.includes("2학년")) {
          return {
            level: "초등 저학년(1-2학년)",
            style: "쉬운 표현, 기초 개념, 따라하기 쉬운 활동",
            suffix: "쉬운, 기초, 따라하기",
            avoid: "복잡한 용어, 전문적인 기법"
          };
        } else if (grade.includes("3학년") || grade.includes("4학년")) {
          return {
            level: "초등 중학년(3-4학년)",
            style: "개념 이해 중심, 단계별 설명, 활동 위주",
            suffix: "알기, 배우기, 익히기",
            avoid: "너무 어려운 전문 용어"
          };
        } else if (grade.includes("5학년") || grade.includes("6학년")) {
          return {
            level: "초등 고학년(5-6학년)",
            style: "개념 + 활용, 창의적 응용, 심화 내용 가능",
            suffix: "활용하기, 응용하기, 개념알기",
            avoid: "유치하거나 너무 쉬운 내용"
          };
        } else if (grade.includes("중학")) {
          return {
            level: "중학생",
            style: "심화 개념, 전문적 기법, 프로젝트 기반",
            suffix: "기법, 원리, 심화",
            avoid: "초등학교 수준의 단순한 활동"
          };
        } else if (grade.includes("고등")) {
          return {
            level: "고등학생",
            style: "전문적 내용, 고급 기법, 이론 연계",
            suffix: "이론, 심화, 전문",
            avoid: "초중등 수준의 기초 내용"
          };
        }
        return { level: "초등학생", style: "기본 개념 중심", suffix: "", avoid: "" };
      };

      const gradeGuide = getGradeSearchGuide(gradeLevel);

      // 일반 수업 영상 검색 프롬프트
      // "미정" - 재미있고 의미있는 영상 추천
      if (subject === "미정") {
        prompt = `${gradeGuide.level}에게 적합한 재미있고 교육적인 YouTube 영상을 찾기 위한 검색어 3-5개 생성 (쉼표 구분, 한국어):

**대상:** ${gradeGuide.level}
**목표:** 학생들이 즐겁게 보면서 배울 수 있는 영상
${intention && intention.trim() ? `**수업 의도:** ${intention}` : ""}

**조건:**
- 재미있고 흥미로운 내용
- 교육적 가치가 있는 내용
- ${gradeGuide.level} 발달 단계에 적합
- 긍정적인 메시지 전달
- 창의성, 사고력, 감성 발달에 도움

**추천 주제 예시:**
- 과학 실험, 자연 다큐멘터리
- 역사 이야기, 위인 전기
- 예술/음악 감상, 창작 활동
- 사회 문제, 환경 보호
- 동물, 우주, 발명품 등

검색어만 출력:`;
      } else if (intention && intention.trim()) {
        // 수업 의도가 있으면 과목과 연계하여 구체적인 검색어 생성
        prompt = `${gradeGuide.level} ${subject} 수업을 위한 YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어):

**대상 학년:** ${gradeLevel || "초등학생"}
**과목:** ${subject}
**수업 의도 및 준비물:** ${intention}
${objective ? `**목표:** ${objective}` : ""}

**핵심: 학년 수준에 맞는 검색어 생성**
- 대상: ${gradeGuide.level}
- 적합한 스타일: ${gradeGuide.style}
- 권장 검색어 패턴: "핵심키워드 + ${gradeGuide.suffix || "배우기, 알기, 활용"}"
${gradeGuide.avoid ? `- 피해야 할 것: ${gradeGuide.avoid}` : ""}

**검색어 생성 규칙:**
1. 수업 의도에서 핵심 키워드만 추출하세요 (예: "색상환 이용한 디자인하기" → "색상환")
2. 핵심 키워드에 학년 수준에 맞는 접미어를 붙이세요
3. 절대 수업 의도 전체를 그대로 검색어로 사용하지 마세요
4. YouTube에서 실제로 검색되는 짧고 명확한 검색어를 만드세요

**좋은 검색어 예시 (${gradeGuide.level} 기준):**
- 수업 의도: "색상환 이용한 디자인하기"
  → 좋음: "색상환의 개념알기", "색상환 활용하기", "색상환 그리기"
  → 나쁨: "색상환 이용한 디자인하기" (너무 구체적, 검색 결과 없음)
- 수업 의도: "크리스마스 트리 만들기"
  → 좋음: "크리스마스 트리 만들기", "트리 꾸미기 미술"
- 수업 의도: "줄넘기 수업"
  → 좋음: "줄넘기 기초", "줄넘기 배우기"

검색어만 출력 (쉼표로 구분, 각 검색어는 2-5단어):`;
      } else {
        // 수업 의도가 없을 때는 과목에 맞는 일반적인 검색어
        prompt = `${gradeGuide.level} ${subject} 수업을 위한 YouTube 검색어 3-5개 생성 (쉼표 구분, 한국어):

**대상 학년:** ${gradeLevel || "초등학생"}
**과목:** ${subject}
${objective ? `**목표:** ${objective}` : ""}

**학년 수준 고려사항:**
- 대상: ${gradeGuide.level}
- 적합한 스타일: ${gradeGuide.style}
${gradeGuide.avoid ? `- 피해야 할 것: ${gradeGuide.avoid}` : ""}

**조건:**
- ${subject} 수업에 활용할 수 있는 영상
- ${gradeGuide.level}이 보기 적합한 내용
- 교육적이고 실용적인 내용

검색어만 출력 (쉼표로 구분):`;
      }
    }

    const response = await callGeminiWithRateLimit("gemini-2.5-flash", {
      parts: [
        {
          text: prompt,
        },
      ],
    });

    const keywords = response.text.trim();
    console.log("Gemini 생성 검색어:", keywords);

    // 쉼표로 구분된 검색어들을 배열로 변환
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  } catch (error) {
    console.error("검색어 생성 실패:", error.message);
    // 실패 시 기본 검색어 사용
    return [subject];
  }
}

// YouTube 영상 검색
async function searchYouTubeVideos(
  searchKeywords,
  maxResults = 10,
  filters = {},
  subject = null,
  _retryCount = 0
) {
  try {
    const youtubeApiKey = getCurrentYouTubeApiKey();

    // 신뢰 채널 ID 가져오기
    const trustedChannelIds = subject ? getTrustedChannelIds(subject) : [];
    console.log(
      `📌 과목: ${subject}, 신뢰채널 수: ${trustedChannelIds.length}개`
    );

    let allVideos = [];
    const seenVideoIds = new Set();

    // 필터 파라미터 생성
    let filterParams = "";

    // 영상 길이 필터
    if (filters.minDuration === 40) {
      filterParams += "&videoDuration=long"; // long = 20분 이상, 나중에 40분 이상만 필터링
    } else if (filters.preferredMaxDuration) {
      // 선호 길이에 따른 검색 파라미터
      const preferredMinutes = filters.preferredMaxDuration / 60;
      if (preferredMinutes <= 4) {
        filterParams += "&videoDuration=short"; // short = 4분 이하
      } else if (preferredMinutes <= 20) {
        filterParams += "&videoDuration=medium"; // medium = 4분~20분
      } else {
        filterParams += "&videoDuration=long"; // long = 20분 이상
      }
    }

    // 정렬 순서
    if (filters.order === "date") {
      filterParams += "&order=date"; // 최신순
    } else if (filters.order === "viewCount") {
      filterParams += "&order=viewCount"; // 조회수순
    }
    // 기본값: relevance (관련성순)

    // 각 검색어로 검색 (중복 제거하면서 수집)
    for (const keyword of searchKeywords) {
      console.log(`검색 시도: "${keyword}" (필터: ${JSON.stringify(filters)})`);

      // YouTube Data API v3 search 엔드포인트
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        keyword
      )}&type=video&maxResults=15&relevanceLanguage=ko&safeSearch=moderate${filterParams}&key=${youtubeApiKey}`;

      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        const errorMsg =
          errorData.error?.message || `HTTP ${searchResponse.status}`;

        // 403 에러 (할당량 초과)이고 재시도 가능한 경우 다음 키로 전환
        if (
          searchResponse.status === 403 &&
          _retryCount < YOUTUBE_API_KEYS.length - 1
        ) {
          console.warn(
            `⚠️ YouTube API 키 할당량 초과. 다음 키로 전환 시도... (${
              _retryCount + 1
            }/${YOUTUBE_API_KEYS.length})`
          );
          switchToNextYouTubeKey();
          return searchYouTubeVideos(
            searchKeywords,
            maxResults,
            filters,
            subject,
            _retryCount + 1
          );
        }

        console.error("YouTube API 응답:", errorMsg);
        continue; // 다음 검색어 시도
      }

      const searchData = await searchResponse.json();

      if (searchData.items && searchData.items.length > 0) {
        console.log(`✓ "${keyword}"로 ${searchData.items.length}개 영상 발견`);

        // 중복 제거하면서 추가
        searchData.items.forEach((item) => {
          if (!seenVideoIds.has(item.id.videoId)) {
            seenVideoIds.add(item.id.videoId);
            allVideos.push(item);
          }
        });
      }

      // 충분한 영상을 찾았으면 중단
      if (allVideos.length >= maxResults * 3) {
        break;
      }
    }

    if (allVideos.length === 0) {
      return [];
    }

    // 비디오 ID 목록 추출
    const videoIds = allVideos.map((item) => item.id.videoId);

    // 영상 상세 정보 가져오기 (길이, 조회수, 채널 정보 포함)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds.join(
      ","
    )}&key=${youtubeApiKey}`;
    const detailsResponse = await fetch(detailsUrl);

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json().catch(() => ({}));
      const errorMsg =
        errorData.error?.message || `HTTP ${detailsResponse.status}`;

      // 403 에러이고 재시도 가능한 경우 다음 키로 전환
      if (
        detailsResponse.status === 403 &&
        _retryCount < YOUTUBE_API_KEYS.length - 1
      ) {
        console.warn(
          `⚠️ YouTube API 키 할당량 초과 (details). 다음 키로 전환 시도... (${
            _retryCount + 1
          }/${YOUTUBE_API_KEYS.length})`
        );
        switchToNextYouTubeKey();
        return searchYouTubeVideos(
          searchKeywords,
          maxResults,
          filters,
          subject,
          _retryCount + 1
        );
      }

      throw new Error(
        `YouTube details failed: ${detailsResponse.status} - ${errorMsg}`
      );
    }

    const detailsData = await detailsResponse.json();

    // 결과 파싱
    let videos = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);
      return {
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        duration, // 초 단위
        viewCount: parseInt(item.statistics?.viewCount || "0"),
        likeCount: parseInt(item.statistics?.likeCount || "0"),
      };
    });

    // 신뢰채널 필터링 적용 (신뢰채널이 있을 경우)
    if (trustedChannelIds.length > 0) {
      const beforeCount = videos.length;
      videos = videos.filter((v) => trustedChannelIds.includes(v.channelId));
      console.log(
        `✅ 신뢰채널 필터 적용: ${beforeCount}개 → ${videos.length}개 (${
          beforeCount - videos.length
        }개 제외)`
      );
    }

    // 40분 이상 필터 적용
    if (filters.minDuration === 40) {
      videos = videos.filter((v) => v.duration >= 2400); // 2400초 = 40분
      console.log(`40분 이상 필터 적용 후: ${videos.length}개 영상`);
    }

    // 최대 길이 필터 적용 (체육/미술 수업용 - 엄격)
    if (filters.maxDuration) {
      videos = videos.filter((v) => v.duration <= filters.maxDuration);
      console.log(
        `${filters.maxDuration / 60}분 이하 필터 적용 후: ${
          videos.length
        }개 영상`
      );
    }

    // 선호 길이 필터 적용 (일반 수업용 - 우선순위)
    if (filters.preferredMaxDuration) {
      // 선호 길이의 80%~120% 범위 영상을 가장 우선
      const minPreferred = filters.preferredMaxDuration * 0.5;
      const maxPreferred = filters.preferredMaxDuration;

      const idealVideos = videos.filter(
        (v) => v.duration >= minPreferred && v.duration <= maxPreferred
      );
      const shorterVideos = videos.filter((v) => v.duration < minPreferred);
      const longerVideos = videos.filter((v) => v.duration > maxPreferred);

      videos = [...idealVideos, ...shorterVideos, ...longerVideos];
      console.log(
        `${filters.preferredMaxDuration / 60}분 기준: 이상적(${
          idealVideos.length
        }개), 짧음(${shorterVideos.length}개), 김(${longerVideos.length}개)`
      );
    }

    // 영상이 많을 경우 조회수 순으로 정렬하여 상위 영상만 선택
    if (videos.length > maxResults) {
      videos.sort((a, b) => b.viewCount - a.viewCount);
      console.log(
        `📊 조회수 순으로 정렬: 상위 ${maxResults}개 선택 (전체 ${videos.length}개)`
      );
    }

    // 최대 개수만큼만 가져오기
    videos = videos.slice(0, maxResults);

    console.log(
      `YouTube 검색 완료: ${videos.length}개 영상 (${searchKeywords.length}개 검색어 사용)`
    );
    return videos;
  } catch (error) {
    console.error("YouTube 검색 실패:", error.message);
    throw error;
  }
}

// ISO 8601 duration을 초 단위로 변환
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

// 신뢰채널 전용 검색 (짜투리영상, 안전교육용)
async function searchTrustedChannelVideos(
  subject,
  gradeLevel,
  maxResults = 10,
  filters = {},
  _retryCount = 0
) {
  try {
    const youtubeApiKey = getCurrentYouTubeApiKey();
    const trustedChannelIds = getTrustedChannelIds(subject);

    if (trustedChannelIds.length === 0) {
      console.log(`⚠️ ${subject}에 대한 신뢰채널이 없습니다.`);
      return [];
    }

    console.log(
      `🔒 신뢰채널 전용 검색: ${subject} (${trustedChannelIds.length}개 채널)`
    );

    // 학년별 검색 키워드 설정
    const gradeKeywords = getGradeKeywordsForSubject(subject, gradeLevel);
    console.log(`📚 학년별 검색어: ${gradeKeywords.join(", ")}`);

    let allVideos = [];
    const seenVideoIds = new Set();

    // 필터 파라미터 생성
    let filterParams = "";
    if (filters.preferredMaxDuration) {
      const preferredMinutes = filters.preferredMaxDuration / 60;
      if (preferredMinutes <= 4) {
        filterParams += "&videoDuration=short";
      } else if (preferredMinutes <= 20) {
        filterParams += "&videoDuration=medium";
      } else {
        filterParams += "&videoDuration=long";
      }
    }

    // 각 신뢰채널에서 영상 검색
    for (const channelId of trustedChannelIds) {
      // 채널별로 학년 맞춤 키워드로 검색
      for (const keyword of gradeKeywords) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(
          keyword
        )}&type=video&maxResults=5&order=viewCount&safeSearch=strict${filterParams}&key=${youtubeApiKey}`;

        try {
          const searchResponse = await fetch(searchUrl);

          if (!searchResponse.ok) {
            if (
              searchResponse.status === 403 &&
              _retryCount < YOUTUBE_API_KEYS.length - 1
            ) {
              console.warn(`⚠️ YouTube API 키 할당량 초과. 다음 키로 전환...`);
              switchToNextYouTubeKey();
              return searchTrustedChannelVideos(
                subject,
                gradeLevel,
                maxResults,
                filters,
                _retryCount + 1
              );
            }
            continue;
          }

          const searchData = await searchResponse.json();

          if (searchData.items && searchData.items.length > 0) {
            searchData.items.forEach((item) => {
              if (!seenVideoIds.has(item.id.videoId)) {
                seenVideoIds.add(item.id.videoId);
                allVideos.push(item);
              }
            });
          }
        } catch (err) {
          console.error(`채널 ${channelId} 검색 오류:`, err.message);
        }
      }

      // 충분한 영상 확보시 중단
      if (allVideos.length >= maxResults * 2) {
        break;
      }
    }

    if (allVideos.length === 0) {
      console.log("신뢰채널에서 영상을 찾지 못했습니다.");
      return [];
    }

    // 비디오 상세 정보 가져오기
    const videoIds = allVideos.map((item) => item.id.videoId);
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds.join(
      ","
    )}&key=${youtubeApiKey}`;
    const detailsResponse = await fetch(detailsUrl);

    if (!detailsResponse.ok) {
      if (
        detailsResponse.status === 403 &&
        _retryCount < YOUTUBE_API_KEYS.length - 1
      ) {
        switchToNextYouTubeKey();
        return searchTrustedChannelVideos(
          subject,
          gradeLevel,
          maxResults,
          filters,
          _retryCount + 1
        );
      }
      throw new Error(`YouTube details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    // 결과 파싱
    let videos = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);
      return {
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        duration,
        viewCount: parseInt(item.statistics?.viewCount || "0"),
        likeCount: parseInt(item.statistics?.likeCount || "0"),
      };
    });

    // 선호 길이 필터 적용
    if (filters.preferredMaxDuration) {
      const minPreferred = filters.preferredMaxDuration * 0.5;
      const maxPreferred = filters.preferredMaxDuration;

      const idealVideos = videos.filter(
        (v) => v.duration >= minPreferred && v.duration <= maxPreferred
      );
      const shorterVideos = videos.filter((v) => v.duration < minPreferred);
      const longerVideos = videos.filter((v) => v.duration > maxPreferred);

      videos = [...idealVideos, ...shorterVideos, ...longerVideos];
    }

    // 조회수 순 정렬 후 상위 선택
    videos.sort((a, b) => b.viewCount - a.viewCount);
    videos = videos.slice(0, maxResults);

    console.log(
      `✅ 신뢰채널 검색 완료: ${videos.length}개 영상 (${subject})`
    );
    return videos;
  } catch (error) {
    console.error("신뢰채널 검색 실패:", error.message);
    throw error;
  }
}

// 학년별 과목 맞춤 검색 키워드 생성
function getGradeKeywordsForSubject(subject, gradeLevel) {
  // 학년 파싱
  const isLowerElementary =
    gradeLevel?.includes("1학년") || gradeLevel?.includes("2학년");
  const isMiddleElementary =
    gradeLevel?.includes("3학년") || gradeLevel?.includes("4학년");
  const isUpperElementary =
    gradeLevel?.includes("5학년") || gradeLevel?.includes("6학년");
  const isMiddleSchool = gradeLevel?.includes("중학");
  const isHighSchool = gradeLevel?.includes("고등");

  if (subject === "짜투리영상") {
    if (isLowerElementary) {
      return [
        "어린이 애니메이션",
        "동요",
        "숫자 놀이",
        "색깔 배우기",
        "쉬운 과학",
        "재미있는 이야기",
      ];
    } else if (isMiddleElementary) {
      return [
        "과학 실험",
        "재미있는 상식",
        "퀴즈",
        "신기한 이야기",
        "동물",
        "우주",
      ];
    } else if (isUpperElementary) {
      return [
        "과학 다큐",
        "역사 이야기",
        "신기한 과학",
        "잡학 상식",
        "세계 여행",
        "미스터리",
      ];
    } else if (isMiddleSchool || isHighSchool) {
      return [
        "과학 다큐멘터리",
        "역사",
        "사회 이슈",
        "심리학",
        "우주",
        "기술",
      ];
    }
    // 기본값
    return ["재미있는 영상", "교육 영상", "어린이 영상"];
  }

  if (subject === "안전교육") {
    if (isLowerElementary) {
      return [
        "어린이 안전",
        "교통안전 동요",
        "안전 애니메이션",
        "위험 조심",
        "안전 수칙",
      ];
    } else if (isMiddleElementary) {
      return [
        "안전 교육",
        "화재 대피",
        "교통 안전",
        "지진 대피",
        "학교 안전",
        "생활 안전",
      ];
    } else if (isUpperElementary) {
      return [
        "재난 대비",
        "응급 처치",
        "안전 수칙",
        "사이버 안전",
        "소방 안전",
        "자연재해",
      ];
    } else if (isMiddleSchool || isHighSchool) {
      return [
        "재난 안전",
        "응급 처치법",
        "심폐소생술",
        "사이버 보안",
        "안전 교육",
        "위기 대응",
      ];
    }
    // 기본값
    return ["안전 교육", "안전 수칙", "재난 대비"];
  }

  return ["교육 영상"];
}

// 빠른 영상 분석 (추천용 - 간단한 점수만)
async function analyzeVideoForRecommendation(
  videoId,
  videoUrl,
  gradeFilter,
  intention = null,
  objective = null,
  subject = null
) {
  try {
    // 빠른 분석을 위한 간단한 프롬프트
    let contextText = "";
    if (subject === "미정") {
      contextText = `재미있고 교육적인 영상인지`;
    } else if (intention) {
      contextText = `"${intention}" 수업 의도에 적합한지`;
    } else {
      contextText = `${subject || objective || "수업용"} 영상으로 적합한지`;
    }

    // Gemini 2.0 Flash로 빠른 분석 (처음 2-3분만 확인)
    const response = await callGeminiWithRetry("gemini-2.5-flash", {
      parts: [
        {
          fileData: {
            fileUri: videoUrl,
          },
        },
        {
          text: `YouTube 영상의 처음 2-3분을 빠르게 분석하여 "${
            gradeFilter.name
          }" 학생에게 ${contextText} 평가. JSON만 출력:

{
  "safetyScore": 0-100,
  "summary": "영상 내용 1-2문장 요약"
}

**빠른 분석 기준:**
- 처음 2-3분만 확인 (빠른 판단)
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

JSON만 출력:`,
        },
      ],
    });

    const text = response.text;
    console.log(`⚡ 빠른 분석 (${videoId}):`, text.substring(0, 150));

    // 간단한 JSON 파싱
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log(`⚠️ ${videoId}: JSON 없음, 기본값 반환`);
        return {
          safetyScore: 75,
          safetyDescription: "빠른 분석 완료",
          summary: "분석 결과를 가져오는 중입니다.",
          warnings: [],
          chapters: [],
          flow: [],
        };
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // 간단한 검증 및 기본값
      return {
        safetyScore:
          typeof analysis.safetyScore === "number" ? analysis.safetyScore : 75,
        safetyDescription: analysis.summary || "빠른 분석 완료",
        summary: analysis.summary || "영상 내용 분석 완료",
        warnings: [],
        chapters: [],
        flow: [],
      };
    } catch (parseError) {
      console.log(`⚠️ ${videoId}: 파싱 오류, 기본값 반환`);
      return {
        safetyScore: 75,
        safetyDescription: "빠른 분석 완료",
        summary: "분석 결과를 가져오는 중입니다.",
        warnings: [],
        chapters: [],
        flow: [],
      };
    }
  } catch (error) {
    console.error(`❌ ${videoId}: 분석 실패 -`, error.message);
    return {
      safetyScore: 70,
      safetyDescription: "빠른 분석 중 오류 발생",
      summary: "영상 분석 중 오류가 발생했습니다.",
      warnings: [],
      chapters: [],
      flow: [],
    };
  }
}

// 영상 추천 이메일 전송
async function sendRecommendationEmail(
  toEmail,
  { subject, objective, gradeLevel, recommendations, totalCount }
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 상위 5개 영상만 이메일에 포함
  const topVideos = recommendations.slice(0, 5);

  const videosHtml = topVideos
    .map(
      (video, idx) => `
    <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 12px; border-left: 5px solid ${
      video.safetyScore >= 80
        ? "#28a745"
        : video.safetyScore >= 50
        ? "#ffc107"
        : "#dc3545"
    };">
      <h3 style="margin-top: 0; color: #333;">${idx + 1}. ${video.title}</h3>
      <div style="display: flex; gap: 20px; margin: 10px 0; font-size: 14px; color: #666;">
        <span>⏱️ ${Math.floor(video.duration / 60)}:${(video.duration % 60)
        .toString()
        .padStart(2, "0")}</span>
        <span style="font-weight: bold; color: ${
          video.safetyScore >= 80
            ? "#28a745"
            : video.safetyScore >= 50
            ? "#ffc107"
            : "#dc3545"
        };">
          안전도: ${video.safetyScore}/100
        </span>
      </div>
      <p style="margin: 10px 0; line-height: 1.5;">${
        video.safetyDescription
      }</p>
      ${
        video.warningCount > 0
          ? `
        <p style="color: #dc3545; margin: 10px 0; font-size: 14px;">
          ⚠️ 주의 장면 ${video.warningCount}개 발견
        </p>
      `
          : ""
      }
      <a href="https://www.youtube.com/watch?v=${video.videoId}"
         style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        YouTube에서 보기
      </a>
    </div>
  `
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `[SaferTube] "${subject}" 수업용 영상 ${totalCount}개 추천 완료`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">SaferTube</h1>
          <p style="color: white; margin: 10px 0 0 0;">수업용 YouTube 영상 추천 결과</p>
        </div>

        <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">📋 요청 정보</h2>
          <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 8px 0;"><strong>수업 주제:</strong> ${subject}</p>
            <p style="margin: 8px 0;"><strong>수업 목표:</strong> ${objective}</p>
            <p style="margin: 8px 0;"><strong>대상 학년:</strong> ${gradeLevel}</p>
            <p style="margin: 8px 0;"><strong>추천 영상:</strong> 총 ${totalCount}개 발견</p>
          </div>

          <h2 style="color: #333;">🎯 추천 영상 TOP ${topVideos.length}</h2>
          <p style="color: #666; margin-bottom: 20px;">안전도가 높은 순서대로 정렬했습니다.</p>

          ${videosHtml}

          ${
            totalCount > 5
              ? `
            <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #e8f0fe; border-radius: 8px;">
              <p style="color: #333; margin: 0;">
                <strong>총 ${totalCount}개 영상을 확인하시려면 SaferTube 웹사이트를 방문해주세요.</strong>
              </p>
            </div>
          `
              : ""
          }

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            SaferTube는 AI 기반 YouTube 콘텐츠 안전 분석 서비스입니다.<br/>
            이 메일은 요청하신 추천 결과를 전달하기 위해 발송되었습니다.
          </p>
        </div>
      </div>
    `,
  };

  // 로컬 개발 환경에서는 이메일 전송 스킵
  if (process.env.FUNCTIONS_EMULATOR === "true" || !process.env.EMAIL_USER) {
    console.log("[로컬 개발] 이메일 전송 스킵:", toEmail);
    console.log("이메일 내용:", mailOptions.subject);
    return;
  }

  await transporter.sendMail(mailOptions);
}

// YouTube 영상 정보 가져오기
async function fetchVideoInfo(videoId) {
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    // YouTube Data API v3로 영상 상세 정보 가져오기 (정확한 duration 포함)
    if (youtubeApiKey) {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtubeApiKey}`;
        const apiResponse = await fetch(apiUrl);

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();

          if (apiData.items && apiData.items.length > 0) {
            const videoData = apiData.items[0];
            const duration = parseDuration(videoData.contentDetails.duration);

            console.log(
              `✓ YouTube API로 영상 정보 가져오기 성공: ${
                videoData.snippet.title
              }, 길이: ${duration}초 (${Math.floor(duration / 60)}분 ${
                duration % 60
              }초)`
            );

            return {
              title: videoData.snippet.title,
              description: videoData.snippet.description || "설명 없음",
              duration,
            };
          }
        }
      } catch (apiError) {
        console.log(
          "YouTube API 호출 실패, oEmbed로 fallback:",
          apiError.message
        );
      }
    }

    // Fallback: YouTube oEmbed API 사용 (duration은 HTML 파싱)
    console.log(
      "⚠️ YouTube API 키 없음 또는 실패 - oEmbed 사용 (duration 부정확할 수 있음)"
    );

    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oEmbedResponse = await fetch(oEmbedUrl);

    if (!oEmbedResponse.ok) {
      return null;
    }

    const oEmbedData = await oEmbedResponse.json();

    // 영상 HTML 페이지에서 설명과 길이 추출 (비추천, 불안정)
    let description = "";
    let duration = 600; // 기본 10분

    try {
      const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(pageUrl);
      const html = await pageResponse.text();

      // 메타 태그에서 description 추출
      const descMatch = html.match(
        /<meta name="description" content="([^"]*)">/
      );
      if (descMatch) {
        description = descMatch[1];
      }

      // duration 추출 (ISO 8601 형식: PT1H2M10S)
      const durationMatch = html.match(/"duration":"PT(\d+H)?(\d+M)?(\d+S)?"/);
      if (durationMatch) {
        const hours = durationMatch[1] ? parseInt(durationMatch[1]) : 0;
        const minutes = durationMatch[2] ? parseInt(durationMatch[2]) : 0;
        const seconds = durationMatch[3] ? parseInt(durationMatch[3]) : 0;
        duration = hours * 3600 + minutes * 60 + seconds;
      } else {
        console.log("⚠️ HTML에서 duration 추출 실패 - 기본값 600초 사용");
      }
    } catch (err) {
      console.log("상세 정보 가져오기 실패:", err.message);
    }

    console.log(
      `영상 정보: ${oEmbedData.title}, 길이: ${duration}초 (HTML 파싱)`
    );

    return {
      title: oEmbedData.title,
      description: description || "설명 없음",
      duration,
    };
  } catch (error) {
    console.error("영상 정보 가져오기 실패:", error.message);
    return null;
  }
}

// ========================================
// 회원 탈퇴 처리 함수
// ========================================

exports.processAccountDeletion = onDocumentCreated(
  {
    document: "accountDeletionRequests/{docId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const docId = event.params.docId;
    const data = event.data.data();

    try {
      console.log(`회원 탈퇴 처리 시작: ${data.userId}`);

      const { userId, userEmail, userName } = data;

      if (!userId || !userEmail) {
        throw new Error("userId 또는 userEmail이 없습니다");
      }

      // 1. 사용자 데이터 수집 (삭제 전 정보 확인)
      const userData = {
        analysisCount: 0,
        recommendationCount: 0,
        jjimVideosCount: 0,
      };

      // 분석 기록 개수
      const analysisSnapshot = await db
        .collection("analysisRequests")
        .where("userId", "==", userId)
        .get();
      userData.analysisCount = analysisSnapshot.size;

      // 추천 기록 개수
      const recommendationSnapshot = await db
        .collection("recommendationRequests")
        .where("userId", "==", userId)
        .get();
      userData.recommendationCount = recommendationSnapshot.size;

      // 찜보따리 영상 개수
      const jjimDoc = await db.collection("jjimVideos").doc(userId).get();
      if (jjimDoc.exists()) {
        const jjimData = jjimDoc.data();
        const videos = jjimData.videos || [];
        userData.jjimVideosCount = videos.length;
      }

      console.log("삭제할 데이터:", userData);

      // 2. 모든 사용자 데이터 삭제

      // 2-1. 분석 기록 삭제 (배치 처리)
      if (userData.analysisCount > 0) {
        const batch1 = db.batch();
        analysisSnapshot.docs.forEach((doc) => {
          batch1.delete(doc.ref);
        });
        await batch1.commit();
        console.log(`✓ 분석 기록 ${userData.analysisCount}개 삭제 완료`);
      }

      // 2-2. 추천 기록 삭제 (배치 처리)
      if (userData.recommendationCount > 0) {
        const batch2 = db.batch();
        recommendationSnapshot.docs.forEach((doc) => {
          batch2.delete(doc.ref);
        });
        await batch2.commit();
        console.log(`✓ 추천 기록 ${userData.recommendationCount}개 삭제 완료`);
      }

      // 2-3. 찜보따리 삭제 (메인 문서 + overflow 문서들)
      if (userData.jjimVideosCount > 0) {
        // 메인 문서 삭제
        await db.collection("jjimVideos").doc(userId).delete();

        // overflow 문서들 찾아서 삭제 (jjimVideos_overflow_{userId}_* 형식)
        const overflowSnapshot = await db
          .collection("jjimVideos")
          .where("__name__", ">=", `jjimVideos_overflow_${userId}_`)
          .where("__name__", "<=", `jjimVideos_overflow_${userId}_\uf8ff`)
          .get();

        if (!overflowSnapshot.empty) {
          const batch3 = db.batch();
          overflowSnapshot.docs.forEach((doc) => {
            batch3.delete(doc.ref);
          });
          await batch3.commit();
          console.log(
            `✓ 찜보따리 overflow 문서 ${overflowSnapshot.size}개 삭제 완료`
          );
        }

        console.log(`✓ 찜보따리 ${userData.jjimVideosCount}개 삭제 완료`);
      }

      // 2-4. users 컬렉션에서 사용자 문서 삭제
      await db.collection("users").doc(userId).delete();
      console.log("✓ users 문서 삭제 완료");

      // 2-5. Firebase Authentication에서 사용자 삭제
      try {
        await auth.deleteUser(userId);
        console.log("✓ Firebase Auth 계정 삭제 완료");
      } catch (authError) {
        console.error(
          "Firebase Auth 삭제 실패 (이미 삭제되었거나 존재하지 않음):",
          authError.message
        );
        // 계속 진행 (이미 삭제된 경우 무시)
      }

      // 3. 완료 이메일 전송
      await sendAccountDeletionEmail(userEmail, userName, userData);
      console.log("✓ 탈퇴 완료 이메일 전송 완료");

      // 4. 탈퇴 요청 상태 업데이트
      await db.collection("accountDeletionRequests").doc(docId).update({
        status: "completed",
        processedAt: new Date(),
        deletedData: userData,
      });

      console.log(`✅ 회원 탈퇴 처리 완료: ${userEmail}`);
    } catch (error) {
      console.error("회원 탈퇴 처리 오류:", error);

      // 에러 상태로 업데이트
      await db.collection("accountDeletionRequests").doc(docId).update({
        status: "error",
        error: error.message,
        processedAt: new Date(),
      });

      // 관리자에게 알림 (선택사항)
      console.error(
        `❌ 회원 탈퇴 처리 실패 - 수동 처리 필요: ${data.userEmail}`
      );
    }
  }
);

// 회원 탈퇴 완료 이메일 전송
async function sendAccountDeletionEmail(toEmail, userName, deletedData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "[튜브링] 회원 탈퇴가 완료되었습니다",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">튜브링</h1>
          <p style="color: white; margin: 10px 0 0 0;">회원 탈퇴 완료</p>
        </div>

        <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            안녕하세요${
              userName ? `, <strong>${userName}</strong>님` : ""
            }.<br/>
            튜브링 서비스 탈퇴가 정상적으로 완료되었습니다.
          </p>

          <div style="margin: 30px 0; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">삭제된 데이터</h3>
            <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>계정 정보 (이메일, 이름)</li>
              <li>분석 기록: <strong>${
                deletedData.analysisCount
              }개</strong></li>
              <li>추천 기록: <strong>${
                deletedData.recommendationCount
              }개</strong></li>
              <li>찜보따리: <strong>${
                deletedData.jjimVideosCount
              }개</strong></li>
            </ul>
          </div>

          <div style="padding: 20px; background-color: #fff3cd; border-left: 5px solid #ffc107; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #856404; line-height: 1.6;">
              <strong>⚠️ 중요:</strong> 모든 데이터가 완전히 삭제되었으며, 복구할 수 없습니다.<br/>
              동일한 이메일로 재가입하시는 경우 신규 회원으로 처리됩니다.
            </p>
          </div>

          <p style="color: #666; line-height: 1.6; margin-top: 25px;">
            그동안 튜브링 서비스를 이용해 주셔서 감사합니다.<br/>
            더 나은 서비스로 다시 찾아뵙겠습니다.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

          <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
            튜브링 (SaferTube)<br/>
            AI 기반 YouTube 콘텐츠 안전 분석 서비스<br/>
            <br/>
            문의사항이 있으시면 언제든 연락 주세요.<br/>
            이메일: ${process.env.EMAIL_USER || "support@tubering.com"}
          </p>
        </div>
      </div>
    `,
  };

  // 로컬 개발 환경에서는 이메일 전송 스킵
  if (process.env.FUNCTIONS_EMULATOR === "true" || !process.env.EMAIL_USER) {
    console.log("[로컬 개발] 탈퇴 완료 이메일 전송 스킵:", toEmail);
    console.log("이메일 내용:", mailOptions.subject);
    return;
  }

  await transporter.sendMail(mailOptions);
  console.log(`탈퇴 완료 이메일 전송: ${toEmail}`);
}

// ========================================
// Callable Functions - 영상 분석
// ========================================

/**
 * 간편 영상 분석 (Callable Function)
 * 프론트엔드에서 직접 호출
 */
exports.analyzeVideoQuick = onCall(
  {
    cors: ["http://localhost:5173", "http://localhost:5174", "https://safer-tube-on.web.app", "https://safer-tube-on.firebaseapp.com"],
    maxInstances: 10,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (request) => {
    try {
      const { videoUrl, videoId, gradeLevel } = request.data;

      if (!videoUrl || !videoId) {
        throw new Error("videoUrl과 videoId는 필수입니다");
      }

      console.log(
        `[간편분석] 시작: ${videoId}, 학년: ${gradeLevel || "기본"}`
      );

      // 1. 자막 추출 시도
      let transcript = [];
      let duration = 600;
      let title = "YouTube 영상";

      try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: "ko",
          country: "KR",
        });
        transcript = transcriptData.map((c) => ({
          text: c.text,
          start: c.offset / 1000,
          duration: c.duration / 1000,
        }));

        // 자막에서 영상 길이 추정
        if (transcript.length > 0) {
          const lastCaption = transcript[transcript.length - 1];
          duration = Math.ceil(lastCaption.start + lastCaption.duration);
        }

        console.log(`[간편분석] 자막 ${transcript.length}개 추출, 예상 길이: ${duration}초`);
      } catch (e) {
        console.warn("[간편분석] 자막 없음 - 기본값 사용");
      }

      // 3. Gemini API로 분석
      const gradeFilters = {
        "elementary-1-2": { name: "초등 1~2학년", criteria: "만 7-8세" },
        "elementary-3-4": { name: "초등 3~4학년", criteria: "만 9-10세" },
        "elementary-5-6": { name: "초등 5~6학년", criteria: "만 11-12세" },
        "middle-school": { name: "중학생", criteria: "만 13-15세" },
        "high-school": { name: "고등학생", criteria: "만 16-18세" },
      };
      const selectedFilter =
        gradeFilters[gradeLevel] || gradeFilters["elementary-5-6"];
      const hasTranscript = transcript.length > 0;

      const durationMin = Math.floor(duration / 60);
      const durationSec = duration % 60;

      // 자막 샘플링
      const sampledTranscript =
        transcript.length > 100
          ? transcript.filter(
              (_, i) => i % Math.ceil(transcript.length / 100) === 0
            )
          : transcript;

      const formatTimestamp = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      };

      const prompt = `# 빠른 안전도 분석
대상: ${selectedFilter.name} (${selectedFilter.criteria})
영상 길이: ${durationMin}분 ${durationSec}초

${
  hasTranscript
    ? `## 자막 데이터
${sampledTranscript.map((t) => `[${formatTimestamp(t.start)}] ${t.text}`).join("\n")}`
    : "## 영상 직접 분석 (자막 없음)"
}

## 분석 요청
1. 안전 점수 (0-100): 해당 학년에 적합한지
2. 유해 구간이 있다면 시간대 표시

## 6대 유해 요소
폭력성, 선정성, 욕설/언어, 공포, 약물(음주/흡연), 모방위험

## JSON 응답
{
  "safetyScore": 85,
  "safetyLevel": "safe/caution/warning/danger",
  "safetyDescription": "한 줄 평가",
  "summary": "영상 내용 2문장 요약",
  "mainConcern": "가장 우려되는 점 (없으면 null)",
  "warnings": [
    {"startTime": "2:30", "endTime": "2:45", "category": "profanity", "severity": "medium", "description": "문제 내용"}
  ]
}

점수 기준: 90-100(safe), 70-89(caution), 40-69(warning), 0-39(danger)
시간 범위: 0:00 ~ ${durationMin}:${durationSec.toString().padStart(2, "0")}
warnings는 문제 없으면 빈 배열 []. 한국어로 응답.`;

      // Gemini API 호출 (재시도 로직 포함)
      let analysisResult;
      let lastError;

      for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
        try {
          const genAI = getGenAI();
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
          });

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          });

          const responseText = result.response.text();
          analysisResult = JSON.parse(responseText);
          break; // 성공하면 반복 종료
        } catch (error) {
          lastError = error;
          console.error(`[간편분석] Gemini API 호출 실패 (시도 ${attempt + 1}/${GEMINI_API_KEYS.length}):`, error.message);

          // 마지막 키가 아니면 다음 키로 전환
          if (attempt < GEMINI_API_KEYS.length - 1) {
            switchToNextGeminiKey();
          }
        }
      }

      // 모든 키로 시도했는데도 실패한 경우
      if (!analysisResult) {
        throw lastError || new Error("Gemini API 호출 실패");
      }

      // 안전도 설명 생성
      const getSafetyDescription = (score) => {
        if (score >= 90) return "교육적으로 적합한 안전한 콘텐츠입니다.";
        if (score >= 70)
          return "일부 주의가 필요할 수 있습니다. 보호자 사전 확인을 권장합니다.";
        if (score >= 40)
          return "부적절한 내용이 포함되어 있습니다. 보호자와 함께 시청하세요.";
        return "해당 학년에 적합하지 않은 콘텐츠입니다.";
      };

      return {
        success: true,
        data: {
          analysisType: "quick",
          safetyScore: analysisResult.safetyScore || 70,
          safetyLevel: analysisResult.safetyLevel || "caution",
          safetyDescription:
            analysisResult.safetyDescription ||
            getSafetyDescription(analysisResult.safetyScore || 70),
          summary: analysisResult.summary || "영상 분석이 완료되었습니다.",
          mainConcern: analysisResult.mainConcern || null,
          warnings: (analysisResult.warnings || []).map((w) => ({
            startTime: w.startTime || w.time || "0:00",
            endTime: w.endTime || w.startTime || w.time || "0:00",
            category: w.category || "unknown",
            severity: w.severity || "medium",
            description: w.description || w.issue || "주의 필요",
          })),
          title: title,
          videoId,
          videoUrl,
          duration,
        },
      };
    } catch (error) {
      console.error("[간편분석] 실패:", error);
      throw new Error(`분석 실패: ${error.message}`);
    }
  }
);

