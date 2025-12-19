// YouTube API 직접 호출 유틸리티
import { getTrustedChannelIds } from "./trustedChannels";

// 여러 개의 API 키를 배열로 관리
const YOUTUBE_API_KEYS = [
  import.meta.env.VITE_YOUTUBE_API_KEY,
  import.meta.env.VITE_YOUTUBE_API_KEY_2,
  import.meta.env.VITE_YOUTUBE_API_KEY_3,
  import.meta.env.VITE_YOUTUBE_API_KEY_4,
  import.meta.env.VITE_YOUTUBE_API_KEY_5,
].filter(Boolean); // undefined 제거

/**
 * 현재 사용 중인 API 키 인덱스 가져오기
 */
function getCurrentKeyIndex() {
  const stored = localStorage.getItem("youtube_api_key_index");
  return stored ? parseInt(stored) : 0;
}

/**
 * 다음 API 키로 전환
 */
function switchToNextKey() {
  const currentIndex = getCurrentKeyIndex();
  const nextIndex = (currentIndex + 1) % YOUTUBE_API_KEYS.length;
  localStorage.setItem("youtube_api_key_index", nextIndex.toString());
  console.log(`🔄 YouTube API 키 전환: ${currentIndex} → ${nextIndex}`);
  return nextIndex;
}

/**
 * 현재 사용할 API 키 가져오기
 */
function getCurrentApiKey() {
  const index = getCurrentKeyIndex();
  return YOUTUBE_API_KEYS[index];
}

/**
 * 단일 키워드로 YouTube 검색 (내부 헬퍼 함수)
 */
async function searchWithSingleKeyword(
  keyword,
  maxResults,
  videoDuration,
  apiKey,
  _retryCount = 0
) {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
    keyword
  )}&maxResults=${maxResults}&videoEmbeddable=true&regionCode=KR&relevanceLanguage=ko${videoDuration}&key=${apiKey}`;

  const response = await fetch(searchUrl);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;

    // 403 에러이고 재시도 가능한 경우 다음 키로 전환
    if (
      response.status === 403 &&
      _retryCount < YOUTUBE_API_KEYS.length - 1
    ) {
      console.warn(`⚠️ API 키 할당량 초과. 다음 키로 전환 시도...`);
      switchToNextKey();
      const newApiKey = getCurrentApiKey();
      return searchWithSingleKeyword(
        keyword,
        maxResults,
        videoDuration,
        newApiKey,
        _retryCount + 1
      );
    }

    throw new Error(`YouTube search failed: ${response.status} - ${errorMsg}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * YouTube 영상 검색 (우선순위 기반, API 키 자동 전환 지원)
 */
export async function searchYouTubeVideos(
  keywords,
  maxResults = 10,
  preferredDuration = null,
  subject = null,
  _retryCount = 0
) {
  try {
    // 단일 키워드인 경우 기존 로직 유지
    if (!Array.isArray(keywords)) {
      keywords = [keywords];
    }

    // 영상 길이 필터
    let videoDuration = "";
    if (preferredDuration) {
      const minutes = parseInt(preferredDuration);
      if (minutes <= 4) {
        videoDuration = "&videoDuration=short"; // 4분 이하
      } else if (minutes <= 20) {
        videoDuration = "&videoDuration=medium"; // 4-20분
      } else {
        videoDuration = "&videoDuration=long"; // 20분 이상
      }
    }

    const apiKey = getCurrentApiKey();

    // 우선순위 기반 검색: 첫 번째 키워드로 7개, 나머지 키워드로 각 1개씩
    let allItems = [];
    const seen = new Set(); // 중복 제거용

    // 1. 첫 번째 키워드로 7개 검색
    const primaryKeyword = keywords[0];
    console.log(`🔍 1순위 검색: "${primaryKeyword}" (목표: 7개)`);
    const primaryItems = await searchWithSingleKeyword(
      primaryKeyword,
      Math.min(15, maxResults), // 여유있게 검색
      videoDuration,
      apiKey
    );

    // 중복 없이 최대 7개 추가
    for (const item of primaryItems) {
      if (!seen.has(item.id.videoId) && allItems.length < 7) {
        allItems.push(item);
        seen.add(item.id.videoId);
      }
    }
    console.log(`  ✅ 1순위 검색 결과: ${allItems.length}개`);

    // 2. 나머지 키워드로 각 1개씩 채우기 (최대 10개까지)
    for (let i = 1; i < keywords.length && allItems.length < maxResults; i++) {
      const keyword = keywords[i];
      console.log(`🔍 ${i + 1}순위 검색: "${keyword}" (목표: 1개)`);

      const items = await searchWithSingleKeyword(
        keyword,
        5, // 1개만 필요하지만 여유있게
        videoDuration,
        apiKey
      );

      // 중복 없이 1개 추가
      for (const item of items) {
        if (!seen.has(item.id.videoId)) {
          allItems.push(item);
          seen.add(item.id.videoId);
          console.log(`  ✅ ${i + 1}순위 검색 결과: 1개 추가 (총 ${allItems.length}개)`);
          break; // 1개만 추가
        }
      }
    }

    console.log(`📊 최종 검색 결과: ${allItems.length}개 영상`);

    if (allItems.length === 0) {
      return [];
    }

    // 영상 상세 정보 가져오기 (길이, 조회수, 좋아요수 포함)
    const videoIds = allItems.map((item) => item.id.videoId).join(",");
    console.log("검색된 영상 ID들:", videoIds);
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${apiKey}`;

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
        console.warn(`⚠️ API 키 할당량 초과 (details). 다음 키로 전환 시도...`);
        switchToNextKey();
        return searchYouTubeVideos(
          keywords,
          maxResults,
          preferredDuration,
          subject,
          _retryCount + 1
        );
      }

      throw new Error(
        `YouTube details failed: ${detailsResponse.status} - ${errorMsg}`
      );
    }
    const detailsData = await detailsResponse.json();
    console.log(detailsData.items);

    // 결과 조합
    let videos = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);

      return {
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        duration: duration,
        durationFormatted: formatDuration(duration),
        thumbnail: item.snippet.thumbnails.medium.url,
        viewCount: parseInt(item.statistics?.viewCount || "0"),
        likeCount: parseInt(item.statistics?.likeCount || "0"),
      };
    });

    // Shorts 제외 (70초 이상만 유지)
    const beforeCount = videos.length;
    videos = videos.filter((v) => v.duration >= 70);
    if (beforeCount > videos.length) {
      console.log(`🚫 Shorts 제외: ${beforeCount}개 → ${videos.length}개`);
    }

    // 신뢰채널 필터링 (과목이 지정된 경우에만)
    // if (subject) {
    //   const trustedChannelIds = getTrustedChannelIds(subject);
    //   if (trustedChannelIds.length > 0) {
    //     const beforeCount = videos.length;
    //     videos = videos.filter((v) => trustedChannelIds.includes(v.channelId));
    //     console.log(
    //       `✅ 신뢰채널 필터 적용 (${subject}): ${beforeCount}개 → ${videos.length}개`
    //     );

    //     // 신뢰채널에서 찾은 만큼만 반환 (일반채널로 채우지 않음)
    //     if (videos.length < maxResults) {
    //       console.log(
    //         `ℹ️ 신뢰채널에서 ${videos.length}개만 발견. 일반채널은 제외합니다.`
    //       );
    //     }
    //   }
    // }

    return videos;
  } catch (error) {
    console.error("YouTube 검색 실패:", error);
    return [];
  }
}

/**
 * YouTube 자막 가져오기 (API 키 자동 전환 지원)
 */
export async function getVideoTranscript(videoId, _retryCount = 0) {
  try {
    // YouTube 자막을 가져오기 위해 티멘스크립트 API 사용
    // CORS 문제로 직접 호출 불가 - 간단한 프록시 또는 대안 필요

    // 임시 해결: 영상 설명으로 대체 (또는 timedtext API 사용)
    const apiKey = getCurrentApiKey();
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    const response = await fetch(detailsUrl);
    if (!response.ok) {
      // 403 에러이고 재시도 가능한 경우 다음 키로 전환
      if (
        response.status === 403 &&
        _retryCount < YOUTUBE_API_KEYS.length - 1
      ) {
        console.warn(
          `⚠️ API 키 할당량 초과 (transcript). 다음 키로 전환 시도...`
        );
        switchToNextKey();
        return getVideoTranscript(videoId, _retryCount + 1);
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const snippet = data.items?.[0]?.snippet;

    if (!snippet) {
      return "자막을 가져올 수 없습니다.";
    }

    // 영상 제목 + 설명을 자막 대용으로 사용
    return `제목: ${snippet.title}\n\n설명: ${
      snippet.description || "설명 없음"
    }`;
  } catch (error) {
    console.error("자막 가져오기 실패:", error);
    return "자막을 가져올 수 없습니다.";
  }
}

/**
 * 신뢰채널에서 최근 5년 이내 영상 검색 (2순위)
 * 영상이 부족하면 년도 상관없이 현재 월 ±2개월 영상도 검색 (3순위)
 */
export async function searchTrustedChannelVideos(
  subject,
  maxResults = 10,
  preferredDuration = null,
  keywords = null, // 안전교육용 키워드
  _retryCount = 0
) {
  try {
    const trustedChannelIds = getTrustedChannelIds(subject);

    if (trustedChannelIds.length === 0) {
      console.log(`⚠️ ${subject}에 대한 신뢰채널이 없습니다.`);
      return [];
    }

    // 영상 길이 필터
    let videoDuration = "";
    if (preferredDuration) {
      const minutes = parseInt(preferredDuration);
      if (minutes <= 4) {
        videoDuration = "&videoDuration=short";
      } else if (minutes <= 20) {
        videoDuration = "&videoDuration=medium";
      } else {
        videoDuration = "&videoDuration=long";
      }
    }

    const apiKey = getCurrentApiKey();
    console.log(`🔑 현재 API 키 인덱스: ${getCurrentKeyIndex()} / 총 ${YOUTUBE_API_KEYS.length}개`);

    // 2순위: 최근 5년 이내 영상 검색
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const publishedAfter = fiveYearsAgo.toISOString();

    // 각 채널에서 2~3개씩 골고루 가져오기 (최대 30개 이내)
    const totalChannels = Math.min(trustedChannelIds.length, 15); // 최대 15개 채널
    const videosPerChannel = Math.min(3, Math.max(2, Math.floor(30 / totalChannels))); // 채널당 2~3개

    console.log(`📺 ${totalChannels}개 신뢰채널에서 각 ${videosPerChannel}개씩 검색`);
    if (keywords) {
      console.log(`🔍 키워드: "${keywords}"`);
    }

    // 403 에러 감지용 플래그
    let hasQuotaError = false;

    // 병렬로 모든 채널 검색
    const searchPromises = trustedChannelIds.slice(0, totalChannels).map(async (channelId) => {
      try {
        // 안전교육일 때는 키워드 + 채널 필터로 검색
        let searchUrl;
        if (keywords) {
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=${videosPerChannel}&order=date&publishedAfter=${publishedAfter}&videoEmbeddable=true&regionCode=KR&q=${encodeURIComponent(keywords)}${videoDuration}&key=${apiKey}`;
        } else {
          searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=${videosPerChannel}&order=date&publishedAfter=${publishedAfter}&videoEmbeddable=true&regionCode=KR${videoDuration}&key=${apiKey}`;
        }

        const response = await fetch(searchUrl);
        if (!response.ok) {
          if (response.status === 403) {
            hasQuotaError = true;
            console.warn(`⚠️ API 할당량 초과 (채널: ${channelId})`);
          } else {
            console.warn(`채널 ${channelId} 검색 실패: ${response.status}`);
          }
          return { error: response.status, items: [] };
        }

        const data = await response.json();
        return { error: null, items: data.items || [] };
      } catch (error) {
        console.warn(`채널 ${channelId} 검색 오류:`, error);
        return { error: 'network', items: [] };
      }
    });

    const channelResults = await Promise.all(searchPromises);

    // 403 에러가 발생했고 재시도 가능하면 다음 키로 전환 후 재시도
    if (hasQuotaError && _retryCount < YOUTUBE_API_KEYS.length - 1) {
      console.warn(`🔄 API 키 전환 후 재시도... (${_retryCount + 1}/${YOUTUBE_API_KEYS.length - 1})`);
      switchToNextKey();
      return searchTrustedChannelVideos(subject, maxResults, preferredDuration, keywords, _retryCount + 1);
    }

    // 각 채널별로 최대 2개씩만 가져와서 골고루 분배
    let allItems = [];
    channelResults.forEach((result, idx) => {
      const channelItems = result.items.slice(0, 2); // 채널당 최대 2개
      if (channelItems.length > 0) {
        console.log(`  - 채널 ${idx + 1}: ${channelItems.length}개`);
      }
      allItems.push(...channelItems);
    });

    console.log(`📺 2순위(최근 5년): ${allItems.length}개 영상 발견 (${channelResults.filter(r => r.items.length > 0).length}개 채널에서)`);

    // 3순위: 2순위 영상이 부족하면 년도 상관없이 현재 월 ±2개월 영상 검색
    if (allItems.length < maxResults) {
      console.log(`⚠️ 최근 영상 부족(${allItems.length}개). 3순위(같은 시즌) 검색 시작...`);

      const currentMonth = new Date().getMonth(); // 0-11
      const currentApiKey = getCurrentApiKey(); // 최신 키 다시 가져오기

      // 403 에러 감지용
      let hasSeasonQuotaError = false;

      // 각 채널에서 골고루 가져와서 월 필터링 (채널당 5개씩)
      const seasonSearchPromises = trustedChannelIds.slice(0, totalChannels).map(async (channelId) => {
        try {
          // 채널당 5개씩 가져와서 월로 필터링
          let searchUrl;
          if (keywords) {
            searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=5&order=viewCount&videoEmbeddable=true&regionCode=KR&q=${encodeURIComponent(keywords)}${videoDuration}&key=${currentApiKey}`;
          } else {
            searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=5&order=viewCount&videoEmbeddable=true&regionCode=KR${videoDuration}&key=${currentApiKey}`;
          }

          const response = await fetch(searchUrl);
          if (!response.ok) {
            if (response.status === 403) {
              hasSeasonQuotaError = true;
            }
            return { error: response.status, items: [] };
          }

          const data = await response.json();
          return { error: null, items: data.items || [] };
        } catch (error) {
          return { error: 'network', items: [] };
        }
      });

      const seasonResults = await Promise.all(seasonSearchPromises);

      // 3순위에서도 403 에러 발생 시 키 전환 후 재시도
      if (hasSeasonQuotaError && _retryCount < YOUTUBE_API_KEYS.length - 1) {
        console.warn(`🔄 3순위 검색 중 API 키 전환 후 재시도...`);
        switchToNextKey();
        return searchTrustedChannelVideos(subject, maxResults, preferredDuration, keywords, _retryCount + 1);
      }

      // 각 채널별로 최대 2개씩만 가져와서 골고루 분배
      let seasonItems = [];
      seasonResults.forEach((result, idx) => {
        const channelItems = result.items.slice(0, 2); // 채널당 최대 2개
        seasonItems.push(...channelItems);
      });

      // 현재 월 ±2개월에 해당하는 영상만 필터링
      const filteredSeasonItems = seasonItems.filter((item) => {
        const publishedDate = new Date(item.snippet.publishedAt);
        const publishedMonth = publishedDate.getMonth();

        // 월 차이 계산 (12월-1월 경계 고려)
        let monthDiff = Math.abs(currentMonth - publishedMonth);
        if (monthDiff > 6) monthDiff = 12 - monthDiff; // 12월↔1월 등 경계 처리

        return monthDiff <= 2;
      });

      // 2순위에서 이미 가져온 영상 ID 제외
      const existingIds = new Set(allItems.map((item) => item.id.videoId));
      const newSeasonItems = filteredSeasonItems.filter(
        (item) => !existingIds.has(item.id.videoId)
      );

      console.log(`📺 3순위(같은 시즌): ${newSeasonItems.length}개 추가 영상 발견`);
      allItems = [...allItems, ...newSeasonItems];
    }

    if (allItems.length === 0) {
      console.log("신뢰채널에서 영상을 찾지 못했습니다.");
      return [];
    }

    // 영상 상세 정보 가져오기
    const videoIds = allItems.slice(0, 50).map((item) => item.id.videoId).join(",");
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${apiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      if (detailsResponse.status === 403 && _retryCount < YOUTUBE_API_KEYS.length - 1) {
        console.warn(`⚠️ API 키 할당량 초과. 다음 키로 전환 시도...`);
        switchToNextKey();
        return searchTrustedChannelVideos(subject, maxResults, preferredDuration, keywords, _retryCount + 1);
      }
      throw new Error(`YouTube details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    // 결과 조합
    let videos = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);
      return {
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        duration: duration,
        durationFormatted: formatDuration(duration),
        thumbnail: item.snippet.thumbnails.medium.url,
        viewCount: parseInt(item.statistics?.viewCount || "0"),
        likeCount: parseInt(item.statistics?.likeCount || "0"),
        publishedAt: item.snippet.publishedAt,
      };
    });

    // 키워드가 있는 경우: 제목과 키워드 관련성 필터링 (간단한 포함 검사)
    if (keywords && keywords.trim() !== "") {
      const beforeCount = videos.length;
      const keywordLower = keywords.toLowerCase().trim();
      const keywordParts = keywordLower.split(/\s+/); // 띄어쓰기로 분리

      videos = videos.filter((video) => {
        const titleLower = video.title.toLowerCase();
        // 키워드의 주요 단어 중 하나라도 제목에 포함되어 있는지 확인
        const hasMatch = keywordParts.some(part => {
          // "초등", "중등", "고등", "학교" 같은 일반적인 단어는 제외
          if (["초등", "중등", "고등", "학교", "수업", "활동"].includes(part)) {
            return false;
          }
          return titleLower.includes(part);
        });
        return hasMatch;
      });

      console.log(`🔍 키워드 필터링: ${beforeCount}개 → ${videos.length}개`);
    }

    // 조회수 순으로 정렬 후 maxResults만큼 반환
    videos.sort((a, b) => b.viewCount - a.viewCount);

    console.log(`✅ 신뢰채널에서 총 ${videos.length}개 영상 발견 (${subject})`);
    return videos.slice(0, maxResults);
  } catch (error) {
    console.error("신뢰채널 검색 실패:", error);
    return [];
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
 * 초를 MM:SS 또는 HH:MM:SS 형식으로 변환
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
