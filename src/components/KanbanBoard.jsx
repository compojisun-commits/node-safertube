import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
// 🆕 보드 선택 드롭다운
// ==========================================
const BoardSelector = ({ boards, currentBoardId, onSelect, onCreateNew }) => {
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

  return (
    <div className="kanban-board-selector" ref={dropdownRef}>
      <button 
        className="kanban-board-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="kanban-board-icon">{currentBoard?.icon || '📋'}</span>
        <span className="kanban-board-name">{currentBoard?.name || '보드 선택'}</span>
        <IconChevronDown />
      </button>

      {isOpen && (
        <div className="kanban-board-dropdown">
          <div className="kanban-board-dropdown-header">
            <span>보드 선택</span>
          </div>
          
          <div className="kanban-board-dropdown-list">
            {boards.map((board) => (
              <button
                key={board.id}
                className={`kanban-board-option ${board.id === currentBoardId ? 'active' : ''}`}
                onClick={() => {
                  onSelect(board.id);
                  setIsOpen(false);
                }}
              >
                <span className="kanban-board-option-icon">{board.icon}</span>
                <span className="kanban-board-option-name">{board.name}</span>
                <span className="kanban-board-option-cols">{board.columns.length}개 섹션</span>
                {board.id === currentBoardId && <IconCheck />}
              </button>
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
}) {
  // 🆕 onStatusChange를 onUpdateVideoStatus로 alias (호환성 유지)
  const onUpdateVideoStatus = onStatusChange || ((videoId, newStatus) => {
    console.log('Status change:', videoId, newStatus);
  });
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
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const inputRef = useRef(null);
  
  // 서랍 상태 (기본: 닫힘)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // 🆕 서랍이 열릴 때 데이터 새로고침 (동기화 보장) - 닫혔다가 열릴 때만
  const prevDrawerOpenRef = useRef(isDrawerOpen);
  useEffect(() => {
    // 이전에 닫혀있었고(false), 지금 열렸을 때(true)만 새로고침
    if (!prevDrawerOpenRef.current && isDrawerOpen && onRefresh) {
      onRefresh();
    }
    prevDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (addingToColumn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingToColumn]);

  // 🆕 보드 전환
  const handleSelectBoard = useCallback((boardId) => {
    setCurrentBoardId(boardId);
  }, []);

  // 🆕 새 보드 생성
  const handleCreateBoard = useCallback(async () => {
    const { value: formValues } = await Swal.fire({
      title: '새 보드 만들기',
      html: `
        <div style="text-align: left;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">보드 이름</label>
          <input id="board-name" class="swal2-input" placeholder="예: 프로젝트 관리" style="margin: 0 0 12px 0;">
          
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">아이콘 (이모지)</label>
          <input id="board-icon" class="swal2-input" placeholder="예: 📚" style="margin: 0;" value="📋">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '만들기',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      preConfirm: () => {
        const name = document.getElementById('board-name').value;
        const icon = document.getElementById('board-icon').value;
        if (!name?.trim()) {
          Swal.showValidationMessage('보드 이름을 입력해주세요');
          return false;
        }
        return { name: name.trim(), icon: icon.trim() || '📋' };
      }
    });

    if (formValues) {
      const newBoard = {
        id: `board_${Date.now()}`,
        name: `${formValues.icon} ${formValues.name}`,
        icon: formValues.icon,
        columns: [
          { id: `col_${Date.now()}_1`, title: '📥 대기', color: '#F8FAFC' },
          { id: `col_${Date.now()}_2`, title: '🚧 진행 중', color: '#FEF3C7' },
          { id: `col_${Date.now()}_3`, title: '✅ 완료', color: '#DCFCE7' },
        ]
      };
      setBoards(prev => [...prev, newBoard]);
      setCurrentBoardId(newBoard.id);
    }
  }, []);

  // 🆕 보드 삭제
  const handleDeleteBoard = useCallback(async () => {
    if (boards.length <= 1) {
      Swal.fire({ title: '마지막 보드는 삭제할 수 없습니다', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    const result = await Swal.fire({
      title: '보드를 삭제할까요?',
      text: `"${currentBoard.name}" 보드가 삭제됩니다.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
    });

    if (result.isConfirmed) {
      setBoards(prev => prev.filter(b => b.id !== currentBoardId));
      setCurrentBoardId(boards[0].id === currentBoardId ? boards[1]?.id : boards[0].id);
    }
  }, [boards, currentBoard, currentBoardId]);

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

  // 🆕 선택된 카드 일괄 삭제
  const handleBatchDelete = useCallback(async () => {
    if (selectedCardIds.size === 0) return;
    
    const result = await Swal.fire({
      title: '일괄 삭제',
      html: `<p>선택한 <strong>${selectedCardIds.size}개</strong>의 영상을 보드에서 제거하시겠습니까?</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });
    
    if (result.isConfirmed) {
      // 선택된 모든 카드의 status를 첫 번째 컬럼으로 변경 (또는 제거)
      const firstColumnId = columns[0]?.id;
      for (const videoId of selectedCardIds) {
        await onUpdateVideoStatus?.(videoId, firstColumnId);
      }
      
      handleClearSelection();
      
      Swal.fire({
        icon: 'success',
        title: '완료',
        text: `${selectedCardIds.size}개 영상이 이동되었습니다.`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  }, [selectedCardIds, columns, onUpdateVideoStatus, handleClearSelection]);

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

  // 🆕 카드 삭제 확인 (Swal 모달)
  const handleConfirmRemoveFromBoard = async (video) => {
    const result = await Swal.fire({
      title: '보드에서 제거',
      html: `<p>"<strong>${video.title || '이 영상'}</strong>"을<br/>보드에서 제거하시겠습니까?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '제거',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      handleRemoveFromBoard(video);
      setCardMenuOpen(null);
    }
  };

  // 영상을 status별로 그룹화
  const videosByStatus = useMemo(() => {
    const groups = {};
    columns.forEach(col => {
      groups[col.id] = [];
    });
    
    videos.forEach(video => {
      const status = video.status || columns[0]?.id || 'inbox';
      if (groups[status]) {
        groups[status].push(video);
      } else if (groups[columns[0]?.id]) {
        groups[columns[0].id].push(video);
      }
    });
    
    return groups;
  }, [videos, columns]);

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

  // 🆕 섹션 전체 비우기
  const handleClearColumn = useCallback(async (columnId) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    const columnVideos = videosByStatus[columnId] || [];
    if (columnVideos.length === 0) {
      Swal.fire({
        icon: 'info',
        title: '비울 영상이 없습니다',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    const result = await Swal.fire({
      title: '섹션 비우기',
      html: `<p>"<strong>${column.title}</strong>" 섹션의 ${columnVideos.length}개 영상을 모두 첫 번째 섹션으로 이동하시겠습니까?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '비우기',
      cancelButtonText: '취소',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      const firstColumnId = columns.find(c => c.id !== columnId)?.id;
      if (firstColumnId) {
        for (const video of columnVideos) {
          await onUpdateVideoStatus?.(video.id, firstColumnId);
        }
      }
      setColumnMenuOpen(null);
      Swal.fire({
        icon: 'success',
        title: '완료',
        text: `${columnVideos.length}개 영상이 이동되었습니다.`,
        timer: 1500,
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
  const handleDragStart = (e, video, source = 'board') => {
    setDraggedVideo({ ...video, _source: source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedVideo) return;
    
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
    
    if (draggedVideo.status === targetColumnId) {
      setDraggedVideo(null);
      return;
    }

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

  // + 버튼 클릭
  const handleAddClick = (columnId) => {
    setAddingToColumn(columnId);
    setNewVideoUrl('');
  };

  const handleCancelAdd = () => {
    setAddingToColumn(null);
    setNewVideoUrl('');
  };

  // 영상 추가
  const handleSubmitAdd = async () => {
    if (!newVideoUrl.trim()) {
      handleCancelAdd();
      return;
    }

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
    
    if (onAddVideo) {
      try {
        await onAddVideo({
          url: newVideoUrl,
          videoId,
          status: addingToColumn,
          folderId: null,
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

  const handleRemoveFromBoard = async (video) => {
    if (onStatusChange) {
      await onStatusChange(video.id, null);
    }
  };

  return (
    <div className="kanban-global-container">
      {/* 상단 헤더 */}
      <div className="kanban-global-header">
        <div className="kanban-global-title">
          {/* 🆕 보드 선택기 */}
          <BoardSelector
            boards={boards}
            currentBoardId={currentBoardId}
            onSelect={handleSelectBoard}
            onCreateNew={handleCreateBoard}
          />
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

          {/* 서랍 토글 버튼 */}
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`kanban-drawer-toggle ${isDrawerOpen ? 'active' : ''}`}
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
                      
                      const isSelected = selectedCardIds.has(video.id);
                      
                      return (
                        <div 
                          key={video.id}
                          className={`kanban-card-v2 ${draggedVideo?.id === video.id ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
                          draggable={!isEditMode && cardMenuOpen !== video.id && !isSelected}
                          onDragStart={(e) => {
                            if (isEditMode || cardMenuOpen || isSelected) return;
                            handleDragStart(e, video, 'board');
                          }}
                        >
                          {/* 🆕 다중 선택 체크박스 */}
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
                          
                          {/* 🆕 Notion 스타일 더보기 메뉴 */}
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
                            
                            <SafetyBadge score={video.safetyScore} />
                          </div>
                          
                          {/* 카드 내용 */}
                          <div className="kanban-card-content-v2">
                            <h4 
                              className="kanban-card-title-v2"
                              onClick={() => onOpenVideo?.(video)}
                            >
                              {video.title || '제목 없음'}
                            </h4>
                            
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

                  {/* + 버튼 입력 모드 */}
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
                    !isEditMode && (
                      <button 
                        className="kanban-add-card-btn"
                        onClick={() => handleAddClick(column.id)}
                      >
                        <IconPlus />
                        <span>영상 추가</span>
                      </button>
                    )
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
                title="선택한 영상 삭제"
              >
                <IconTrash />
                <span>삭제</span>
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
    </div>
  );
}
