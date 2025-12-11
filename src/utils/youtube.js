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
 * YouTube 영상 검색 (API 키 자동 전환 지원, 신뢰채널 필터)
 */
export async function searchYouTubeVideos(
  keywords,
  maxResults = 10,
  preferredDuration = null,
  subject = null,
  _retryCount = 0
) {
  try {
    const searchQuery = Array.isArray(keywords) ? keywords.join(" ") : keywords;

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
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      searchQuery
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
        return searchYouTubeVideos(
          keywords,
          maxResults,
          preferredDuration,
          _retryCount + 1
        );
      }

      const errorDetail =
        response.status === 403
          ? "모든 API 키 할당량이 초과되었습니다. 내일 다시 시도해주세요."
          : "";
      throw new Error(
        `YouTube search failed: ${response.status} - ${errorMsg}${
          errorDetail ? " / " + errorDetail : ""
        }`
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 영상 상세 정보 가져오기 (길이, 조회수, 좋아요수 포함)
    const videoIds = data.items.map((item) => item.id.videoId).join(",");
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
