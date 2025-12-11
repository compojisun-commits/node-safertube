import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';

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
// 기본 컬럼 정의 (status 기반)
// ==========================================
const DEFAULT_COLUMNS = [
  { id: 'inbox', title: '📥 찜한 영상', color: '#FEF2F2' },
  { id: 'reviewing', title: '👀 검토 중', color: '#F5F3FF' },
  { id: 'ready', title: '✅ 수업 준비 완료', color: '#F0FDF4' },
];

// ==========================================
// 🆕 Global Kanban Board (v22.0)
// - 폴더 무시, 전체 영상을 status로 분류
// - 드래그로 status 변경
// - 미분류 뱃지 + AI 정리 유도
// ==========================================
export default function KanbanBoard({ 
  videos = [], 
  folders = [], 
  onAnalyze, 
  onOpenVideo,
  onStatusChange,  // 상태 변경 콜백
  onAddVideo,      // 영상 추가 콜백
  onAiOrganize,    // AI 정리 콜백
}) {
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });
  
  const [draggedVideo, setDraggedVideo] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const inputRef = useRef(null);
  
  // 🆕 서랍 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // localStorage에 컬럼 저장
  useEffect(() => {
    localStorage.setItem('kanban_columns_v2', JSON.stringify(columns));
  }, [columns]);

  // 입력창 포커스
  useEffect(() => {
    if (addingToColumn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingToColumn]);

  // 🆕 영상을 status별로 그룹화 (폴더 무시!)
  const videosByStatus = useMemo(() => {
    const groups = {};
    columns.forEach(col => {
      groups[col.id] = [];
    });
    
    videos.forEach(video => {
      // status가 없으면 기본값 'inbox'
      const status = video.status || 'inbox';
      if (groups[status]) {
        groups[status].push(video);
      } else {
        // 알 수 없는 status면 inbox로
        groups['inbox'].push(video);
      }
    });
    
    return groups;
  }, [videos, columns]);

  // 미분류 영상 수 (folderId가 없는 영상)
  const unorganizedCount = useMemo(() => {
    return videos.filter(v => !v.folderId).length;
  }, [videos]);

  // 🆕 서랍용: 검색 필터링된 영상
  const filteredDrawerVideos = useMemo(() => {
    if (!drawerSearch) return videos;
    const q = drawerSearch.toLowerCase();
    return videos.filter(v => 
      v.title?.toLowerCase().includes(q) ||
      v.memo?.toLowerCase().includes(q) ||
      v.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [videos, drawerSearch]);

  // 🆕 서랍용: 폴더별로 그룹화
  const videosByFolder = useMemo(() => {
    const groups = { '미분류': [] };
    
    filteredDrawerVideos.forEach(video => {
      // 이미 보드에 있는 영상은 서랍에서 제외 (옵션)
      // const hasStatus = video.status && video.status !== 'none';
      // if (hasStatus) return;
      
      const folder = folders.find(f => f.id === video.folderId);
      const folderName = folder?.name || '미분류';
      if (!groups[folderName]) groups[folderName] = [];
      groups[folderName].push(video);
    });
    
    return groups;
  }, [filteredDrawerVideos, folders]);

  // 🆕 서랍 폴더 토글
  const toggleDrawerFolder = (folderName) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderName)) newSet.delete(folderName);
    else newSet.add(folderName);
    setExpandedFolders(newSet);
  };

  // 드래그 시작 (보드 카드 또는 서랍에서)
  const handleDragStart = (e, video, source = 'board') => {
    setDraggedVideo({ ...video, _source: source });
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  // 드래그 떠남
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // 드롭 - status 변경 (보드 내 이동 또는 서랍에서 추가)
  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedVideo) return;
    
    // 🆕 서랍에서 드래그한 경우 - 새로 보드에 추가
    if (draggedVideo._source === 'drawer') {
      // 이미 같은 status라면 스킵
      if (draggedVideo.status === targetColumnId) {
        setDraggedVideo(null);
        return;
      }
      
      // status 변경
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
    
    // 보드 내 이동
    if (draggedVideo.status === targetColumnId) {
      setDraggedVideo(null);
      return;
    }

    // 상태 변경 콜백 호출
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
    
    setDraggedVideo(null);
  };

  // 🆕 + 버튼 클릭 - URL 입력 모드
  const handleAddClick = (columnId) => {
    setAddingToColumn(columnId);
    setNewVideoUrl('');
  };

  // URL 입력 취소
  const handleCancelAdd = () => {
    setAddingToColumn(null);
    setNewVideoUrl('');
  };

  // 🆕 영상 추가 (Root에 저장 + status 설정)
  const handleSubmitAdd = async () => {
    if (!newVideoUrl.trim()) {
      handleCancelAdd();
      return;
    }

    // YouTube URL 검증
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = newVideoUrl.match(youtubeRegex);
    
    if (!match) {
      Swal.fire({
        title: 'YouTube URL이 아닙니다',
        text: '유효한 YouTube 링크를 입력해주세요.',
        icon: 'warning',
      });
      return;
    }

    const videoId = match[1];
    
    // 영상 추가 콜백 호출
    if (onAddVideo) {
      try {
        await onAddVideo({
          url: newVideoUrl,
          videoId,
          status: addingToColumn,
          folderId: null, // Root에 저장
        });
        
        Swal.fire({
          title: '영상이 추가되었습니다!',
          html: `<small>📁 미분류 상태로 저장됨<br/>🪄 AI 정리로 폴더에 배치하세요</small>`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('영상 추가 실패:', error);
        Swal.fire({
          title: '오류',
          text: error.message || '영상 추가에 실패했습니다.',
          icon: 'error',
        });
      }
    }

    handleCancelAdd();
  };

  // 카드에서 삭제 (칸반에서만 제거, 실제 삭제 아님)
  const handleRemoveFromBoard = async (video) => {
    // status를 null로 설정하면 칸반에서 안 보임
    if (onStatusChange) {
      await onStatusChange(video.id, null);
    }
  };

  // 컬럼 색상 가져오기
  const getColumnColor = (columnId) => {
    const col = columns.find(c => c.id === columnId);
    return col?.color || '#F8FAFC';
  };

  // 컬럼 제목 색상
  const getColumnTextColor = (columnId) => {
    if (columnId === 'inbox') return '#DC2626';
    if (columnId === 'reviewing') return '#7C3AED';
    if (columnId === 'ready') return '#16A34A';
    return '#64748B';
  };

  return (
    <div className="kanban-global-container">
      {/* 상단 헤더 */}
      <div className="kanban-global-header">
        <div className="kanban-global-title">
          <span className="kanban-icon">📋</span>
          <h2>수업 준비 보드</h2>
          <span className="kanban-subtitle">폴더와 관계없이 모든 영상을 한눈에</span>
        </div>
        
        <div className="kanban-header-actions">
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
          
          {/* 🆕 서랍 토글 버튼 */}
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`kanban-drawer-toggle ${isDrawerOpen ? 'active' : ''}`}
          >
            {isDrawerOpen ? <IconChevronLeft /> : <IconChevronRight />}
            {isDrawerOpen ? '서랍 닫기' : '서랍 열기'}
          </button>
        </div>
      </div>

      <div className="kanban-main-area">
        {/* 🆕 자료 서랍 (찜보따리에서 가져오기) */}
        <aside className={`kanban-drawer ${isDrawerOpen ? 'open' : ''}`}>
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
                          <div className="kanban-drawer-file-thumb">
                            {video.videoId ? (
                              <img 
                                src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                                alt=""
                              />
                            ) : (
                              <IconYoutube />
                            )}
                          </div>
                          <div className="kanban-drawer-file-info">
                            <h4>{video.title || '제목 없음'}</h4>
                            <div className="kanban-drawer-file-meta">
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
        {columns.map(column => {
          const columnVideos = videosByStatus[column.id] || [];
          const isDropTarget = dragOverColumn === column.id;
          
          return (
            <div 
              key={column.id}
              className={`kanban-global-column ${isDropTarget ? 'drop-target' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* 컬럼 헤더 */}
              <div 
                className="kanban-column-header-v2"
                style={{ backgroundColor: getColumnColor(column.id) }}
              >
                <span 
                  className="kanban-column-title-v2"
                  style={{ color: getColumnTextColor(column.id) }}
                >
                  {column.title}
                </span>
                <span className="kanban-column-count-v2">
                  {columnVideos.length}
                </span>
              </div>

              {/* 카드 리스트 */}
              <div className="kanban-column-cards-v2">
                {columnVideos.length === 0 && !addingToColumn ? (
                  <div className="kanban-empty-column">
                    <p>여기로 영상을 드래그하거나<br/>+ 버튼으로 추가하세요</p>
                  </div>
                ) : (
                  columnVideos.map(video => {
                    const isUnorganized = !video.folderId;
                    const folderName = folders.find(f => f.id === video.folderId)?.name;
                    
                    return (
                      <div 
                        key={video.id}
                        className={`kanban-card-v2 ${draggedVideo?.id === video.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, video, 'board')}
                      >
                        {/* 썸네일 */}
                        <div className="kanban-card-thumb-v2">
                          {video.videoId ? (
                            <img 
                              src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                              alt=""
                              onClick={() => onOpenVideo?.(video)}
                            />
                          ) : (
                            <div className="kanban-card-thumb-placeholder">
                              <IconYoutube />
                            </div>
                          )}
                          
                          {/* 안전 배지 */}
                          <SafetyBadge score={video.safetyScore} />
                          
                          {/* 삭제 버튼 */}
                          <button 
                            className="kanban-card-remove-v2"
                            onClick={() => handleRemoveFromBoard(video)}
                            title="보드에서 제거"
                          >
                            <IconX />
                          </button>
                        </div>
                        
                        {/* 카드 내용 */}
                        <div className="kanban-card-content-v2">
                          <h4 
                            className="kanban-card-title-v2"
                            onClick={() => onOpenVideo?.(video)}
                          >
                            {video.title || '제목 없음'}
                          </h4>
                          
                          {/* 폴더 정보 또는 미분류 뱃지 */}
                          <div className="kanban-card-meta-v2">
                            {isUnorganized ? (
                              <button 
                                className="kanban-unorganized-badge"
                                onClick={() => onAiOrganize?.([video])}
                                title="AI로 자동 분류하기"
                              >
                                🗂️ 미분류
                                <IconWand />
                              </button>
                            ) : (
                              <span className="kanban-folder-badge">
                                <IconFolder />
                                {folderName}
                              </span>
                            )}
                          </div>
                          
                          {/* 액션 버튼 */}
                          <div className="kanban-card-actions-v2">
                            <button 
                              className="kanban-action-btn analyze"
                              onClick={() => onAnalyze?.(video)}
                            >
                              상세분석
                            </button>
                            <button 
                              className="kanban-action-btn youtube"
                              onClick={() => window.open(video.videoUrl, '_blank')}
                            >
                              <IconExternalLink />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* 🆕 + 버튼 입력 모드 */}
                {addingToColumn === column.id ? (
                  <div className="kanban-add-card-form">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="YouTube URL 붙여넣기..."
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
                ) : (
                  <button 
                    className="kanban-add-card-btn"
                    onClick={() => handleAddClick(column.id)}
                  >
                    <IconPlus />
                    <span>영상 추가</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

        </div>
      </div>

      {/* 하단 안내 */}
      <div className="kanban-global-footer">
        <p>💡 서랍에서 영상을 드래그하거나, 카드를 이동하여 상태를 변경하세요. 미분류 영상은 <strong>🪄 AI 정리</strong>로 폴더에 배치할 수 있습니다.</p>
      </div>
    </div>
  );
}
