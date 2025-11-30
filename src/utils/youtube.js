// YouTube API 직접 호출 유틸리티

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

/**
 * YouTube 영상 검색
 */
export async function searchYouTubeVideos(keywords, maxResults = 10, preferredDuration = null) {
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

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      searchQuery
    )}&maxResults=${maxResults}&videoEmbeddable=true&regionCode=KR&relevanceLanguage=ko${videoDuration}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`YouTube search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 영상 상세 정보 가져오기 (길이 포함)
    const videoIds = data.items.map((item) => item.id.videoId).join(",");
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    // 결과 조합
    const videos = detailsData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);

      return {
        videoId: item.id,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        duration: duration,
        durationFormatted: formatDuration(duration),
        thumbnail: item.snippet.thumbnails.medium.url,
      };
    });

    return videos;
  } catch (error) {
    console.error("YouTube 검색 실패:", error);
    return [];
  }
}

/**
 * YouTube 자막 가져오기 (youtube-transcript 라이브러리 없이)
 */
export async function getVideoTranscript(videoId) {
  try {
    // YouTube 자막을 가져오기 위해 티멘스크립트 API 사용
    // CORS 문제로 직접 호출 불가 - 간단한 프록시 또는 대안 필요

    // 임시 해결: 영상 설명으로 대체 (또는 timedtext API 사용)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const snippet = data.items?.[0]?.snippet;

    if (!snippet) {
      return "자막을 가져올 수 없습니다.";
    }

    // 영상 제목 + 설명을 자막 대용으로 사용
    return `제목: ${snippet.title}\n\n설명: ${snippet.description || "설명 없음"}`;
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
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
