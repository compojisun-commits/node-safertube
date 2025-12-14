import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { TwitterTweetEmbed } from 'react-twitter-embed';

// ==========================================
// 아이콘 컴포넌트들
// ==========================================
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconYoutube = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const IconFolder = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconWand = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);

const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconGrip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

// 🆕 더보기 아이콘 (Notion/Trello 스타일)
const IconMoreHorizontal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

// 📝 메모 아이콘
const IconNote = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

const IconPalette = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r="0.5"/>
    <circle cx="17.5" cy="10.5" r="0.5"/>
    <circle cx="8.5" cy="7.5" r="0.5"/>
    <circle cx="6.5" cy="12" r="0.5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

// 🆕 와이드 뷰 토글 아이콘
const IconMaximize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 3 21 3 21 9"/>
    <polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

const IconMinimize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 14 10 14 10 20"/>
    <polyline points="20 10 14 10 14 4"/>
    <line x1="14" y1="10" x2="21" y2="3"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

// 🆕 링크 타입별 아이콘들
const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const IconTwitterX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const IconInstagram = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const IconBlog = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="12" y2="14"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// ==========================================
// 🆕 인디스쿨 아이콘
// ==========================================
const IconSchool = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/>
  </svg>
);

// 네이버 N 로고 아이콘
const IconNaver = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
  </svg>
);

// ==========================================
// 🆕 링크 타입 감지 유틸리티 (브랜드별 스타일링 포함)
// ==========================================
const detectLinkType = (url) => {
  if (!url) return { type: 'web', label: 'Web', color: '#6b7280', icon: IconGlobe, bgColor: '#f8fafc', borderColor: '#e2e8f0' };
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { 
        type: 'youtube', 
        label: 'YouTube', 
        color: '#ef4444', 
        icon: IconYoutube,
        bgColor: '#fef2f2',
        borderColor: '#fecaca'
      };
    }
    
    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return { 
        type: 'twitter', 
        label: 'X', 
        color: '#000000', 
        icon: IconTwitterX,
        bgColor: '#f8fafc',
        borderColor: '#e2e8f0'
      };
    }
    
    // Instagram
    if (hostname.includes('instagram.com')) {
      return { 
        type: 'instagram', 
        label: 'Instagram', 
        color: '#c13584', 
        icon: IconInstagram,
        bgColor: '#fdf4ff',
        borderColor: '#f0abfc'
      };
    }
    
    // 네이버 블로그 (Brand: 초록색)
    if (hostname.includes('blog.naver.com')) {
      return { 
        type: 'naver-blog', 
        label: 'N블로그', 
        color: '#03c75a', 
        icon: IconNaver,
        bgColor: '#ecfdf5',
        borderColor: '#10b981'
      };
    }
    
    // 티스토리
    if (hostname.includes('tistory.com')) {
      return { 
        type: 'tistory', 
        label: 'Tistory', 
        color: '#eb5f25', 
        icon: IconBlog,
        bgColor: '#fff7ed',
        borderColor: '#fb923c'
      };
    }
    
    // 인디스쿨 (Brand: 파랑색)
    if (hostname.includes('indischool.com')) {
      return { 
        type: 'indischool', 
        label: '인디스쿨', 
        color: '#3b82f6', 
        icon: IconSchool,
        bgColor: '#eff6ff',
        borderColor: '#3b82f6'
      };
    }
    
    // 아이스크림 (교육 플랫폼)
    if (hostname.includes('i-scream.co.kr')) {
      return { 
        type: 'iscream', 
        label: '아이스크림', 
        color: '#ec4899', 
        icon: IconSchool,
        bgColor: '#fdf2f8',
        borderColor: '#f472b6'
      };
    }
    
    // Default: Web (깔끔한 회색톤)
    return { 
      type: 'web', 
      label: 'Web', 
      color: '#6b7280', 
      icon: IconGlobe,
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0'
    };
  } catch {
    return { type: 'web', label: 'Web', color: '#6b7280', icon: IconGlobe, bgColor: '#f8fafc', borderColor: '#e2e8f0' };
  }
};

// 🆕 트윗 ID 추출
const extractTweetId = (url) => {
  if (!url) return null;
  // twitter.com/user/status/1234567890 또는 x.com/user/status/1234567890
  const tweetRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
  const match = url.match(tweetRegex);
  return match ? match[1] : null;
};

// 🆕 URL에서 비디오 ID 추출 (YouTube)
const extractVideoId = (url) => {
  if (!url) return null;
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};

// 🆕 뷰 토글 아이콘들
const IconGridView = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconListView = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconPlay = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// ==========================================
// 🆕 링크 추가 모달 (Smart Auto-fill)
// ==========================================
const AddLinkModal = ({ isOpen, onClose, onAdd, defaultColumnId }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userModifiedTitle, setUserModifiedTitle] = useState(false);
  const urlInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setUserModifiedTitle(false);
      setIsLoading(false);
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 🆕 스마트 자동 채우기 (개선됨)
  const handleUrlChange = async (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);

    // 사용자가 제목을 직접 수정 중이면 자동 완성하지 않음
    if (userModifiedTitle) return;

    // URL이 유효한지 확인
    let validUrl = inputUrl.trim();
    if (!validUrl) {
      setTitle('');
      return;
    }

    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      return;
    }

    // 로딩 시작
    setIsLoading(true);

    // 가짜 비동기 로직 (실제로는 Open Graph 등을 fetch 해야함)
    setTimeout(() => {
      const linkType = detectLinkType(validUrl);
      const videoId = extractVideoId(validUrl);
      let autoTitle = '';
      
      // 링크 타입에 따른 자동 제목 생성
      if (videoId) {
        // YouTube 영상 - 더 자세한 정보 표시
        autoTitle = 'YouTube 영상';
      } else if (linkType.type === 'twitter') {
        autoTitle = 'X(Twitter) 게시물';
      } else if (linkType.type === 'instagram') {
        autoTitle = 'Instagram 게시물';
      } else if (linkType.type === 'blog') {
        autoTitle = validUrl.includes('naver') ? '네이버 블로그 글' : '블로그 글';
      } else {
        // URL에서 도메인 추출
        try {
          const urlObj = new URL(validUrl);
          autoTitle = `${urlObj.hostname.replace('www.', '')} 페이지`;
        } catch {
          autoTitle = '웹 페이지';
        }
      }

      // 사용자가 수정하지 않았을 때만 자동 완성
      if (!userModifiedTitle) {
        setTitle(autoTitle);
      }
      setIsLoading(false);
    }, 500); // 더 빠르게 응답
  };

  // 제목 직접 입력 시
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setUserModifiedTitle(true);
  };

  // 추가하기 버튼
  const handleSubmit = () => {
    let validUrl = url.trim();
    
    // 1. URL 필수 체크 (제목은 체크 안 함!)
    if (!validUrl) {
      Swal.fire({ title: 'URL을 입력해주세요', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      Swal.fire({ title: '유효하지 않은 URL입니다', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    // 2. 링크 타입 분석 및 Video ID 추출
    const linkType = detectLinkType(validUrl);
    const videoId = extractVideoId(validUrl);

    // 3. 제목 Fallback 로직 (중요!)
    let finalTitle = title.trim();
    if (!finalTitle) {
      // 제목이 비어있으면 링크 타입에 따라 기본값 설정
      if (videoId) {
        finalTitle = 'YouTube 영상';
      } else if (linkType.type === 'twitter') {
        finalTitle = 'X(Twitter) 게시물';
      } else if (linkType.type === 'instagram') {
        finalTitle = 'Instagram 게시물';
      } else if (linkType.type === 'blog') {
        finalTitle = validUrl.includes('naver') ? '네이버 블로그' : '블로그 글';
      } else {
        // 최종 Fallback: URL 자체를 제목으로
        finalTitle = validUrl;
      }
    }

    // 4. 썸네일 URL 생성 (YouTube인 경우)
    const thumbnail = videoId 
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` 
      : null;

    onAdd({
      url: validUrl,
      videoUrl: validUrl,
      title: finalTitle,
      videoId: videoId,
      thumbnail: thumbnail,
      linkType: linkType.type,
      status: defaultColumnId,
      folderId: null,
    });

    onClose();
  };

  if (!isOpen) return null;

  const linkType = detectLinkType(url);
  const LinkIcon = linkType.icon;

  return (
    <div className="add-link-modal-overlay" onClick={onClose}>
      <div className="add-link-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-link-modal-header">
          <h3>🔗 링크 추가</h3>
          <button className="add-link-modal-close" onClick={onClose}>
            <IconX />
          </button>
        </div>

        <div className="add-link-modal-content">
          {/* URL 입력 */}
          <div className="add-link-field">
            <label>URL</label>
            <div className="add-link-url-input-wrapper">
              <input
                ref={urlInputRef}
                type="text"
                placeholder="https://..."
                value={url}
                onChange={handleUrlChange}
                onPaste={handleUrlChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') onClose();
                }}
              />
              {url && (
                <span className="add-link-type-indicator" style={{ color: linkType.color }}>
                  <LinkIcon />
                  <span>{linkType.label}</span>
                </span>
              )}
            </div>
          </div>

          {/* 제목 입력 (항상 표시) */}
          <div className="add-link-field">
            <label>제목</label>
            <div className="add-link-title-input-wrapper">
              <input
                ref={titleInputRef}
                type="text"
                placeholder="URL을 입력하면 자동으로 채워집니다 (직접 수정 가능)"
                value={title}
                onChange={handleTitleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') onClose();
                }}
                disabled={isLoading}
              />
              {isLoading && (
                <span className="add-link-loading">
                  <IconLoader />
                </span>
              )}
            </div>
            <small className="add-link-field-hint">
              {userModifiedTitle ? '✏️ 직접 수정됨' : '✨ 자동 완성 활성화'}
            </small>
          </div>

          {/* 미리보기 */}
          {url && (
            <div className="add-link-preview">
              <span className="add-link-preview-label">미리보기</span>
              <div className="add-link-preview-card">
                <div className="add-link-preview-icon" style={{ color: linkType.color }}>
                  <LinkIcon />
                </div>
                <div className="add-link-preview-info">
                  <span className="add-link-preview-title">{title || url}</span>
                  <span className="add-link-preview-url">{url}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="add-link-modal-footer">
          <button className="add-link-btn cancel" onClick={onClose}>취소</button>
          <button className="add-link-btn submit" onClick={handleSubmit} disabled={!url.trim()}>
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🆕 YouTube 인라인 플레이어 모달
// ==========================================
const YouTubePlayerModal = ({ isOpen, onClose, videoId, title }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoId) return null;

  return (
    <div className="youtube-player-overlay" onClick={onClose}>
      <div className="youtube-player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="youtube-player-header">
          <h4>{title || 'YouTube 영상'}</h4>
          <button className="youtube-player-close" onClick={onClose}>
            <IconX />
          </button>
        </div>
        <div className="youtube-player-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title || 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🆕 스마트 임베드 카드 (Smart Embed Card) - 리치 미디어 버전
// ==========================================
const SmartEmbedCard = ({ video, onOpenVideo, onAnalyze, onPlay }) => {
  const linkType = detectLinkType(video.videoUrl || video.url);
  const LinkIcon = linkType.icon;
  const videoId = video.videoId || extractVideoId(video.videoUrl || video.url);
  const tweetId = extractTweetId(video.videoUrl || video.url);
  const [tweetLoaded, setTweetLoaded] = useState(false);

  // YouTube 카드
  if (linkType.type === 'youtube' && videoId) {
    return (
      <div className="smart-embed-card youtube">
        <div className="smart-embed-thumb" onClick={() => onPlay?.(videoId, video.title)}>
          <img 
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`; }}
            alt={video.title}
          />
          <div className="smart-embed-play-btn">
            <IconPlay />
          </div>
          <span className="smart-embed-badge youtube">
            <IconYoutube /> YouTube
          </span>
        </div>
        <div className="smart-embed-content">
          <h4 onClick={() => onOpenVideo?.(video)}>{video.title || 'YouTube 영상'}</h4>
        </div>
      </div>
    );
  }

  // 🆕 Twitter/X 카드 - 실제 트윗 임베드
  if (linkType.type === 'twitter' && tweetId) {
    return (
      <div className="smart-embed-card twitter-embed">
        <div className="smart-embed-twitter-header">
          <span className="smart-embed-badge twitter">
            <IconTwitterX /> X (Twitter)
          </span>
          <a 
            href={video.videoUrl || video.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="smart-embed-external-link"
          >
            <IconExternalLink />
          </a>
        </div>
        <div className="smart-embed-tweet-container">
          {/* 스켈레톤 로더 */}
          {!tweetLoaded && (
            <div className="smart-embed-tweet-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line medium"></div>
              </div>
            </div>
          )}
          <TwitterTweetEmbed
            tweetId={tweetId}
            options={{ 
              width: '100%',
              cards: 'hidden',
              conversation: 'none',
              theme: 'light'
            }}
            onLoad={() => setTweetLoaded(true)}
          />
        </div>
      </div>
    );
  }

  // Twitter URL이지만 ID 추출 실패 시
  if (linkType.type === 'twitter') {
    return (
      <div className="smart-embed-card twitter">
        <div className="smart-embed-twitter-header">
          <span className="smart-embed-badge twitter">
            <IconTwitterX /> X (Twitter)
          </span>
        </div>
        <div className="smart-embed-twitter-content">
          <p className="smart-embed-twitter-text">{video.title || '트윗 보기'}</p>
          <a 
            href={video.videoUrl || video.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="smart-embed-twitter-link"
          >
            원본 트윗 보기 →
          </a>
        </div>
      </div>
    );
  }

  // 🆕 브랜드별 스타일링 카드 (네이버, 인디스쿨 등)
  return (
    <div 
      className={`smart-embed-card brand-card ${linkType.type}`}
      style={{ 
        backgroundColor: linkType.bgColor,
        borderColor: linkType.borderColor
      }}
    >
      <div className="smart-embed-brand-header">
        <div 
          className="smart-embed-brand-icon"
          style={{ backgroundColor: linkType.color, color: 'white' }}
        >
          <LinkIcon />
        </div>
        <span 
          className="smart-embed-brand-label"
          style={{ color: linkType.color }}
        >
          {linkType.label}
        </span>
        <a 
          href={video.videoUrl || video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="smart-embed-external-link"
          style={{ color: linkType.color }}
        >
          <IconExternalLink />
        </a>
      </div>
      <div className="smart-embed-brand-content">
        <h4 onClick={() => onOpenVideo?.(video)}>{video.title || '페이지 보기'}</h4>
        <span className="smart-embed-brand-url">
          {(() => {
            try {
              return new URL(video.videoUrl || video.url).hostname;
            } catch {
              return video.videoUrl || video.url;
            }
          })()}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 안전 등급 뱃지
// ==========================================
const SafetyBadge = ({ score }) => {
  if (score === undefined || score === null) return null;
  
  let status = 'safe';
  if (score < 40) status = 'danger';
  else if (score < 65) status = 'warning';
  else if (score < 85) status = 'caution';

  const styles = {
    safe: { bg: '#DCFCE7', color: '#166534', label: '안전' },
    caution: { bg: '#FEF3C7', color: '#D97706', label: '주의' },
    warning: { bg: '#FED7AA', color: '#C2410C', label: '경고' },
    danger: { bg: '#FECACA', color: '#DC2626', label: '위험' },
  };

  const s = styles[status];
  return (
    <span 
      className="kanban-safety-badge"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
};

// ==========================================
// 📅 미니 캘린더 팝업 (커스텀 DatePicker)
// ==========================================
const MiniCalendarPopup = ({ selectedDate, onSelect, onClose, position }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const popupRef = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days = [];
  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="cal-day empty" />);
  }
  // 날짜 (한국 시간 기준)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    // 한국 시간 기준으로 날짜 문자열 생성 (UTC 대신 로컬 시간 사용)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    const isToday = date.getTime() === today.getTime();
    
    days.push(
      <button
        key={d}
        className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => {
          onSelect(dateStr);
          onClose();
        }}
      >
        {d}
      </button>
    );
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div 
      ref={popupRef}
      className="mini-calendar-popup"
      style={{ 
        position: 'fixed',
        left: Math.min(position.x, window.innerWidth - 280),
        top: Math.min(position.y, window.innerHeight - 320),
      }}
    >
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{year}년 {monthNames[month]}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      
      <div className="cal-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <span key={d} className="cal-weekday">{d}</span>
        ))}
      </div>
      
      <div className="cal-days">
        {days}
      </div>
      
      <div className="cal-footer">
        <button 
          className="cal-today-btn"
          onClick={() => {
            onSelect(today.toISOString().split('T')[0]);
            onClose();
          }}
        >
          오늘
        </button>
        <button 
          className="cal-clear-btn"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 📝 메모 카드 색상 팔레트 (Apple 감성 파스텔톤)
// ==========================================
const MEMO_COLORS = [
  { id: 'yellow', bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', name: '레몬' },
  { id: 'blue', bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', name: '스카이' },
  { id: 'pink', bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D', name: '로즈' },
  { id: 'green', bg: '#DCFCE7', border: '#86EFAC', text: '#166534', name: '민트' },
  { id: 'purple', bg: '#F3E8FF', border: '#D8B4FE', text: '#6B21A8', name: '라벤더' },
  { id: 'orange', bg: '#FFEDD5', border: '#FDBA74', text: '#9A3412', name: '피치' },
];

// ==========================================
// 📝 메모 카드 컴포넌트 (Sticky Note 스타일 + 날짜 기능)
// ==========================================
const MemoCard = ({ memo, onUpdate, onDelete, isSelected, onSelect, isDragging, onOpenDatePicker }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(memo.content || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef(null);
  const colorPickerRef = useRef(null);

  const colorInfo = MEMO_COLORS.find(c => c.id === memo.color) || MEMO_COLORS[0];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditing]);

  // 외부 클릭 시 색상 선택 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (content.trim()) {
      onUpdate({ ...memo, content: content.trim() });
    }
    setIsEditing(false);
  };

  const handleColorChange = (colorId) => {
    onUpdate({ ...memo, color: colorId });
    setShowColorPicker(false);
  };

  // 📅 날짜 포맷팅
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) return '오늘';
    if (dateOnly.getTime() === tomorrow.getTime()) return '내일';
    
    const diff = Math.floor((dateOnly - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}일 전`;
    if (diff <= 7) return `${diff}일 후`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getDueDateClass = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly < today) return 'overdue';
    if (dateOnly.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const formatCreatedDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div 
      className={`kanban-memo-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${memo.dueDate ? 'has-date' : ''}`}
      style={{ 
        backgroundColor: colorInfo.bg,
        borderColor: colorInfo.border,
      }}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {/* 체크박스 */}
      <label 
        className="kanban-memo-checkbox"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(memo.id);
          }}
        />
        <span className="kanban-checkbox-custom" style={{ borderColor: colorInfo.border }}></span>
      </label>

      {/* 📅 날짜 배지 (항상 표시) */}
      <button
        className={`kanban-memo-date-badge ${getDueDateClass(memo.dueDate)}`}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.target.getBoundingClientRect();
          onOpenDatePicker(memo.id, { x: rect.left, y: rect.bottom + 8 });
        }}
        title="날짜 설정"
      >
        {memo.dueDate ? (
          <>
            <IconCalendar />
            <span>{formatDueDate(memo.dueDate)}</span>
          </>
        ) : (
          <>
            <IconCalendar />
            <span>날짜 추가</span>
          </>
        )}
      </button>

      {/* 메모 내용 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="kanban-memo-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setContent(memo.content || '');
              setIsEditing(false);
            }
            if (e.key === 'Enter' && e.metaKey) {
              handleSave();
            }
          }}
          placeholder="메모를 입력하세요..."
          style={{ color: colorInfo.text }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div 
          className="kanban-memo-content"
          style={{ color: colorInfo.text }}
        >
          {memo.content || <span className="kanban-memo-placeholder">클릭하여 메모 작성...</span>}
        </div>
      )}

      {/* 하단 도구바 (호버 시 표시) */}
      <div className="kanban-memo-toolbar">
        <span className="kanban-memo-created">{formatCreatedDate(memo.createdAt)}</span>
        
        <div className="kanban-memo-actions">
          {/* 색상 변경 */}
          <div className="kanban-color-picker-wrapper" ref={colorPickerRef}>
            <button
              className="kanban-memo-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="색상 변경"
            >
              <IconPalette />
            </button>
            
            {showColorPicker && (
              <div className="kanban-color-picker-dropdown">
                {MEMO_COLORS.map(color => (
                  <button
                    key={color.id}
                    className={`kanban-color-option ${memo.color === color.id ? 'active' : ''}`}
                    style={{ backgroundColor: color.bg, borderColor: color.border }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color.id);
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* 삭제 */}
          <button
            className="kanban-memo-action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(memo.id);
            }}
            title="삭제"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🆕 보드 템플릿 정의
// ==========================================
const BOARD_TEMPLATES = {
  default: {
    id: 'default',
    name: '📋 수업 준비',
    icon: '📋',
    columns: [
      { id: 'inbox', title: '📥 찜한 영상', color: '#FEF2F2' },
      { id: 'reviewing', title: '👀 검토 중', color: '#F5F3FF' },
      { id: 'ready', title: '✅ 수업 준비 완료', color: '#F0FDF4' },
    ]
  },
  weekly: {
    id: 'weekly',
    name: '📅 요일별 계획',
    icon: '📅',
    columns: [
      { id: 'mon', title: '🔴 월요일', color: '#FEF2F2' },
      { id: 'tue', title: '🟠 화요일', color: '#FFF7ED' },
      { id: 'wed', title: '🟡 수요일', color: '#FEFCE8' },
      { id: 'thu', title: '🟢 목요일', color: '#F0FDF4' },
      { id: 'fri', title: '🔵 금요일', color: '#EFF6FF' },
    ]
  },
  progress: {
    id: 'progress',
    name: '📊 진행 상태',
    icon: '📊',
    columns: [
      { id: 'todo', title: '📝 할 일', color: '#F8FAFC' },
      { id: 'inprogress', title: '🚧 진행 중', color: '#FEF3C7' },
      { id: 'review', title: '🔍 검토', color: '#E0E7FF' },
      { id: 'done', title: '✅ 완료', color: '#DCFCE7' },
    ]
  },
};

// 컬럼 색상 팔레트
const COLUMN_COLORS = [
  '#FEF2F2', '#FFF7ED', '#FEFCE8', '#F0FDF4', '#ECFDF5',
  '#F0FDFA', '#F0F9FF', '#EFF6FF', '#EEF2FF', '#F5F3FF',
  '#FAF5FF', '#FDF4FF', '#FDF2F8', '#FFF1F2', '#F8FAFC',
];

// ==========================================
// 🆕 컬럼 편집 모달
// ==========================================
const ColumnEditModal = ({ column, onSave, onDelete, onClose, canDelete }) => {
  const [title, setTitle] = useState(column?.title || '');
  const [selectedColor, setSelectedColor] = useState(column?.color || COLUMN_COLORS[0]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    if (!title.trim()) {
      Swal.fire({ title: '이름을 입력해주세요', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }
    onSave({ ...column, title: title.trim(), color: selectedColor });
  };

  return (
    <div className="kanban-modal-overlay" onClick={onClose}>
      <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kanban-modal-header">
          <h3>{column?.id ? '섹션 수정' : '새 섹션 추가'}</h3>
          <button onClick={onClose} className="kanban-modal-close"><IconX /></button>
        </div>
        
        <div className="kanban-modal-content">
          <div className="kanban-modal-field">
            <label>섹션 이름</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 🔴 월요일"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <small>이모지를 포함하면 더 보기 좋아요! 😊</small>
          </div>

          <div className="kanban-modal-field">
            <label>배경 색상</label>
            <div className="kanban-color-palette">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  className={`kanban-color-btn ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <IconCheck />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="kanban-modal-footer">
          {canDelete && column?.id && (
            <button 
              className="kanban-modal-btn delete"
              onClick={() => {
                Swal.fire({
                  title: '섹션을 삭제할까요?',
                  text: '이 섹션의 영상들은 첫 번째 섹션으로 이동합니다.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#ef4444',
                  cancelButtonColor: '#64748b',
                  confirmButtonText: '삭제',
                  cancelButtonText: '취소',
                }).then((result) => {
                  if (result.isConfirmed) onDelete(column.id);
                });
              }}
            >
              <IconTrash /> 삭제
            </button>
          )}
          <div className="kanban-modal-btn-group">
            <button className="kanban-modal-btn cancel" onClick={onClose}>취소</button>
            <button className="kanban-modal-btn save" onClick={handleSave}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🆕 이모지 선택용 데이터
// ==========================================
const BOARD_EMOJIS = [
  '📋', '📚', '📅', '📊', '🎯', '🚀', '💡', '⭐',
  '🔥', '💪', '🎨', '🎬', '📝', '✨', '🌟', '💎',
  '🏆', '🎓', '📖', '🔍', '💻', '🎵', '🌈', '❤️',
  '🍀', '🌸', '🌻', '🍎', '⚡', '🌙', '☀️', '🎁'
];

// ==========================================
// 🆕 새 보드 만들기 모달 (Notion 스타일)
// ==========================================
const CreateBoardModal = ({ isOpen, onClose, onCreate }) => {
  const [boardName, setBoardName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(() => 
    BOARD_EMOJIS[Math.floor(Math.random() * 8)]
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // 랜덤 이모지 선택
      setSelectedEmoji(BOARD_EMOJIS[Math.floor(Math.random() * 8)]);
      setBoardName('');
    }
  }, [isOpen]);

  // 외부 클릭 시 이모지 피커 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
    if (!boardName.trim()) return;
    onCreate({
      name: `${selectedEmoji} ${boardName.trim()}`,
      icon: selectedEmoji
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-board-overlay" onClick={onClose}>
      <div className="create-board-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="create-board-header">
          <h3>새 보드 만들기</h3>
          <button className="create-board-close" onClick={onClose}>
            <IconX />
          </button>
        </div>

        {/* 인라인 입력 영역 */}
        <div className="create-board-input-row">
          {/* 이모지 트리거 버튼 */}
          <div className="emoji-trigger-wrapper" ref={emojiPickerRef}>
            <button
              className="emoji-trigger-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="아이콘 선택"
            >
              {selectedEmoji}
            </button>

            {/* 이모지 피커 팝오버 */}
            {showEmojiPicker && (
              <div className="emoji-picker-popover">
                <div className="emoji-picker-grid">
                  {BOARD_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 보드 이름 입력 */}
          <input
            ref={inputRef}
            type="text"
            className="create-board-input"
            placeholder="보드 이름을 입력하세요"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && boardName.trim()) handleCreate();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        {/* 미리보기 */}
        {boardName.trim() && (
          <div className="create-board-preview">
            <span className="preview-label">미리보기:</span>
            <span className="preview-name">{selectedEmoji} {boardName}</span>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="create-board-footer">
          <button className="create-board-btn cancel" onClick={onClose}>
            취소
          </button>
          <button 
            className="create-board-btn confirm"
            onClick={handleCreate}
            disabled={!boardName.trim()}
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🆕 보드 선택 드롭다운
// ==========================================
const BoardSelector = ({ boards, currentBoardId, onSelect, onCreateNew, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentBoard = boards.find(b => b.id === currentBoardId);
  
  // 마지막 보드인지 확인 (삭제 불가)
  const isLastBoard = boards.length <= 1;

  return (
    <div className="kanban-board-selector" ref={dropdownRef}>
      <button 
        className="kanban-board-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* 아이콘 중복 제거: name에서 아이콘 분리 */}
        <span className="kanban-board-name">{currentBoard?.name || '📋 보드 선택'}</span>
        <IconChevronDown />
      </button>

      {isOpen && (
        <div className="kanban-board-dropdown">
          <div className="kanban-board-dropdown-header">
            <span>보드 선택</span>
          </div>
          
          <div className="kanban-board-dropdown-list">
            {boards.map((board) => (
              <div
                key={board.id}
                className={`kanban-board-option ${board.id === currentBoardId ? 'active' : ''}`}
              >
                <button
                  className="kanban-board-option-main"
                  onClick={() => {
                    onSelect(board.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="kanban-board-option-name">{board.name}</span>
                  <span className="kanban-board-option-cols">{board.columns.length}개 섹션</span>
                  {board.id === currentBoardId && <IconCheck />}
                </button>
                
                {/* 삭제 버튼 (마지막 보드가 아닐 때만) */}
                {!isLastBoard && (
                  <button
                    className="kanban-board-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(board.id);
                      setIsOpen(false);
                    }}
                    title="보드 삭제"
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="kanban-board-dropdown-footer">
            <button 
              className="kanban-board-create-btn"
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
            >
              <IconPlus />
              새 보드 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🆕 Global Kanban Board (v23.0)
// - 다중 보드 지원
// - 섹션 편집/추가/삭제
// - 요일별 보드 기본 제공
// ==========================================
export default function KanbanBoard({ 
  videos = [], 
  folders = [], 
  onAnalyze, 
  onOpenVideo,
  onStatusChange,
  onAddVideo,
  onAiOrganize,
  onRefresh, // 🆕 데이터 새로고침 콜백
  onWideViewChange, // 🆕 와이드 뷰 변경 콜백
}) {
  // 🆕 onStatusChange를 onUpdateVideoStatus로 alias (호환성 유지)
  const onUpdateVideoStatus = onStatusChange || ((videoId, newStatus) => {
    console.log('Status change:', videoId, newStatus);
  });

  // 🆕 와이드 뷰 상태 (localStorage 저장)
  const [isWideView, setIsWideView] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_wide_view');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // 와이드 뷰 저장 + 부모에게 알림
  useEffect(() => {
    localStorage.setItem('kanban_wide_view', isWideView.toString());
    onWideViewChange?.(isWideView); // 🆕 부모 컴포넌트에 알림
  }, [isWideView, onWideViewChange]);

  // 🆕 다중 보드 상태
  const [boards, setBoards] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_boards_v23');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 기본 템플릿이 없으면 추가
        const hasDefault = parsed.some(b => b.id === 'default');
        const hasWeekly = parsed.some(b => b.id === 'weekly');
        if (!hasDefault) parsed.unshift(BOARD_TEMPLATES.default);
        if (!hasWeekly) parsed.splice(1, 0, BOARD_TEMPLATES.weekly);
        return parsed;
      }
      return [BOARD_TEMPLATES.default, BOARD_TEMPLATES.weekly, BOARD_TEMPLATES.progress];
    } catch {
      return [BOARD_TEMPLATES.default, BOARD_TEMPLATES.weekly, BOARD_TEMPLATES.progress];
    }
  });

  const [currentBoardId, setCurrentBoardId] = useState(() => {
    try {
      return localStorage.getItem('kanban_current_board') || 'default';
    } catch {
      return 'default';
    }
  });

  // 현재 보드
  const currentBoard = useMemo(() => 
    boards.find(b => b.id === currentBoardId) || boards[0],
    [boards, currentBoardId]
  );

  const columns = currentBoard?.columns || [];

  const [draggedVideo, setDraggedVideo] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [addingMemoToColumn, setAddingMemoToColumn] = useState(null); // 📝 메모 추가 모드
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const inputRef = useRef(null);

  // 🆕 링크 추가 모달 상태
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkColumnId, setAddLinkColumnId] = useState(null);

  // 🆕 YouTube 플레이어 모달 상태
  const [youtubePlayer, setYoutubePlayer] = useState({ isOpen: false, videoId: null, title: '' });

  // 🆕 뷰 모드 (gallery / list)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('kanban_view_mode') || 'gallery';
    } catch {
      return 'gallery';
    }
  });

  // 뷰 모드 저장
  useEffect(() => {
    localStorage.setItem('kanban_view_mode', viewMode);
  }, [viewMode]);

  // 📝 메모 카드 상태 (localStorage 저장)
  const [memos, setMemos] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_memos_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 📝 카드 순서 상태 (컬럼별로 카드 ID 배열 저장)
  const [cardOrder, setCardOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_card_order_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 📝 드래그 순서 변경용 상태
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverColumnForReorder, setDragOverColumnForReorder] = useState(null);
  
  // 📝 날짜 선택 팝업 상태
  const [datePickerMemoId, setDatePickerMemoId] = useState(null);
  const [datePickerPosition, setDatePickerPosition] = useState({ x: 0, y: 0 });
  
  // 서랍 상태 - useState로 관리 (CSS가 처리)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const drawerRef = useRef(null);

  // 🆕 서랍 토글 함수
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => {
      const newState = !prev;
      console.log('🚪 서랍 토글:', newState ? '열기' : '닫기');
      
      // 서랍이 열릴 때 데이터 새로고침
      if (newState && onRefresh) {
        onRefresh();
      }
      
      return newState;
    });
  }, [onRefresh]);

  // 🆕 편집 모달 상태
  const [editingColumn, setEditingColumn] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 🆕 인라인 섹션명 편집 상태
  const [inlineEditingColumnId, setInlineEditingColumnId] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const inlineInputRef = useRef(null);
  
  // 🆕 섹션(컬럼) 드래그 상태
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // 저장
  useEffect(() => {
    localStorage.setItem('kanban_boards_v23', JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    localStorage.setItem('kanban_current_board', currentBoardId);
  }, [currentBoardId]);

  // 📝 메모 저장
  useEffect(() => {
    localStorage.setItem('kanban_memos_v1', JSON.stringify(memos));
  }, [memos]);

  // 📝 카드 순서 저장
  useEffect(() => {
    localStorage.setItem('kanban_card_order_v1', JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    if (addingToColumn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingToColumn]);

  // 🆕 보드 전환
  const handleSelectBoard = useCallback((boardId) => {
    setCurrentBoardId(boardId);
  }, []);

  // 🆕 새 보드 만들기 모달 상태
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);

  // 🆕 새 보드 생성 (모달 열기)
  const handleCreateBoard = useCallback(() => {
    setShowCreateBoardModal(true);
  }, []);

  // 🆕 실제 보드 생성
  const handleActualCreateBoard = useCallback((formValues) => {
    const newBoard = {
      id: `board_${Date.now()}`,
      name: formValues.name,
      icon: formValues.icon,
      columns: [
        { id: `col_${Date.now()}_1`, title: '📥 대기', color: '#F8FAFC' },
        { id: `col_${Date.now()}_2`, title: '🚧 진행 중', color: '#FEF3C7' },
        { id: `col_${Date.now()}_3`, title: '✅ 완료', color: '#DCFCE7' },
      ]
    };
    setBoards(prev => [...prev, newBoard]);
    setCurrentBoardId(newBoard.id);
  }, []);

  // 🆕 보드 삭제 (특정 보드 ID로 삭제)
  const handleDeleteBoard = useCallback(async (boardIdToDelete = null) => {
    const targetBoardId = boardIdToDelete || currentBoardId;
    const targetBoard = boards.find(b => b.id === targetBoardId);
    
    if (!targetBoard) return;
    
    if (boards.length <= 1) {
      Swal.fire({ title: '마지막 보드는 삭제할 수 없습니다', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    const result = await Swal.fire({
      title: '🗑️ 보드 삭제',
      html: `<p>"<strong>${targetBoard.name}</strong>" 보드를 삭제하시겠습니까?</p>
             <p style="font-size: 13px; color: #64748b; margin-top: 8px;">
               ⚠️ 보드 내 모든 섹션과 메모가 삭제됩니다.<br/>
               (영상 원본은 찜보따리에 남아있습니다)
             </p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
    });

    if (result.isConfirmed) {
      // 삭제할 보드가 현재 보드면 다른 보드로 전환
      if (targetBoardId === currentBoardId) {
        const newBoardId = boards.find(b => b.id !== targetBoardId)?.id;
        if (newBoardId) setCurrentBoardId(newBoardId);
      }
      
      setBoards(prev => prev.filter(b => b.id !== targetBoardId));
      
      Swal.fire({
        icon: 'success',
        title: '보드가 삭제되었습니다',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }, [boards, currentBoardId]);

  // 🆕 컬럼 업데이트
  const handleUpdateColumn = useCallback((updatedColumn) => {
    setBoards(prev => prev.map(board => {
      if (board.id !== currentBoardId) return board;
      
      const existingIndex = board.columns.findIndex(c => c.id === updatedColumn.id);
      if (existingIndex >= 0) {
        // 기존 컬럼 수정
        const newColumns = [...board.columns];
        newColumns[existingIndex] = updatedColumn;
        return { ...board, columns: newColumns };
      } else {
        // 새 컬럼 추가
        return { ...board, columns: [...board.columns, { ...updatedColumn, id: `col_${Date.now()}` }] };
      }
    }));
    setEditingColumn(null);
  }, [currentBoardId]);

  // 🆕 새 섹션 추가
  const handleAddColumn = useCallback(() => {
    setEditingColumn({ title: '', color: COLUMN_COLORS[columns.length % COLUMN_COLORS.length] });
  }, [columns.length]);

  // 🆕 인라인 섹션명 편집 시작 (더블클릭)
  const handleStartInlineEdit = useCallback((column) => {
    setInlineEditingColumnId(column.id);
    setInlineEditValue(column.title);
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  }, []);

  // 🆕 인라인 섹션명 편집 저장
  const handleSaveInlineEdit = useCallback(() => {
    if (!inlineEditValue.trim()) {
      setInlineEditingColumnId(null);
      return;
    }
    
    setBoards(prev => prev.map(board => {
      if (board.id !== currentBoardId) return board;
      return {
        ...board,
        columns: board.columns.map(col => 
          col.id === inlineEditingColumnId 
            ? { ...col, title: inlineEditValue.trim() }
            : col
        )
      };
    }));
    setInlineEditingColumnId(null);
  }, [inlineEditValue, inlineEditingColumnId, currentBoardId]);

  // 🆕 빠른 섹션 추가 (직접)
  const handleQuickAddColumn = useCallback(() => {
    const newColumn = {
      id: `col_${Date.now()}`,
      title: `📌 새 섹션`,
      color: COLUMN_COLORS[columns.length % COLUMN_COLORS.length]
    };
    
    setBoards(prev => prev.map(board => {
      if (board.id !== currentBoardId) return board;
      return { ...board, columns: [...board.columns, newColumn] };
    }));
    
    // 바로 이름 편집 모드로 진입
    setTimeout(() => handleStartInlineEdit(newColumn), 100);
  }, [columns.length, currentBoardId, handleStartInlineEdit]);

  // 🆕 섹션 드래그 시작 - 단순화
  const handleColumnDragStart = useCallback((e, column) => {
    // 카드 드래그와 구분하기 위해 데이터 타입 설정
    e.dataTransfer.setData('column-id', column.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumn(column);
    setDraggedVideo(null); // 카드 드래그 상태 초기화
    
    // 약간의 딜레이 후 드래그 시작 상태 적용
    setTimeout(() => {
      e.target.closest('.kanban-global-column')?.classList.add('column-dragging');
    }, 0);
  }, []);

  // 🆕 섹션 드래그 오버 - 개선
  const handleColumnDragOver = useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 섹션 드래그 중일 때만 드롭 타겟 표시
    if (draggedColumn && draggedColumn.id !== columnId) {
      setDragOverColumnId(columnId);
    }
  }, [draggedColumn]);

  // 🆕 섹션 드롭 (순서 변경)
  const handleColumnDrop = useCallback((e, targetColumnId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedColumn || draggedColumn.id === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumnId(null);
      return;
    }

    setBoards(prev => prev.map(board => {
      if (board.id !== currentBoardId) return board;
      
      const cols = [...board.columns];
      const draggedIndex = cols.findIndex(c => c.id === draggedColumn.id);
      const targetIndex = cols.findIndex(c => c.id === targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return board;
      
      // 드래그한 컬럼을 제거하고 타겟 위치에 삽입
      const [removed] = cols.splice(draggedIndex, 1);
      cols.splice(targetIndex, 0, removed);
      
      return { ...board, columns: cols };
    }));

    setDraggedColumn(null);
    setDragOverColumnId(null);
  }, [draggedColumn, currentBoardId]);

  // 🆕 섹션 드래그 종료 - 모든 상태 완전 초기화
  const handleColumnDragEnd = useCallback((e) => {
    // 드래그 관련 모든 상태 즉시 초기화
    setDraggedColumn(null);
    setDragOverColumnId(null);
    setDragOverColumn(null);
    
    // 모든 드래그 관련 클래스 강제 제거
    document.querySelectorAll('.column-drop-target, .drop-target, .column-dragging').forEach(el => {
      el.classList.remove('column-drop-target', 'drop-target', 'column-dragging');
    });
  }, []);

  // 🆕 섹션 드래그 Leave (보라색 선 제거)
  const handleColumnDragLeave = useCallback((e) => {
    e.preventDefault();
    // relatedTarget이 현재 요소 밖으로 나갈 때만 상태 초기화
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumnId(null);
    }
  }, []);

  // 🆕 섹션 더보기 메뉴 상태
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);
  const [cardMenuOpen, setCardMenuOpen] = useState(null); // 🆕 카드 더보기 메뉴 상태
  
  // 🆕 다중 선택 상태
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null); // Shift 선택용

  // 🆕 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuOpen && !e.target.closest('.kanban-column-menu-wrapper')) {
        setColumnMenuOpen(null);
      }
      if (cardMenuOpen && !e.target.closest('.kanban-card-menu-wrapper')) {
        setCardMenuOpen(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [columnMenuOpen, cardMenuOpen]);

  // 🆕 카드 선택 토글 (체크박스 클릭)
  const handleCardSelect = useCallback((e, video, allVideos = []) => {
    e.stopPropagation();
    
    const videoId = video.id;
    const newSet = new Set(selectedCardIds);
    
    // Shift 키 + 클릭: 범위 선택
    if (e.shiftKey && lastSelectedId && allVideos.length > 0) {
      const lastIndex = allVideos.findIndex(v => v.id === lastSelectedId);
      const currentIndex = allVideos.findIndex(v => v.id === videoId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
        for (let i = start; i <= end; i++) {
          newSet.add(allVideos[i].id);
        }
        setSelectedCardIds(newSet);
        return;
      }
    }
    
    // 일반 클릭: 토글
    if (newSet.has(videoId)) {
      newSet.delete(videoId);
    } else {
      newSet.add(videoId);
    }
    
    setSelectedCardIds(newSet);
    setLastSelectedId(videoId);
  }, [selectedCardIds, lastSelectedId]);

  // 🆕 전체 선택 해제
  const handleClearSelection = useCallback(() => {
    setSelectedCardIds(new Set());
    setLastSelectedId(null);
  }, []);

  // 🆕 선택된 카드 일괄 제거 (보드에서만 제거, 원본 유지)
  const handleBatchDelete = useCallback(async () => {
    if (selectedCardIds.size === 0) return;
    
    // 선택된 항목 중 영상과 메모 분리
    const selectedVideos = [...selectedCardIds].filter(id => !id.startsWith('memo_'));
    const selectedMemos = [...selectedCardIds].filter(id => id.startsWith('memo_'));
    
    const result = await Swal.fire({
      title: '📤 보드에서 제거',
      html: `
        <p>선택한 <strong>${selectedCardIds.size}개</strong> 항목을 보드에서 제외하시겠습니까?</p>
        <p style="font-size: 13px; color: #64748b; margin-top: 8px;">
          💡 영상은 찜보따리에 그대로 남아있습니다.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '보드에서 제거',
      cancelButtonText: '취소',
      confirmButtonColor: '#8b5cf6',
    });
    
    if (result.isConfirmed) {
      const removedCount = selectedCardIds.size;
      
      // 영상: status를 null로 설정 (보드에서만 제거, 원본 유지)
      for (const videoId of selectedVideos) {
        await onUpdateVideoStatus?.(videoId, null);
      }
      
      // 메모: 메모 상태에서만 제거
      if (selectedMemos.length > 0) {
        setMemos(prev => prev.filter(m => !selectedMemos.includes(m.id)));
      }
      
      handleClearSelection();
      
      Swal.fire({
        icon: 'success',
        title: '보드에서 제거되었습니다',
        html: `<p>${removedCount}개 항목이 보드에서 제외되었습니다.</p>
               <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                 원본 영상은 찜보따리에 남아있습니다.
               </p>`,
        timer: 2500,
        showConfirmButton: false
      });
    }
  }, [selectedCardIds, onUpdateVideoStatus, handleClearSelection]);

  // 🆕 선택된 카드 일괄 이동
  const handleBatchMove = useCallback(async () => {
    if (selectedCardIds.size === 0) return;
    
    const columnOptions = columns.reduce((acc, col) => {
      acc[col.id] = col.title;
      return acc;
    }, {});
    
    const { value: targetColumnId } = await Swal.fire({
      title: '일괄 이동',
      text: `${selectedCardIds.size}개의 영상을 이동할 섹션을 선택하세요`,
      input: 'select',
      inputOptions: columnOptions,
      inputPlaceholder: '섹션 선택',
      showCancelButton: true,
      confirmButtonText: '이동',
      cancelButtonText: '취소',
      confirmButtonColor: '#8b5cf6',
    });
    
    if (targetColumnId) {
      for (const videoId of selectedCardIds) {
        await onUpdateVideoStatus?.(videoId, targetColumnId);
      }
      
      handleClearSelection();
      
      Swal.fire({
        icon: 'success',
        title: '이동 완료',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }, [selectedCardIds, columns, onUpdateVideoStatus, handleClearSelection]);

  // 🆕 카드 보드에서 제거 확인 (원본 데이터 유지)
  const handleConfirmRemoveFromBoard = async (item) => {
    const isMemo = item._type === 'memo';
    const itemName = isMemo ? '이 메모' : (item.title || '이 영상');
    
    const result = await Swal.fire({
      title: '📤 보드에서 제거',
      html: `
        <p>"<strong>${itemName}</strong>"을<br/>보드에서 제외하시겠습니까?</p>
        ${!isMemo ? `<p style="font-size: 13px; color: #64748b; margin-top: 8px;">
          💡 원본은 찜보따리에 그대로 남아있습니다.
        </p>` : ''}
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '보드에서 제거',
      cancelButtonText: '취소',
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      await handleRemoveFromBoard(item);
      setCardMenuOpen(null);
      
      // 성공 피드백
      Swal.fire({
        icon: 'success',
        title: '보드에서 제거되었습니다',
        html: !isMemo ? `<p style="font-size: 13px; color: #64748b;">원본 영상은 찜보따리에 남아있습니다.</p>` : '',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // 영상과 메모를 status별로 그룹화 (순서 적용)
  const videosByStatus = useMemo(() => {
    const groups = {};
    columns.forEach(col => {
      groups[col.id] = [];
    });
    
    // 영상 추가 (status가 null/undefined면 보드에 표시하지 않음)
    videos.forEach(video => {
      // 📌 status가 없거나 null이면 보드에서 제외 (원본은 찜보따리에 유지)
      if (!video.status) return;
      
      const status = video.status;
      const item = { ...video, _type: 'video' };
      if (groups[status]) {
        groups[status].push(item);
      }
    });
    
    // 📝 메모 추가
    memos.forEach(memo => {
      const status = memo.status || columns[0]?.id || 'inbox';
      const item = { ...memo, _type: 'memo' };
      if (groups[status]) {
        groups[status].push(item);
      } else if (groups[columns[0]?.id]) {
        groups[columns[0].id].push(item);
      }
    });
    
    // 📝 저장된 순서에 따라 정렬
    Object.keys(groups).forEach(columnId => {
      const order = cardOrder[columnId];
      if (order && order.length > 0) {
        groups[columnId].sort((a, b) => {
          const indexA = order.indexOf(a.id);
          const indexB = order.indexOf(b.id);
          // 순서에 없는 항목은 뒤로
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
    });
    
    return groups;
  }, [videos, memos, columns, cardOrder]);

  // 🆕 섹션 삭제 (videosByStatus 정의 후에 위치해야 함)
  const handleDeleteColumn = useCallback(async (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;
    
    // 해당 섹션에 영상이 있는지 확인
    const columnVideos = videosByStatus[columnId] || [];
    
    const result = await Swal.fire({
      title: '섹션 삭제',
      html: columnVideos.length > 0 
        ? `<p><strong>"${column.title}"</strong> 섹션을 삭제하시겠습니까?</p><p style="color: #ef4444; font-size: 13px; margin-top: 8px;">⚠️ 이 섹션에 있는 ${columnVideos.length}개의 영상은 첫 번째 섹션으로 이동됩니다.</p>`
        : `<p><strong>"${column.title}"</strong> 섹션을 삭제하시겠습니까?</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      // 영상들을 첫 번째 섹션으로 이동
      if (columnVideos.length > 0 && columns.length > 1) {
        const firstColumnId = columns.find(c => c.id !== columnId)?.id;
        if (firstColumnId) {
          for (const video of columnVideos) {
            await onUpdateVideoStatus?.(video.id, firstColumnId);
          }
        }
      }
      
      // 섹션 삭제
      setBoards(prev => prev.map(board => {
        if (board.id !== currentBoardId) return board;
        return { 
          ...board, 
          columns: board.columns.filter(c => c.id !== columnId) 
        };
      }));

      Swal.fire({
        icon: 'success',
        title: '삭제 완료',
        text: '섹션이 삭제되었습니다.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }, [columns, videosByStatus, currentBoardId, onUpdateVideoStatus]);

  // 🆕 섹션 색상 변경
  const handleChangeColumnColor = useCallback(async (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    const { value: color } = await Swal.fire({
      title: '섹션 색상 변경',
      html: `
        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 16px;">
          ${COLUMN_COLORS.map(c => `
            <button 
              class="swal2-color-btn" 
              data-color="${c}" 
              style="width: 36px; height: 36px; border-radius: 8px; background: ${c}; border: 2px solid ${c === column.color ? '#000' : 'transparent'}; cursor: pointer;"
            ></button>
          `).join('')}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '변경',
      cancelButtonText: '취소',
      confirmButtonColor: '#8b5cf6',
      didOpen: () => {
        document.querySelectorAll('.swal2-color-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.swal2-color-btn').forEach(b => b.style.border = '2px solid transparent');
            btn.style.border = '2px solid #000';
            Swal.getInput()?.setAttribute('value', btn.dataset.color);
          });
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('.swal2-color-btn[style*="border: 2px solid rgb(0, 0, 0)"]');
        return selected?.dataset.color || column.color;
      }
    });

    if (color) {
      setBoards(prev => prev.map(board => {
        if (board.id !== currentBoardId) return board;
        return {
          ...board,
          columns: board.columns.map(c => 
            c.id === columnId ? { ...c, color } : c
          )
        };
      }));
      setColumnMenuOpen(null);
    }
  }, [columns, currentBoardId]);

  // 🆕 섹션 전체 비우기 (보드에서만 제거, 원본 유지)
  const handleClearColumn = useCallback(async (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    const columnItems = videosByStatus[columnId] || [];
    if (columnItems.length === 0) {
      Swal.fire({
        icon: 'info',
        title: '비울 항목이 없습니다',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    // 영상과 메모 분리
    const columnVideos = columnItems.filter(item => item._type !== 'memo');
    const columnMemos = columnItems.filter(item => item._type === 'memo');

    const result = await Swal.fire({
      title: '📤 섹션 비우기',
      html: `
        <p>"<strong>${column.title}</strong>" 섹션의 ${columnItems.length}개 항목을 보드에서 제외하시겠습니까?</p>
        <p style="font-size: 13px; color: #64748b; margin-top: 8px;">
          💡 영상은 찜보따리에 그대로 남아있습니다.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '보드에서 제거',
      cancelButtonText: '취소',
      confirmButtonColor: '#8b5cf6',
    });

    if (result.isConfirmed) {
      const removedCount = columnItems.length;
      
      // 영상: status를 null로 설정 (보드에서만 제거)
      for (const video of columnVideos) {
        await onUpdateVideoStatus?.(video.id, null);
      }
      
      // 메모: 메모 상태에서 제거
      if (columnMemos.length > 0) {
        const memoIds = columnMemos.map(m => m.id);
        setMemos(prev => prev.filter(m => !memoIds.includes(m.id)));
      }
      
      setColumnMenuOpen(null);
      Swal.fire({
        icon: 'success',
        title: '보드에서 제거되었습니다',
        html: `<p>${removedCount}개 항목이 보드에서 제외되었습니다.</p>
               <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                 원본 영상은 찜보따리에 남아있습니다.
               </p>`,
        timer: 2500,
        showConfirmButton: false
      });
    }
  }, [columns, videosByStatus, onUpdateVideoStatus]);

  // 미분류 영상 수
  const unorganizedCount = useMemo(() => {
    return videos.filter(v => !v.folderId).length;
  }, [videos]);

  // 서랍용: 검색 필터링된 영상
  const filteredDrawerVideos = useMemo(() => {
    if (!drawerSearch) return videos;
    const q = drawerSearch.toLowerCase();
    return videos.filter(v => 
      v.title?.toLowerCase().includes(q) ||
      v.memo?.toLowerCase().includes(q) ||
      v.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [videos, drawerSearch]);

  // 서랍용: 폴더별로 그룹화 (🆕 삭제된 폴더 필터링 포함)
  const videosByFolder = useMemo(() => {
    const groups = { '미분류': [] };
    
    // 🆕 유효한 폴더만 필터링 (null, undefined, deleted 제외)
    const validFolders = folders.filter(f => f && f.id && !f.deleted);
    const validFolderIds = new Set(validFolders.map(f => f.id));
    
    filteredDrawerVideos.forEach(video => {
      // 🆕 영상의 폴더가 삭제되었으면 미분류로 처리
      if (video.folderId && !validFolderIds.has(video.folderId)) {
        groups['미분류'].push(video);
        return;
      }
      
      const folder = validFolders.find(f => f.id === video.folderId);
      const folderName = folder?.name || '미분류';
      if (!groups[folderName]) groups[folderName] = [];
      groups[folderName].push(video);
    });
    
    return groups;
  }, [filteredDrawerVideos, folders]);

  // 서랍 폴더 토글
  const toggleDrawerFolder = (folderName) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderName)) newSet.delete(folderName);
    else newSet.add(folderName);
    setExpandedFolders(newSet);
  };

  // 드래그 핸들러들
  const handleDragStart = (e, video, source = 'board', itemIndex = null) => {
    setDraggedVideo({ ...video, _source: source, _originalIndex: itemIndex });
    e.dataTransfer.effectAllowed = 'move';
    // 드래그 이미지 설정
    if (e.target) {
      e.dataTransfer.setDragImage(e.target, 50, 20);
    }
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  // 📝 카드 위에 드래그 오버 (순서 변경용)
  const handleCardDragOver = (e, columnId, itemIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // 드래그 중인 카드와 같은 위치면 무시
    if (draggedVideo?._originalIndex === itemIndex && draggedVideo?.status === columnId) {
      return;
    }
    
    setDragOverColumn(columnId);
    setDragOverIndex(itemIndex);
    setDragOverColumnForReorder(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetColumnId, targetIndex = null) => {
    e.preventDefault();
    const currentDragOverIndex = dragOverIndex;
    const sourceColumnId = draggedVideo?.status;
    
    setDragOverColumn(null);
    setDragOverIndex(null);
    setDragOverColumnForReorder(null);
    
    if (!draggedVideo) return;

    // 📝 같은 컬럼 내 순서 변경 (Reordering)
    if (sourceColumnId === targetColumnId && currentDragOverIndex !== null) {
      const columnItems = videosByStatus[targetColumnId] || [];
      const draggedIndex = columnItems.findIndex(item => item.id === draggedVideo.id);
      
      if (draggedIndex !== -1 && draggedIndex !== currentDragOverIndex) {
        // 순서 배열 업데이트
        const newOrder = columnItems.map(item => item.id);
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(currentDragOverIndex > draggedIndex ? currentDragOverIndex : currentDragOverIndex, 0, removed);
        
        setCardOrder(prev => ({
          ...prev,
          [targetColumnId]: newOrder
        }));
        
        // 메모인 경우 메모 상태도 업데이트
        if (draggedVideo._type === 'memo') {
          setMemos(prev => {
            const updated = [...prev];
            const memoIndex = updated.findIndex(m => m.id === draggedVideo.id);
            if (memoIndex !== -1) {
              updated[memoIndex] = { ...updated[memoIndex], order: currentDragOverIndex };
            }
            return updated;
          });
        }
      }
      setDraggedVideo(null);
      return;
    }

    // 📝 메모 드래그 처리 (다른 컬럼으로 이동)
    if (draggedVideo._type === 'memo') {
      handleMemoStatusChange(draggedVideo.id, targetColumnId);
      setDraggedVideo(null);
      return;
    }
    
    // 서랍에서 드래그
    if (draggedVideo._source === 'drawer') {
      if (draggedVideo.status === targetColumnId) {
        setDraggedVideo(null);
        return;
      }
      
      if (onStatusChange) {
        try {
          await onStatusChange(draggedVideo.id, targetColumnId);
        } catch (error) {
          console.error('상태 변경 실패:', error);
        }
      }
      setDraggedVideo(null);
      return;
    }
    
    // 다른 컬럼으로 이동
    if (draggedVideo.status !== targetColumnId) {
      if (onStatusChange) {
        try {
          await onStatusChange(draggedVideo.id, targetColumnId);
        } catch (error) {
          console.error('상태 변경 실패:', error);
          Swal.fire({
            title: '오류',
            text: '상태 변경에 실패했습니다.',
            icon: 'error',
          });
        }
      }
    }
    
    setDraggedVideo(null);
  };

  // + 버튼 클릭 - 🆕 모달 열기
  const handleAddClick = (columnId) => {
    setAddLinkColumnId(columnId);
    setShowAddLinkModal(true);
  };

  // 🆕 YouTube 플레이어 열기
  const handlePlayYoutube = useCallback((videoId, title) => {
    setYoutubePlayer({ isOpen: true, videoId, title });
  }, []);

  // 🆕 모달에서 링크 추가
  const handleAddLinkFromModal = useCallback(async (linkData) => {
    if (onAddVideo) {
      try {
        await onAddVideo(linkData);
        
        const typeEmoji = {
          youtube: '🎬',
          twitter: '𝕏',
          instagram: '📷',
          blog: '📝',
          web: '🔗'
        };
        
        Swal.fire({
          title: `${typeEmoji[linkData.linkType] || '🔗'} 링크가 추가되었습니다!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('링크 추가 실패:', error);
        Swal.fire({
          title: '오류',
          text: error.message || '링크 추가에 실패했습니다.',
          icon: 'error',
        });
      }
    }
  }, [onAddVideo]);

  const handleCancelAdd = () => {
    setAddingToColumn(null);
    setAddingMemoToColumn(null);
    setNewVideoUrl('');
  };

  // 📝 메모 추가
  const handleAddMemo = useCallback((columnId) => {
    const newMemo = {
      id: `memo_${Date.now()}`,
      type: 'memo',
      content: '',
      color: 'yellow',
      status: columnId,
      createdAt: Date.now(),
      order: memos.filter(m => m.status === columnId).length,
    };
    setMemos(prev => [...prev, newMemo]);
    setAddingMemoToColumn(null);
  }, [memos]);

  // 📝 메모 업데이트
  const handleUpdateMemo = useCallback((updatedMemo) => {
    setMemos(prev => prev.map(m => m.id === updatedMemo.id ? updatedMemo : m));
  }, []);

  // 📝 메모 삭제
  const handleDeleteMemo = useCallback(async (memoId) => {
    const result = await Swal.fire({
      title: '메모를 삭제할까요?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });
    
    if (result.isConfirmed) {
      setMemos(prev => prev.filter(m => m.id !== memoId));
    }
  }, []);

  // 📝 메모 상태(컬럼) 변경
  const handleMemoStatusChange = useCallback((memoId, newStatus) => {
    setMemos(prev => prev.map(m => 
      m.id === memoId ? { ...m, status: newStatus } : m
    ));
  }, []);

  // 🆕 링크 추가 (만능 링크 지원) - 인라인 폼용
  const handleSubmitAdd = async () => {
    if (!newVideoUrl.trim()) {
      handleCancelAdd();
      return;
    }

    // URL 유효성 검사
    let validUrl = newVideoUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      Swal.fire({
        title: '유효하지 않은 URL입니다',
        text: '올바른 링크를 입력해주세요.',
        icon: 'warning',
      });
      return;
    }

    // 링크 타입 감지 및 Video ID 추출
    const linkType = detectLinkType(validUrl);
    const videoId = extractVideoId(validUrl);
    
    // 제목 Fallback 로직
    let autoTitle = '';
    if (videoId) {
      autoTitle = 'YouTube 영상';
    } else if (linkType.type === 'twitter') {
      autoTitle = 'X(Twitter) 게시물';
    } else if (linkType.type === 'instagram') {
      autoTitle = 'Instagram 게시물';
    } else if (linkType.type === 'blog') {
      autoTitle = validUrl.includes('naver') ? '네이버 블로그' : '블로그 글';
    } else {
      autoTitle = validUrl;
    }
    
    // 썸네일 URL 생성
    const thumbnail = videoId 
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` 
      : null;
    
    if (onAddVideo) {
      try {
        await onAddVideo({
          url: validUrl,
          videoUrl: validUrl,
          title: autoTitle, // 🆕 제목 추가
          videoId: videoId,
          thumbnail: thumbnail, // 🆕 썸네일 추가
          linkType: linkType.type,
          status: addingToColumn,
          folderId: null,
        });
        
        const typeEmoji = {
          youtube: '🎬',
          twitter: '𝕏',
          instagram: '📷',
          blog: '📝',
          web: '🔗'
        };
        
        Swal.fire({
          title: `${typeEmoji[linkType.type]} ${linkType.label} 링크가 추가되었습니다!`,
          html: `<small>📁 미분류 상태로 저장됨<br/>🪄 AI 정리로 폴더에 배치하세요</small>`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('링크 추가 실패:', error);
        Swal.fire({
          title: '오류',
          text: error.message || '링크 추가에 실패했습니다.',
          icon: 'error',
        });
      }
    }

    handleCancelAdd();
  };

  // 보드에서만 제거 (원본 데이터 유지)
  const handleRemoveFromBoard = async (item) => {
    // 메모인 경우
    if (item._type === 'memo') {
      setMemos(prev => prev.filter(m => m.id !== item.id));
      return;
    }
    
    // 영상인 경우: status를 null로 설정 (보드에서만 제거)
    if (onStatusChange) {
      await onStatusChange(item.id, null);
    }
  };

  return (
    <div className={`kanban-layout-wrapper ${isWideView ? 'wide' : ''}`}>
      <div className={`kanban-global-container ${isWideView ? 'wide-view' : ''}`}>
        {/* 상단 헤더 */}
        <div className="kanban-global-header">
        <div className="kanban-global-title">
          {/* 🆕 보드 선택기 */}
          <BoardSelector
            boards={boards}
            currentBoardId={currentBoardId}
            onSelect={handleSelectBoard}
            onCreateNew={handleCreateBoard}
            onDelete={handleDeleteBoard}
          />
          <span className="kanban-subtitle">폴더와 관계없이 모든 영상을 한눈에</span>
        </div>
        
        <div className="kanban-header-actions">
          {/* 🆕 와이드 뷰 토글 */}
          <button
            className={`kanban-wide-toggle ${isWideView ? 'active' : ''}`}
            onClick={() => setIsWideView(!isWideView)}
            title={isWideView ? '기본 너비로 전환' : '와이드 뷰로 전환'}
          >
            {isWideView ? <IconMinimize /> : <IconMaximize />}
            <span>{isWideView ? '기본 뷰' : '↔️ 와이드 뷰'}</span>
          </button>

          {/* 미분류 알림 + AI 정리 버튼 */}
          {unorganizedCount > 0 && (
            <button 
              className="kanban-ai-organize-btn"
              onClick={() => onAiOrganize?.()}
            >
              <IconWand />
              <span>🗂️ 미분류 {unorganizedCount}개</span>
              <span className="kanban-ai-hint">AI 정리</span>
            </button>
          )}

          {/* 서랍 토글 버튼 */}
          <button 
            onClick={toggleDrawer}
            className={`kanban-drawer-toggle ${isDrawerOpen ? 'active' : ''}`}
            type="button"
          >
            {isDrawerOpen ? <IconChevronLeft /> : <IconChevronRight />}
            {isDrawerOpen ? '서랍 닫기' : '서랍 열기'}
          </button>
        </div>
      </div>

      {/* Notion 스타일: 편집 모드 툴바 삭제됨 - 더블클릭으로 직접 수정 */}
      {false && (
        <div className="kanban-edit-toolbar">
          <div className="kanban-edit-toolbar-info">
            <IconEdit /> 섹션을 클릭하여 이름과 색상을 변경하세요
          </div>
          <div className="kanban-edit-toolbar-actions">
            <button 
              className="kanban-toolbar-btn add"
              onClick={handleAddColumn}
            >
              <IconPlus /> 섹션 추가
            </button>
            {!['default', 'weekly', 'progress'].includes(currentBoardId) && (
              <button 
                className="kanban-toolbar-btn delete"
                onClick={handleDeleteBoard}
              >
                <IconTrash /> 보드 삭제
              </button>
            )}
          </div>
        </div>
      )}

      <div className="kanban-main-area">
        {/* 자료 서랍 */}
        <aside 
          ref={drawerRef}
          className={`kanban-drawer ${isDrawerOpen ? 'open' : ''}`}
        >
          <div className="kanban-drawer-header">
            <h3><IconLayers /> 찜보따리에서 가져오기</h3>
            <div className="kanban-drawer-search">
              <IconSearch />
              <input 
                type="text"
                placeholder="영상 검색..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="kanban-drawer-content">
            {Object.entries(videosByFolder).map(([folderName, folderVideos]) => {
              if (folderVideos.length === 0) return null;
              const isOpen = expandedFolders.has(folderName);
              
              return (
                <div key={folderName} className="kanban-drawer-folder">
                  <button 
                    className="kanban-drawer-folder-header"
                    onClick={() => toggleDrawerFolder(folderName)}
                  >
                    {isOpen ? <IconChevronDown /> : <IconChevronRight />}
                    <IconFolder />
                    <span className="kanban-drawer-folder-name">{folderName}</span>
                    <span className="kanban-drawer-folder-count">{folderVideos.length}</span>
                  </button>
                  
                  {isOpen && (
                    <div className="kanban-drawer-files">
                      {folderVideos.map(video => (
                        <div 
                          key={video.id}
                          className={`kanban-drawer-file ${video.status ? 'on-board' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, video, 'drawer')}
                        >
                          {(() => {
                            const drawerLinkType = detectLinkType(video.videoUrl || video.url);
                            const DrawerLinkIcon = drawerLinkType.icon;
                            return (
                              <>
                                <div className="kanban-drawer-file-thumb">
                                  {video.videoId ? (
                                    <img 
                                      src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                                      alt=""
                                    />
                                  ) : (
                                    <div style={{ color: drawerLinkType.color }}>
                                      <DrawerLinkIcon />
                                    </div>
                                  )}
                                </div>
                                <div className="kanban-drawer-file-info">
                                  <h4>{video.title || '제목 없음'}</h4>
                                  <div className="kanban-drawer-file-meta">
                                    {/* 링크 타입 미니 뱃지 */}
                                    <span 
                                      className="kanban-link-type-mini"
                                      style={{ color: drawerLinkType.color }}
                                      title={drawerLinkType.label}
                                    >
                                      <DrawerLinkIcon />
                                    </span>
                                    <SafetyBadge score={video.safetyScore} />
                                    {video.status && (
                                      <span className="kanban-drawer-status-badge">
                                        보드에 있음
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="kanban-drawer-file-grip">
                                  <IconGrip />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {Object.values(videosByFolder).flat().length === 0 && (
              <div className="kanban-drawer-empty">
                <p>검색 결과가 없습니다</p>
              </div>
            )}
          </div>
          
          <div className="kanban-drawer-footer">
            <p>💡 영상을 드래그해서 보드에 추가하세요</p>
          </div>
        </aside>

        {/* 칸반 컬럼들 */}
        <div className="kanban-global-columns">
          {columns.map((column, index) => {
            const columnVideos = videosByStatus[column.id] || [];
            const isDropTarget = dragOverColumn === column.id;
            
            const isColumnDragging = draggedColumn?.id === column.id;
            const isColumnDropTarget = dragOverColumnId === column.id;
            
            return (
              <div 
                key={column.id}
                className={`kanban-global-column ${isDropTarget ? 'drop-target' : ''} ${isEditMode ? 'edit-mode' : ''} ${isColumnDragging ? 'column-dragging' : ''} ${isColumnDropTarget ? 'column-drop-target' : ''}`}
                onDragOver={(e) => {
                  handleDragOver(e, column.id);
                  handleColumnDragOver(e, column.id);
                }}
                onDragLeave={(e) => {
                  handleDragLeave(e);
                  handleColumnDragLeave(e);
                }}
                onDrop={(e) => {
                  if (draggedColumn) {
                    handleColumnDrop(e, column.id);
                  } else {
                    handleDrop(e, column.id);
                  }
                }}
              >
                {/* 컬럼 헤더 (드래그 가능) */}
                <div 
                  className={`kanban-column-header-v2 ${isEditMode ? 'editable' : ''}`}
                  style={{ backgroundColor: column.color }}
                  onClick={() => isEditMode && setEditingColumn(column)}
                  draggable={!inlineEditingColumnId}
                  onDragStart={(e) => handleColumnDragStart(e, column)}
                  onDragEnd={handleColumnDragEnd}
                >
                  <div className="kanban-column-title-area">
                    {/* 🆕 인라인 편집 모드 */}
                    {inlineEditingColumnId === column.id ? (
                      <input
                        ref={inlineInputRef}
                        type="text"
                        className="kanban-inline-edit-input"
                        value={inlineEditValue}
                        onChange={(e) => setInlineEditValue(e.target.value)}
                        onBlur={handleSaveInlineEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlineEdit();
                          if (e.key === 'Escape') setInlineEditingColumnId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="kanban-column-title-v2"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartInlineEdit(column);
                        }}
                        title="더블클릭하여 이름 수정"
                      >
                        {column.title}
                      </span>
                    )}
                    <span className="kanban-column-count-v2">
                      {columnVideos.length}
                    </span>
                  </div>
                  
                  {/* 🆕 Notion 스타일: 호버 시에만 보이는 ... 메뉴 */}
                  <div className="kanban-column-menu-wrapper">
                    <button 
                      className="kanban-column-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColumnMenuOpen(columnMenuOpen === column.id ? null : column.id);
                      }}
                      title="더보기"
                    >
                      <IconMoreHorizontal />
                    </button>
                    
                    {columnMenuOpen === column.id && (
                      <div className="kanban-column-dropdown-menu">
                        {/* 색상 변경 */}
                        <button 
                          className="kanban-dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeColumnColor(column.id);
                          }}
                        >
                          <span style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            background: column.color,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}></span>
                          <span>색상 변경</span>
                        </button>
                        
                        {/* 전체 비우기 */}
                        <button 
                          className="kanban-dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearColumn(column.id);
                          }}
                        >
                          <IconX />
                          <span>전체 비우기</span>
                        </button>
                        
                        {/* 구분선 */}
                        <div className="kanban-dropdown-divider"></div>
                        
                        {/* 섹션 삭제 */}
                        {columns.length > 1 && (
                          <button 
                            className="kanban-dropdown-item danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setColumnMenuOpen(null);
                              handleDeleteColumn(column.id);
                            }}
                          >
                            <IconTrash />
                            <span>섹션 삭제</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 📝 하단 액션 바 (전체 선택 + 뷰 토글) */}
                {columnVideos.length > 0 && (
                  <div className="kanban-column-action-bar">
                    {/* 좌측: 전체 선택 */}
                    <div className="kanban-action-bar-left">
                      <label className="kanban-select-all-checkbox">
                        <input
                          type="checkbox"
                          checked={columnVideos.every(item => selectedCardIds.has(item.id))}
                          onChange={(e) => {
                            const newSet = new Set(selectedCardIds);
                            if (e.target.checked) {
                              columnVideos.forEach(item => newSet.add(item.id));
                            } else {
                              columnVideos.forEach(item => newSet.delete(item.id));
                            }
                            setSelectedCardIds(newSet);
                          }}
                        />
                        <span className="kanban-checkbox-custom"></span>
                        <span className="kanban-select-all-label">전체 선택</span>
                      </label>
                      {columnVideos.filter(item => selectedCardIds.has(item.id)).length > 0 && (
                        <span className="kanban-selected-count">
                          {columnVideos.filter(item => selectedCardIds.has(item.id)).length}개
                        </span>
                      )}
                    </div>

                    {/* 우측: 뷰 토글 */}
                    <div className="kanban-action-bar-right">
                      <div className="kanban-view-toggle">
                        <button
                          className={`kanban-view-toggle-btn ${viewMode === 'gallery' ? 'active' : ''}`}
                          onClick={() => setViewMode('gallery')}
                          title="갤러리 뷰"
                        >
                          <IconGridView />
                        </button>
                        <button
                          className={`kanban-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                          title="리스트 뷰"
                        >
                          <IconListView />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 카드 리스트 */}
                <div className={`kanban-column-cards-v2 ${viewMode === 'list' ? 'list-view' : 'gallery-view'}`}>
                  {columnVideos.length === 0 && !addingToColumn && !addingMemoToColumn ? (
                    <div className="kanban-empty-column">
                      <p>여기로 영상을 드래그하거나<br/>아래 버튼으로 추가하세요</p>
                    </div>
                  ) : (
                    columnVideos.map((item, itemIndex) => {
                      const isSelected = selectedCardIds.has(item.id);
                      const showDropIndicator = dragOverColumnForReorder === column.id && 
                                               dragOverIndex === itemIndex && 
                                               draggedVideo?.id !== item.id;
                      
                      // 📝 메모 카드 렌더링
                      if (item._type === 'memo') {
                        return (
                          <div
                            key={item.id}
                            className="kanban-card-wrapper"
                            draggable
                            onDragStart={(e) => {
                              setDraggedVideo({ ...item, _type: 'memo', status: column.id, _originalIndex: itemIndex });
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => handleCardDragOver(e, column.id, itemIndex)}
                            onDragLeave={() => setDragOverIndex(null)}
                          >
                            {/* 드래그 인디케이터 (위) */}
                            {showDropIndicator && (
                              <div className="kanban-drop-indicator" />
                            )}
                            <MemoCard
                              memo={item}
                              onUpdate={handleUpdateMemo}
                              onDelete={handleDeleteMemo}
                              isSelected={isSelected}
                              onSelect={(id) => {
                                const newSet = new Set(selectedCardIds);
                                if (newSet.has(id)) newSet.delete(id);
                                else newSet.add(id);
                                setSelectedCardIds(newSet);
                              }}
                              isDragging={draggedVideo?.id === item.id}
                              onOpenDatePicker={(memoId, pos) => {
                                setDatePickerMemoId(memoId);
                                setDatePickerPosition(pos);
                              }}
                            />
                          </div>
                        );
                      }

                      // 🎬 영상/링크 카드 렌더링
                      const video = item;
                      const isUnorganized = !video.folderId;
                      const folderName = folders.find(f => f.id === video.folderId)?.name;
                      const linkType = detectLinkType(video.videoUrl || video.url);
                      const LinkIcon = linkType.icon;
                      
                      return (
                        <div 
                          key={video.id}
                          className="kanban-card-wrapper"
                          onDragOver={(e) => handleCardDragOver(e, column.id, itemIndex)}
                          onDragLeave={() => setDragOverIndex(null)}
                        >
                          {/* 드래그 인디케이터 (위) */}
                          {showDropIndicator && (
                            <div className="kanban-drop-indicator" />
                          )}
                          <div 
                            className={`kanban-card-v2 ${draggedVideo?.id === video.id ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
                            draggable={!isEditMode && cardMenuOpen !== video.id}
                            onDragStart={(e) => {
                              if (isEditMode || cardMenuOpen) return;
                              handleDragStart(e, video, 'board', itemIndex);
                            }}
                          >
                          {/* 다중 선택 체크박스 */}
                          <label 
                            className="kanban-card-checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleCardSelect(e, video, columnVideos)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="kanban-checkbox-custom"></span>
                          </label>
                          
                          {/* Notion 스타일 더보기 메뉴 */}
                          <div className="kanban-card-menu-wrapper">
                            <button 
                              className="kanban-card-more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardMenuOpen(cardMenuOpen === video.id ? null : video.id);
                              }}
                              title="더보기"
                            >
                              <IconMoreHorizontal />
                            </button>
                            
                            {cardMenuOpen === video.id && (
                              <div className="kanban-card-dropdown-menu">
                                <button 
                                  className="kanban-card-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardMenuOpen(null);
                                    onOpenVideo?.(video);
                                  }}
                                >
                                  <IconExternalLink />
                                  <span>열기</span>
                                </button>
                                <button 
                                  className="kanban-card-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardMenuOpen(null);
                                    onAnalyze?.(video);
                                  }}
                                >
                                  <IconCheck />
                                  <span>상세 분석</span>
                                </button>
                                <div className="kanban-card-dropdown-divider"></div>
                                <button 
                                  className="kanban-card-dropdown-item danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmRemoveFromBoard(video);
                                  }}
                                >
                                  <IconTrash />
                                  <span>보드에서 제거</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* 🆕 Twitter 카드: 실제 트윗 임베드 */}
                          {linkType.type === 'twitter' && extractTweetId(video.videoUrl || video.url) ? (
                            <div className="kanban-twitter-embed-wrapper">
                              <div className="kanban-twitter-embed-header">
                                <span className="kanban-twitter-badge">
                                  <IconTwitterX /> X
                                </span>
                                <a 
                                  href={video.videoUrl || video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="kanban-twitter-external"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconExternalLink />
                                </a>
                              </div>
                              <div className="kanban-tweet-container">
                                <TwitterTweetEmbed
                                  tweetId={extractTweetId(video.videoUrl || video.url)}
                                  options={{ 
                                    width: '100%',
                                    cards: 'hidden',
                                    conversation: 'none'
                                  }}
                                  placeholder={
                                    <div className="kanban-tweet-skeleton">
                                      <div className="skeleton-avatar"></div>
                                      <div className="skeleton-content">
                                        <div className="skeleton-line short"></div>
                                        <div className="skeleton-line"></div>
                                        <div className="skeleton-line medium"></div>
                                      </div>
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            /* 기존 썸네일 (YouTube, 일반 링크) */
                            <div className="kanban-card-thumb-v2">
                              {video.videoId ? (
                                <>
                                  <img 
                                    src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`; }}
                                    alt=""
                                  />
                                  {linkType.type === 'youtube' && (
                                    <button 
                                      className="kanban-card-play-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayYoutube(video.videoId, video.title);
                                      }}
                                      title="영상 재생"
                                    >
                                      <IconPlay />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div 
                                  className="kanban-card-thumb-placeholder"
                                  style={{ 
                                    backgroundColor: linkType.bgColor || `${linkType.color}10`,
                                    borderColor: linkType.borderColor || 'transparent'
                                  }}
                                >
                                  <div 
                                    className="kanban-brand-icon-wrapper"
                                    style={{ backgroundColor: linkType.color }}
                                  >
                                    <LinkIcon />
                                  </div>
                                  <span style={{ color: linkType.color, fontWeight: 600, fontSize: 11 }}>
                                    {linkType.label}
                                  </span>
                                </div>
                              )}
                              
                              <SafetyBadge score={video.safetyScore} />
                            </div>
                          )}
                          
                          {/* 카드 내용 */}
                          <div className="kanban-card-content-v2">
                            <h4 
                              className="kanban-card-title-v2"
                              onClick={() => onOpenVideo?.(video)}
                            >
                              {video.title || '제목 없음'}
                            </h4>
                            
                            <div className="kanban-card-meta-v2">
                              {/* 🆕 링크 타입 아이콘 */}
                              <span 
                                className="kanban-link-type-badge"
                                style={{ 
                                  backgroundColor: `${linkType.color}15`,
                                  color: linkType.color,
                                  borderColor: `${linkType.color}30`
                                }}
                                title={linkType.label}
                              >
                                <LinkIcon />
                              </span>
                              
                              {/* 폴더 정보 */}
                              {isUnorganized ? (
                                <button 
                                  className="kanban-unorganized-badge"
                                  onClick={() => onAiOrganize?.([video])}
                                  title="AI로 자동 분류하기"
                                >
                                  🗂️
                                </button>
                              ) : (
                                <span className="kanban-folder-badge" title={folderName}>
                                  <IconFolder />
                                  <span>{folderName}</span>
                                </span>
                              )}
                              
                              {/* 내보내기 버튼 */}
                              <button 
                                className="kanban-action-btn youtube"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(video.videoUrl, '_blank');
                                }}
                                title="새 탭에서 열기"
                              >
                                <IconExternalLink />
                              </button>
                            </div>
                          </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* 마지막 위치 드롭 인디케이터 */}
                  {dragOverColumnForReorder === column.id && dragOverIndex === columnVideos.length && (
                    <div className="kanban-drop-indicator last" />
                  )}

                  {/* + 버튼 입력 모드 (링크) */}
                  {addingToColumn === column.id && (
                    <div className="kanban-add-card-form">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="URL 붙여넣기 (YouTube, X, Instagram, 블로그 등)"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmitAdd();
                          if (e.key === 'Escape') handleCancelAdd();
                        }}
                      />
                      <div className="kanban-add-card-buttons">
                        <button onClick={handleSubmitAdd} className="btn-add">추가</button>
                        <button onClick={handleCancelAdd} className="btn-cancel">취소</button>
                      </div>
                    </div>
                  )}
                  
                  {/* 📝 하단 버튼 영역 (링크 추가 + 메모 추가) */}
                  {!isEditMode && !addingToColumn && (
                    <div className="kanban-add-buttons-row">
                      <button 
                        className="kanban-add-card-btn video"
                        onClick={() => handleAddClick(column.id)}
                      >
                        <IconLink />
                        <span>🔗 링크 추가</span>
                      </button>
                      <button 
                        className="kanban-add-card-btn memo"
                        onClick={() => handleAddMemo(column.id)}
                      >
                        <IconNote />
                        <span>메모</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 🆕 항상 보이는 섹션 추가 버튼 */}
          <div className="kanban-add-column-area">
            <button 
              className="kanban-add-column-btn-compact"
              onClick={handleQuickAddColumn}
              title="새 섹션 추가"
            >
              <IconPlus />
            </button>
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="kanban-global-footer">
        <p>💡 서랍에서 영상을 드래그하거나, 카드를 이동하여 상태를 변경하세요. 미분류 영상은 <strong>🪄 AI 정리</strong>로 폴더에 배치할 수 있습니다.</p>
      </div>

      {/* 🆕 Floating Action Bar - 다중 선택 시 표시 */}
      {selectedCardIds.size > 0 && (
        <div className="kanban-floating-bar">
          <div className="kanban-floating-bar-content">
            <span className="kanban-floating-count">
              ✓ {selectedCardIds.size}개 선택됨
            </span>
            
            <div className="kanban-floating-actions">
              <button 
                className="kanban-floating-btn move"
                onClick={handleBatchMove}
                title="선택한 영상 이동"
              >
                <IconFolder />
                <span>이동</span>
              </button>
              
              <button 
                className="kanban-floating-btn delete"
                onClick={handleBatchDelete}
                title="선택한 항목 보드에서 제거"
              >
                <IconTrash />
                <span>제거</span>
              </button>
              
              <button 
                className="kanban-floating-btn clear"
                onClick={handleClearSelection}
                title="선택 해제"
              >
                <IconX />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 컬럼 편집 모달 */}
      {editingColumn && (
        <ColumnEditModal
          column={editingColumn}
          onSave={handleUpdateColumn}
          onDelete={handleDeleteColumn}
          onClose={() => setEditingColumn(null)}
          canDelete={columns.length > 1}
        />
      )}

      {/* 📅 미니 캘린더 팝업 */}
      {datePickerMemoId && (
        <MiniCalendarPopup
          selectedDate={memos.find(m => m.id === datePickerMemoId)?.dueDate}
          position={datePickerPosition}
          onSelect={(date) => {
            setMemos(prev => prev.map(m => 
              m.id === datePickerMemoId ? { ...m, dueDate: date } : m
            ));
          }}
          onClose={() => setDatePickerMemoId(null)}
        />
      )}

      {/* 🆕 새 보드 만들기 모달 */}
      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onCreate={handleActualCreateBoard}
      />
      </div>
      {/* === kanban-global-container 끝 === */}

      {/* 🆕 링크 추가 모달 (모달들은 레이아웃 래퍼 밖에 배치) */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        onClose={() => setShowAddLinkModal(false)}
        onAdd={handleAddLinkFromModal}
        defaultColumnId={addLinkColumnId}
      />

      {/* 🆕 YouTube 인라인 플레이어 */}
      <YouTubePlayerModal
        isOpen={youtubePlayer.isOpen}
        onClose={() => setYoutubePlayer({ isOpen: false, videoId: null, title: '' })}
        videoId={youtubePlayer.videoId}
        title={youtubePlayer.title}
      />
    </div>
  );
}
