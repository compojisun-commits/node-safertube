// YouTube 검색 결과 캐싱 시스템
import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore";

const CACHE_COLLECTION = "youtube_search_cache";
const CACHE_DURATION_HOURS = 24 * 7; // 7일 (168시간) 캐싱

/**
 * 캐시 키 생성 (검색 조건을 해시화)
 * @param {Object} params - 검색 파라미터
 * @returns {string} - 캐시 키
 */
function generateCacheKey(params) {
  const { subject, gradeLevel, keywords, preferredDuration } = params;

  // 정규화: 공백 제거, 소문자 변환
  const normalized = {
    subject: (subject || "").trim().toLowerCase(),
    gradeLevel: (gradeLevel || "").trim().toLowerCase(),
    keywords: (keywords || "").trim().toLowerCase(),
    duration: preferredDuration || "any"
  };

  // JSON 문자열로 변환 후 간단한 해시
  const str = JSON.stringify(normalized);
  return btoa(encodeURIComponent(str)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 50);
}

/**
 * 캐시에서 검색 결과 가져오기
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Array|null>} - 캐시된 결과 또는 null
 */
export async function getCachedSearchResults(params) {
  try {
    const cacheKey = generateCacheKey(params);
    const cacheDocRef = doc(db, CACHE_COLLECTION, cacheKey);
    const cacheDoc = await getDoc(cacheDocRef);

    if (!cacheDoc.exists()) {
      console.log("🔍 캐시 미스: 새로운 검색 실행");
      return null;
    }

    const data = cacheDoc.data();
    const cachedAt = data.cachedAt.toDate();
    const now = new Date();
    const hoursPassed = (now - cachedAt) / (1000 * 60 * 60);

    // 캐시 만료 확인
    if (hoursPassed > CACHE_DURATION_HOURS) {
      console.log(`⏰ 캐시 만료: ${hoursPassed.toFixed(1)}시간 경과`);
      return null;
    }

    console.log(`✅ 캐시 히트: ${data.results.length}개 영상 (${hoursPassed.toFixed(1)}시간 전 캐싱)`);
    return data.results;

  } catch (error) {
    console.error("캐시 조회 실패:", error);
    return null; // 캐시 실패 시 일반 검색 진행
  }
}

/**
 * 검색 결과를 캐시에 저장
 * @param {Object} params - 검색 파라미터
 * @param {Array} results - 검색 결과
 */
export async function setCachedSearchResults(params, results) {
  try {
    const cacheKey = generateCacheKey(params);
    const cacheDocRef = doc(db, CACHE_COLLECTION, cacheKey);

    await setDoc(cacheDocRef, {
      params: {
        subject: params.subject,
        gradeLevel: params.gradeLevel,
        keywords: params.keywords,
        preferredDuration: params.preferredDuration
      },
      results: results,
      cachedAt: Timestamp.now(),
      resultCount: results.length
    });

    console.log(`💾 캐시 저장: ${results.length}개 영상 (키: ${cacheKey})`);

  } catch (error) {
    console.error("캐시 저장 실패:", error);
    // 캐시 저장 실패는 치명적이지 않으므로 무시
  }
}

/**
 * 오래된 캐시 정리 (선택사항 - 주기적으로 실행)
 */
export async function cleanupOldCache() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CACHE_DURATION_HOURS);

    const q = query(
      collection(db, CACHE_COLLECTION),
      where("cachedAt", "<", Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(q);
    console.log(`🧹 오래된 캐시 ${snapshot.size}개 발견`);

    // 실제 삭제는 Cloud Functions에서 하는 것이 좋음
    // 여기서는 로그만 출력

  } catch (error) {
    console.error("캐시 정리 실패:", error);
  }
}
