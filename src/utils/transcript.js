import { YoutubeTranscript } from 'youtube-transcript';

/**
 * YouTube URL에서 영상 ID 추출
 */
export function extractVideoId(videoUrl) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = videoUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * YouTube 자막(Transcript) 추출
 * 반환 형태: [{ text, start, duration }]
 */
export async function fetchTranscript(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다');

  // YoutubeTranscript API는 초 단위 start, duration을 제공
  const captions = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: 'ko',
    country: 'KR',
  });

  // 통일된 키 이름으로 변환
  return captions.map((c) => ({
    text: c.text,
    start: c.offset / 1000, // ms -> s
    duration: c.duration / 1000, // ms -> s
  }));
}



