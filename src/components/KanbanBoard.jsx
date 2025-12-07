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

const IconGrip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
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

const IconYoutube = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const IconMoreHorizontal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
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
// 초기 보드 데이터
// ==========================================
const DEFAULT_BOARDS = [
  {
    id: 'board-workflow',
    title: '📋 기본 워크플로우',
    columns: [
      { id: 'col-inbox', title: '📥 찜한 영상', cardIds: [] },
      { id: 'col-review', title: '👀 검토 중', cardIds: [] },
      { id: 'col-ready', title: '✅ 수업 준비 완료', cardIds: [] },
    ]
  },
  {
    id: 'board-weekly',
    title: '📅 요일별 수업',
    columns: [
      { id: 'col-mon', title: '월요일', cardIds: [] },
      { id: 'col-tue', title: '화요일', cardIds: [] },
      { id: 'col-wed', title: '수요일', cardIds: [] },
      { id: 'col-thu', title: '목요일', cardIds: [] },
      { id: 'col-fri', title: '금요일', cardIds: [] },
    ]
  }
];

// ==========================================
// 메인 칸반 보드 컴포넌트
// ==========================================
export default function KanbanBoard({ videos = [], folders = [], onAnalyze, onOpenVideo }) {
  // 보드 상태 (localStorage에서 복원)
  const [boards, setBoards] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_boards');
      return saved ? JSON.parse(saved) : DEFAULT_BOARDS;
    } catch {
      return DEFAULT_BOARDS;
    }
  });
  
  const [activeBoardId, setActiveBoardId] = useState('board-workflow');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [tempBoardTitle, setTempBoardTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [tempColumnTitle, setTempColumnTitle] = useState('');
  
  const inputRef = useRef(null);
  const columnInputRef = useRef(null);

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // localStorage에 보드 저장
  useEffect(() => {
    localStorage.setItem('kanban_boards', JSON.stringify(boards));
  }, [boards]);

  // 편집 모드 포커스
  useEffect(() => {
    if (editingBoardId && inputRef.current) inputRef.current.focus();
  }, [editingBoardId]);

  useEffect(() => {
    if (editingColumnId && columnInputRef.current) columnInputRef.current.focus();
  }, [editingColumnId]);

  // --- 보드 관리 ---
  const handleAddBoard = () => {
    const newId = `board-${Date.now()}`;
    const newBoard = {
      id: newId,
      title: '새 보드',
      columns: [{ id: `col-${Date.now()}`, title: '새 컬럼', cardIds: [] }]
    };
    setBoards([...boards, newBoard]);
    setActiveBoardId(newId);
    setEditingBoardId(newId);
    setTempBoardTitle('새 보드');
  };

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation();
    if (boards.length <= 1) {
      Swal.fire({ title: '최소 하나의 보드가 필요합니다', icon: 'info' });
      return;
    }
    const result = await Swal.fire({
      title: '보드 삭제',
      text: '이 보드를 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      const newBoards = boards.filter(b => b.id !== boardId);
      setBoards(newBoards);
      if (activeBoardId === boardId) setActiveBoardId(newBoards[0].id);
    }
  };

  const saveBoardTitle = () => {
    if (tempBoardTitle.trim()) {
      setBoards(prev => prev.map(b => 
        b.id === editingBoardId ? { ...b, title: tempBoardTitle } : b
      ));
    }
    setEditingBoardId(null);
  };

  // --- 컬럼 관리 ---
  const handleAddColumn = () => {
    const newColId = `col-${Date.now()}`;
    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      return {
        ...b,
        columns: [...b.columns, { id: newColId, title: '새 컬럼', cardIds: [] }]
      };
    }));
    setEditingColumnId(newColId);
    setTempColumnTitle('새 컬럼');
  };

  const handleDeleteColumn = async (colId) => {
    const result = await Swal.fire({
      title: '컬럼 삭제',
      text: '이 컬럼을 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      setBoards(prev => prev.map(b => {
        if (b.id !== activeBoardId) return b;
        return { ...b, columns: b.columns.filter(c => c.id !== colId) };
      }));
    }
  };

  const saveColumnTitle = () => {
    if (tempColumnTitle.trim()) {
      setBoards(prev => prev.map(b => {
        if (b.id !== activeBoardId) return b;
        return {
          ...b,
          columns: b.columns.map(c => 
            c.id === editingColumnId ? { ...c, title: tempColumnTitle } : c
          )
        };
      }));
    }
    setEditingColumnId(null);
  };

  // --- 드래그 앤 드롭 ---
  const handleDragStart = (e, item, source, sourceColId = null) => {
    setDraggedItem({ ...item, source, sourceColId });
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    if (!draggedItem) return;

    // 같은 컬럼이면 무시
    if (draggedItem.source === 'board' && draggedItem.sourceColId === targetColId) {
      setDraggedItem(null);
      return;
    }

    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      
      const newCols = b.columns.map(col => {
        // 소스 컬럼에서 제거
        if (draggedItem.source === 'board' && col.id === draggedItem.sourceColId) {
          return { ...col, cardIds: col.cardIds.filter(id => id !== draggedItem.id) };
        }
        // 타겟 컬럼에 추가
        if (col.id === targetColId) {
          if (col.cardIds.includes(draggedItem.id)) return col;
          return { ...col, cardIds: [...col.cardIds, draggedItem.id] };
        }
        return col;
      });
      
      return { ...b, columns: newCols };
    }));
    
    setDraggedItem(null);
  };

  const removeCard = (colId, videoId) => {
    setBoards(prev => prev.map(b => {
      if (b.id !== activeBoardId) return b;
      return {
        ...b,
        columns: b.columns.map(col => 
          col.id === colId 
            ? { ...col, cardIds: col.cardIds.filter(id => id !== videoId) }
            : col
        )
      };
    }));
  };

  // --- 서랍 데이터 처리 ---
  const filteredVideos = useMemo(() => {
    if (!drawerSearch) return videos;
    const q = drawerSearch.toLowerCase();
    return videos.filter(v => 
      v.title?.toLowerCase().includes(q) ||
      v.memo?.toLowerCase().includes(q) ||
      v.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [videos, drawerSearch]);

  const videosByFolder = useMemo(() => {
    const groups = { '미분류': [] };
    
    filteredVideos.forEach(video => {
      const folder = folders.find(f => f.id === video.folderId);
      const folderName = folder?.name || '미분류';
      if (!groups[folderName]) groups[folderName] = [];
      groups[folderName].push(video);
    });
    
    return groups;
  }, [filteredVideos, folders]);

  const toggleFolder = (folderName) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderName)) newSet.delete(folderName);
    else newSet.add(folderName);
    setExpandedFolders(newSet);
  };

  // 컬럼 색상
  const getColumnColor = (title) => {
    if (title.includes('찜한') || title.includes('📥')) return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' };
    if (title.includes('검토') || title.includes('👀')) return { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' };
    if (title.includes('완료') || title.includes('✅')) return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' };
    if (title.includes('월')) return { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' };
    if (title.includes('화')) return { bg: '#DBEAFE', border: '#BFDBFE', text: '#2563EB' };
    if (title.includes('수')) return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' };
    if (title.includes('목')) return { bg: '#FDF4FF', border: '#F5D0FE', text: '#A855F7' };
    if (title.includes('금')) return { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' };
    return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' };
  };

  return (
    <div className="kanban-container">
      {/* 상단 보드 탭 */}
      <div className="kanban-header">
        <div className="kanban-tabs">
          {boards.map(board => (
            <div key={board.id} className="kanban-tab-wrapper">
              {editingBoardId === board.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={tempBoardTitle}
                  onChange={(e) => setTempBoardTitle(e.target.value)}
                  onBlur={saveBoardTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveBoardTitle();
                    if (e.key === 'Escape') setEditingBoardId(null);
                  }}
                  className="kanban-tab-input"
                />
              ) : (
                <button
                  onClick={() => setActiveBoardId(board.id)}
                  onDoubleClick={() => {
                    setEditingBoardId(board.id);
                    setTempBoardTitle(board.title);
                  }}
                  className={`kanban-tab ${activeBoardId === board.id ? 'active' : ''}`}
                  title="더블 클릭하여 이름 수정"
                >
                  {board.title}
                  <span 
                    className="kanban-tab-delete"
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                  >
                    <IconX />
                  </span>
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddBoard} className="kanban-tab-add" title="새 보드 추가">
            <IconPlus />
          </button>
        </div>

        <button 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`kanban-drawer-toggle ${isDrawerOpen ? 'active' : ''}`}
        >
          {isDrawerOpen ? <IconChevronLeft /> : <IconChevronRight />}
          {isDrawerOpen ? '서랍 닫기' : '서랍 열기'}
        </button>
      </div>

      <div className="kanban-main">
        {/* 자료 서랍 */}
        <aside className={`kanban-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="kanban-drawer-header">
            <h3><IconLayers /> 자료 가져오기</h3>
            <div className="kanban-drawer-search">
              <IconSearch />
              <input 
                type="text"
                placeholder="찜보따리에서 검색..."
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
                    onClick={() => toggleFolder(folderName)}
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
                          className="kanban-drawer-file"
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
          </div>
        </aside>

        {/* 칸반 보드 */}
        <main className="kanban-board">
          <div className="kanban-columns">
            {activeBoard?.columns.map(column => {
              const colors = getColumnColor(column.title);
              
              return (
                <div 
                  key={column.id}
                  className="kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* 컬럼 헤더 */}
                  <div className="kanban-column-header" style={{ borderColor: colors.border }}>
                    {editingColumnId === column.id ? (
                      <input
                        ref={columnInputRef}
                        type="text"
                        value={tempColumnTitle}
                        onChange={(e) => setTempColumnTitle(e.target.value)}
                        onBlur={saveColumnTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveColumnTitle();
                          if (e.key === 'Escape') setEditingColumnId(null);
                        }}
                        className="kanban-column-input"
                      />
                    ) : (
                      <>
                        <div 
                          className="kanban-column-title"
                          style={{ background: colors.bg, color: colors.text }}
                          onDoubleClick={() => {
                            setEditingColumnId(column.id);
                            setTempColumnTitle(column.title);
                          }}
                        >
                          {column.title}
                          <span className="kanban-column-count">{column.cardIds.length}</span>
                        </div>
                        <button 
                          className="kanban-column-menu"
                          onClick={() => handleDeleteColumn(column.id)}
                          title="컬럼 삭제"
                        >
                          <IconX />
                        </button>
                      </>
                    )}
                  </div>

                  {/* 카드 리스트 */}
                  <div className="kanban-column-cards">
                    {column.cardIds.length === 0 ? (
                      <div className="kanban-column-empty">
                        <p>여기로 자료를 드래그하세요</p>
                      </div>
                    ) : (
                      column.cardIds.map(videoId => {
                        const video = videos.find(v => v.id === videoId);
                        if (!video) return null;
                        
                        return (
                          <div 
                            key={`${column.id}-${video.id}`}
                            className="kanban-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, video, 'board', column.id)}
                          >
                            <div className="kanban-card-thumb">
                              {video.videoId ? (
                                <img 
                                  src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                                  alt=""
                                />
                              ) : (
                                <div className="kanban-card-thumb-placeholder">
                                  <IconYoutube />
                                </div>
                              )}
                              <SafetyBadge score={video.safetyScore} />
                              <button 
                                className="kanban-card-remove"
                                onClick={() => removeCard(column.id, video.id)}
                              >
                                <IconX />
                              </button>
                            </div>
                            <div className="kanban-card-content">
                              <h4>{video.title || '제목 없음'}</h4>
                              <div className="kanban-card-actions">
                                <span className="kanban-card-folder">
                                  <IconFolder />
                                  {folders.find(f => f.id === video.folderId)?.name || '미분류'}
                                </span>
                                <button 
                                  className="kanban-card-analyze"
                                  onClick={() => onAnalyze?.(video)}
                                >
                                  상세분석
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* 새 컬럼 추가 버튼 */}
            <button className="kanban-column-add" onClick={handleAddColumn}>
              <IconPlus />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}


