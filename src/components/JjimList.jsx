import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import {
  addLinkDirectly,
  createFolder,
  renameFolder,
  deleteFolder,
  moveVideoToFolder,
  deleteVideo
} from '../utils/jjim';
import { classifyVideo, getClassificationSummary } from '../utils/aiClassifier';
import CascadingPathSelector from './CascadingPathSelector';
import KanbanBoard from './KanbanBoard';
import FolderAutoCreateModal from './FolderAutoCreateModal';
import '../styles/cascading-path.css';
import '../styles/auto-organize-v2.css';
import '../styles/kanban.css';

// ==========================================
// [아이콘 컴포넌트들]
// ==========================================
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconFolder = ({ className = "" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFolderOpen = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="M2 10l20 0"/>
  </svg>
);

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconKanban = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="16" y="4" width="4" height="14" rx="1"/>
  </svg>
);

const IconWand = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconMove = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="m9 14 3-3 3 3"/><path d="M12 11v6"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconShieldCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconShieldAlert = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconLoader = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconFolderPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconFileVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><polygon points="10 13 10 17 14 15 10 13"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconSparkles = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

// ==========================================
// [안전 배지 컴포넌트]
// ==========================================
const SafetyBadge = ({ score }) => {
  if (score >= 95) {
    return (
      <div className="jjim-safety-badge safe">
        <IconShieldCheck /> 안전
      </div>
    );
  }
  if (score >= 70) {
    return (
      <div className="jjim-safety-badge caution">
        <IconAlertTriangle /> 주의
      </div>
    );
  }
  return (
    <div className="jjim-safety-badge danger">
      <IconShieldAlert /> 위험
    </div>
  );
};

// ==========================================
// [체크박스 컴포넌트]
// ==========================================
const Checkbox = ({ checked, onChange }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`jjim-checkbox ${checked ? 'checked' : ''}`}
  >
    {checked && <IconCheck />}
  </div>
);

// ==========================================
// [폴더 이동 모달 - SaveWizard 스타일]
// ==========================================
const FolderMoveModal = ({ folders, selectedCount, onClose, onMove }) => {
  const [currentPath, setCurrentPath] = useState([]); // 현재 탐색 경로
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  // 루트 레벨 폴더
  const getRootFolders = () => folders.filter(f => !f.parentId);

  // 특정 폴더의 하위 폴더
  const getChildFolders = (parentId) => {
    if (!parentId) return folders.filter(f => !f.parentId);
    return folders.filter(f => f.parentId === parentId);
  };

  // 현재 위치의 폴더 목록
  const getCurrentFolders = () => {
    const currentParentId = currentPath.length > 0 
      ? currentPath[currentPath.length - 1].id 
      : null;
    return getChildFolders(currentParentId);
  };

  // 하위 폴더 존재 여부
  const hasChildren = (folderId) => folders.some(f => f.parentId === folderId);

  // 폴더 이름 가져오기
  const getFolderName = (folderId) => {
    if (!folderId) return '최상위';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : '최상위';
  };

  // 폴더로 들어가기
  const navigateInto = (folder) => {
    setCurrentPath([...currentPath, folder]);
  };

  // 상위로 이동
  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  // 현재 위치 선택
  const selectCurrentLocation = () => {
    const folderId = currentPath.length > 0 
      ? currentPath[currentPath.length - 1].id 
      : null;
    setSelectedFolderId(folderId);
    onMove(folderId);
  };

  // 특정 폴더 선택
  const selectFolder = (folder) => {
    setSelectedFolderId(folder.id);
    onMove(folder.id);
  };

  return (
    <div className="jjim-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jjim-folder-move-modal">
        {/* 헤더 */}
        <div className="jjim-fmm-header">
          <div className="jjim-fmm-title">
            <IconMove /> 폴더로 이동
          </div>
          <button onClick={onClose} className="jjim-close-btn">
            <IconX />
          </button>
        </div>
        
        <p className="jjim-fmm-desc">
          {selectedCount}개 항목을 이동할 폴더를 선택하세요
        </p>

        {/* 폴더 탐색 영역 */}
        <div className="jjim-fmm-content">
          {/* 현재 경로 표시 및 상위 이동 */}
          {currentPath.length > 0 && (
            <div className="jjim-fmm-nav">
              <button className="jjim-fmm-back-btn" onClick={navigateUp}>
                <IconArrowLeft />
                <span>상위로</span>
              </button>
              <span className="jjim-fmm-current-path">
                📁 {currentPath[currentPath.length - 1].name}
              </span>
            </div>
          )}

          {/* 현재 위치 선택 버튼 */}
          <button
            className="jjim-fmm-select-current"
            onClick={selectCurrentLocation}
          >
            <IconCheck />
            <span>
              {currentPath.length > 0 
                ? `'${currentPath[currentPath.length - 1].name}'(으)로 이동` 
                : '최상위(루트)로 이동'}
            </span>
          </button>

          {/* 폴더 목록 */}
          {getCurrentFolders().length > 0 && (
            <div className="jjim-fmm-section-label">
              {currentPath.length === 0 ? '📁 폴더 선택' : '📂 하위 폴더'}
            </div>
          )}

          <div className="jjim-fmm-folder-list">
            {getCurrentFolders().map(folder => (
              <button
                key={folder.id}
                className={`jjim-fmm-folder-item ${selectedFolderId === folder.id ? 'selected' : ''}`}
                onClick={() => selectFolder(folder)}
                onDoubleClick={() => {
                  if (hasChildren(folder.id)) {
                    navigateInto(folder);
                  }
                }}
              >
                <IconFolder className="jjim-fmm-folder-icon" />
                <span className="jjim-fmm-folder-name">{folder.name}</span>
                {hasChildren(folder.id) && (
                  <button
                    className="jjim-fmm-expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateInto(folder);
                    }}
                    title="하위 폴더 보기"
                  >
                    <IconChevronRight />
                  </button>
                )}
              </button>
            ))}
          </div>

          {/* 폴더 없을 때 */}
          {getCurrentFolders().length === 0 && folders.length === 0 && (
            <div className="jjim-fmm-empty">
              📭 폴더가 없습니다. 새 폴더를 먼저 만들어주세요.
            </div>
          )}
          {getCurrentFolders().length === 0 && folders.length > 0 && currentPath.length > 0 && (
            <div className="jjim-fmm-empty">
              하위 폴더가 없습니다
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="jjim-fmm-footer">
          <button onClick={onClose} className="jjim-btn secondary">닫기</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [AI 자동 정리 모달 - 브레드크럼 스타일]
// ==========================================
const AutoOrganizeModal = ({ videos, folders, onClose, onApply, user, scanTargets = null }) => {
  const [status, setStatus] = useState('scanning');
  const [proposals, setProposals] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null); // 펼쳐진 아이템 인덱스
  
  // 폴더 ID로 전체 경로 가져오기 (배열로)
  const getPathArray = (folderId) => {
    if (!folderId) return [{ id: 'root', name: '내 찜보따리', parentId: null }];
    
    const path = [];
    let currentId = folderId;
    let safe = 0;
    
    while (currentId && safe < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else break;
      safe++;
    }
    
    path.unshift({ id: 'root', name: '내 찜보따리', parentId: null });
    return path;
  };
  
  // 경로 문자열로 변환
  const getFullPath = (folderId) => {
    return getPathArray(folderId).map(f => f.name).join(' > ');
  };

  useEffect(() => {
    const scan = async () => {
      const targetVideos = (scanTargets && scanTargets.length > 0)
        ? scanTargets
        : videos.filter(v => !v.folderId);
      const moves = [];
      
      targetVideos.forEach(video => {
        const videoInfo = {
          title: video.title || '',
          description: video.memo || '',
          summary: (video.tags || []).join(' ')
        };
        
        console.log('🔍 분류 중:', video.title);
        const classification = getClassificationSummary(videoInfo);
        
        if (classification.hasSuggestion && classification.topMatch) {
          const match = classification.topMatch;
          const isCritical = classification.isCriticalMatch;
          const isSemanticOverride = classification.isSemanticOverride;
          const isEntityOverride = classification.isEntityOverride;
          const isAmbiguous = classification.ambiguous;
          const candidates = classification.candidates || [match];
          
          // 사용자 폴더에서 같은 이름 찾기
          const existingFolder = folders.find(f => 
            f.name.toLowerCase().includes(match.name.toLowerCase()) ||
            match.name.toLowerCase().includes(f.name.toLowerCase())
          );
          
          moves.push({ 
            type: existingFolder ? 'move' : 'create', 
            videoId: video.id, 
            videoTitle: video.title, 
            targetId: existingFolder?.id || 'new_folder',
            targetName: existingFolder?.name || match.name,
            newFolderParentId: null, // 새 폴더 생성 시 부모
            confidence: match.confidence,
            curriculumPath: match.path,
            curriculumId: match.id,
            matchedKeywords: match.matchedKeywords || [],
            isCriticalMatch: isCritical,
            isSemanticOverride: isSemanticOverride,
            isEntityOverride: isEntityOverride,
            isAmbiguous: isAmbiguous,
            candidates: candidates,
            checked: true 
          });
        } else {
          // 폴백 로직
          const text = ((video.title || '') + ' ' + (video.tags || []).join(' ')).toLowerCase();
          let bestMatch = null;
          
          folders.forEach(folder => {
            const folderName = folder.name.toLowerCase();
            if (text.includes(folderName) || folderName.split(' ').some(w => w.length > 1 && text.includes(w))) {
              bestMatch = folder;
            }
          });
          
          const suggestedName = video.tags?.[0] || '기타 자료';
          moves.push({ 
            type: bestMatch ? 'move' : 'create', 
            videoId: video.id, 
            videoTitle: video.title, 
            targetId: bestMatch?.id || 'new_folder',
            targetName: bestMatch?.name || suggestedName,
            newFolderParentId: null,
            checked: true 
          });
        }
      });
      
      setTimeout(() => {
        if (moves.length === 0) {
          setStatus('empty');
        } else {
        setProposals(moves);
        setStatus('proposal');
        }
      }, 500);
    };
    scan();
  }, [videos, folders, scanTargets]);

  const handleToggle = (index) => {
    const newProposals = [...proposals];
    newProposals[index].checked = !newProposals[index].checked;
    setProposals(newProposals);
  };

  // 폴더 선택 변경 (CascadingPathSelector에서 호출)
  const handleFolderSelect = (index, folderId) => {
    const newProposals = [...proposals];
    if (folderId === null || folderId === 'root') {
      newProposals[index].type = 'create';
      newProposals[index].targetId = 'new_folder';
      newProposals[index].newFolderParentId = null;
    } else {
      newProposals[index].type = 'move';
      newProposals[index].targetId = folderId;
      const folder = folders.find(f => f.id === folderId);
      newProposals[index].targetName = folder?.name || '알 수 없음';
    }
    setProposals(newProposals);
  };

  // 새 폴더 생성
  const handleCreateFolder = async (index, name, parentId) => {
    const newProposals = [...proposals];
    newProposals[index].type = 'create';
    newProposals[index].targetId = 'new_folder';
    newProposals[index].targetName = name;
    newProposals[index].newFolderParentId = parentId;
    setProposals(newProposals);
  };

  // 새 폴더 이름 변경
  const handleChangeNewFolderName = (index, name) => {
    const newProposals = [...proposals];
    newProposals[index].targetName = name;
    setProposals(newProposals);
  };

  // 후보 선택
  const handleSelectCandidate = (proposalIdx, candidate) => {
    const newProposals = [...proposals];
    const existingFolder = folders.find(f => 
      f.name.toLowerCase().includes(candidate.name?.toLowerCase() || '') ||
      (candidate.name?.toLowerCase() || '').includes(f.name.toLowerCase())
    );
    
    if (existingFolder) {
      newProposals[proposalIdx].type = 'move';
      newProposals[proposalIdx].targetId = existingFolder.id;
      newProposals[proposalIdx].targetName = existingFolder.name;
    } else {
      newProposals[proposalIdx].type = 'create';
      newProposals[proposalIdx].targetId = 'new_folder';
      newProposals[proposalIdx].targetName = candidate.name || '새 폴더';
      newProposals[proposalIdx].curriculumPath = candidate.path;
    }
    newProposals[proposalIdx].isAmbiguous = false;
    setProposals(newProposals);
  };

  // 매칭 타입에 따른 배지 렌더링
  const renderMatchBadge = (move) => {
    if (move.isSemanticOverride) {
      return <span className="aom-badge semantic">🚨 강제확정</span>;
    }
    if (move.isEntityOverride) {
      return <span className="aom-badge entity">⚖️ Entity 확정</span>;
    }
    if (move.isCriticalMatch) {
      return <span className="aom-badge critical">🎯 확정</span>;
    }
    if (move.isAmbiguous) {
      return <span className="aom-badge ambiguous">🤔 선택 필요</span>;
    }
    if (move.confidence) {
      const level = move.confidence >= 80 ? 'high' : move.confidence >= 50 ? 'medium' : 'low';
      return <span className={`aom-badge confidence ${level}`}>{move.confidence}%</span>;
    }
    return null;
  };

  return (
    <div className="jjim-modal-overlay">
      <div className="jjim-auto-organize-modal wide">
        {/* 헤더 */}
        <div className="jjim-aom-header">
          <div className="jjim-aom-title">
            <IconWand /> AI 자동 정리
          </div>
          <button onClick={onClose} className="jjim-close-btn">
            <IconX />
          </button>
        </div>
        <p className="jjim-aom-desc">
          AI가 추천한 경로를 확인하고, 원하는 대로 수정하세요.
          <br />
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>각 항목을 클릭하면 경로를 변경할 수 있습니다.</span>
        </p>
        
        {/* 컨텐츠 */}
        <div className="jjim-aom-content">
          {status === 'scanning' ? (
            <div className="jjim-aom-scanning">
              <IconLoader />
              <p>🎓 교육과정 데이터베이스 기반 분석 중...</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                영상 제목과 태그를 학년/과목/단원과 매칭합니다
              </p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="jjim-aom-empty">
              <IconFolderOpen />
              <p>정리할 영상이 없습니다.</p>
            </div>
          ) : (
            <div className="jjim-aom-list-v2">
              {proposals.map((move, idx) => (
                <div 
                  key={idx} 
                  className={`aom-item-v2 ${move.checked ? 'checked' : ''} ${expandedIdx === idx ? 'expanded' : ''}`}
                >
                  {/* 상단: 체크박스 + 영상 제목 + 배지 */}
                  <div className="aom-item-header" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                    <div className="aom-item-left">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={move.checked} onChange={() => handleToggle(idx)} />
                      </div>
                      <div className="aom-video-info">
                        <IconFileVideo />
                        <span className="aom-video-title">{move.videoTitle}</span>
                      </div>
                    </div>
                    <div className="aom-item-right">
                      {renderMatchBadge(move)}
                      <span className="aom-expand-icon">
                        {expandedIdx === idx ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 중단: 브레드크럼 경로 표시 */}
                  <div className="aom-path-display">
                    <span className="aom-arrow">→</span>
                    <div className="aom-path-breadcrumb">
                      {move.type === 'create' ? (
                        <>
                          {getPathArray(move.newFolderParentId).map((p, i, arr) => (
                            <span key={p.id} className="aom-crumb">
                              {p.name}
                              {i < arr.length - 1 && <span className="aom-sep">›</span>}
                            </span>
                          ))}
                          <span className="aom-sep">›</span>
                          <span className="aom-crumb new">
                            <IconFolderPlus />
                            {move.targetName}
                          </span>
                        </>
                      ) : (
                        getPathArray(move.targetId).map((p, i, arr) => (
                          <span key={p.id} className={`aom-crumb ${i === arr.length - 1 ? 'active' : ''}`}>
                            {p.name}
                            {i < arr.length - 1 && <span className="aom-sep">›</span>}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* 하단: 펼침 영역 - 경로 수정 */}
                  {expandedIdx === idx && move.checked && (
                    <div className="aom-expanded-content">
                      {/* 키워드 표시 */}
                      {move.matchedKeywords?.length > 0 && (
                        <div className="aom-keywords">
                          <span className="aom-keywords-label">🔑 매칭 키워드:</span>
                          {move.matchedKeywords.map((kw, i) => (
                            <span key={i} className="aom-keyword-tag">{kw}</span>
                          ))}
                        </div>
                      )}
                      
                      {/* Ambiguous: 후보 선택 */}
                      {move.isAmbiguous && move.candidates?.length > 1 && (
                        <div className="aom-candidates">
                          <div className="aom-candidates-header">
                            🤖 "이 자료, 어디에 넣을까요?"
                          </div>
                          {move.candidates.map((c, ci) => (
                            <button
                              key={ci}
                              className={`aom-candidate-btn ${ci === 0 ? 'recommended' : ''}`}
                              onClick={() => handleSelectCandidate(idx, c)}
                            >
                              <span className="aom-candidate-num">{ci + 1}.</span>
                              {c.subjectName && (
                                <span className="aom-candidate-subject">{c.subjectName}</span>
                              )}
                              <span className="aom-candidate-name">{c.name || c.path}</span>
                              {ci === 0 && <span className="aom-candidate-rec">추천</span>}
                              <span className="aom-candidate-score">({c.score}점)</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* 경로 선택기 */}
                      <div className="aom-path-selector-section">
                        <div className="aom-selector-label">📁 저장 위치 변경:</div>
                        <CascadingPathSelector
                          folders={folders}
                          selectedFolderId={move.type === 'move' ? move.targetId : move.newFolderParentId}
                          curriculumPath={move.curriculumPath}
                          onSelect={(folderId) => handleFolderSelect(idx, folderId)}
                          onCreateFolder={(name, parentId) => handleCreateFolder(idx, name, parentId)}
                          showCreateNew={true}
                        />
                      </div>
                      
                      {/* 새 폴더 이름 입력 */}
                      {move.type === 'create' && (
                        <div className="aom-new-folder-section">
                          <label>새 폴더 이름:</label>
                          <input
                            type="text"
                            value={move.targetName}
                            onChange={(e) => handleChangeNewFolderName(idx, e.target.value)}
                            placeholder="폴더 이름 입력"
                            className="aom-new-folder-input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 푸터 */}
        <div className="jjim-aom-footer">
          <div className="aom-footer-stats">
            {status === 'proposal' && (
              <span>{proposals.filter(p => p.checked).length} / {proposals.length}개 선택됨</span>
            )}
          </div>
          <div className="aom-footer-actions">
            <button onClick={onClose} className="jjim-btn secondary">닫기</button>
            {status === 'proposal' && proposals.length > 0 && (
              <button 
                onClick={() => onApply(proposals.filter(p => p.checked))} 
                className="jjim-btn primary gradient"
                disabled={proposals.filter(p => p.checked).length === 0}
              >
                <IconWand /> {proposals.filter(p => p.checked).length}개 정리하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [메인 찜보따리 컴포넌트]
// ==========================================
export default function JjimList({ onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 뷰 모드: 'list', 'folder', 'kanban' (localStorage에서 초기값 로드)
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('default_jjim_view');
    // folder -> list로 매핑 (기존 호환성), kanban -> board
    if (saved === 'folder') return 'list';
    if (saved === 'kanban') return 'board';
    if (saved === 'list') return 'list';
    return 'list'; // 기본값
  });
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [autoOrganizeOpen, setAutoOrganizeOpen] = useState(false);
  const [autoOrganizeTargets, setAutoOrganizeTargets] = useState(null); // 선택 분류용
  const [folderCreateModalOpen, setFolderCreateModalOpen] = useState(false); // 폴더 자동 생성 모달
  const [folderMoveModalOpen, setFolderMoveModalOpen] = useState(false); // 폴더 이동 모달
  
  // 🆕 와이드 뷰 상태 (칸반보드와 동기화)
  const [isWideView, setIsWideView] = useState(() => {
    try {
      return localStorage.getItem('kanban_wide_view') === 'true';
    } catch {
      return false;
    }
  });
  
  // 칸반 보드 컬럼
  const [boardColumns] = useState([
    { id: 'inbox', label: '📥 찜한 영상', color: 'bg-gray-100 text-gray-600' },
    { id: 'reviewing', label: '👀 검토 중', color: 'bg-blue-100 text-blue-700' },
    { id: 'ready', label: '✅ 수업 준비 완료', color: 'bg-green-100 text-green-700' },
  ]);

  useEffect(() => {
    if (!user) {
      handleNotLoggedIn();
    } else {
      loadJjimData();
    }
  }, [user]);

  // URL 파라미터로 자동 분류 모달 열기 (예: /jjim?auto=1) - 🆕 비활성화됨
  // 사용자가 직접 AI 정리 버튼을 클릭해야만 모달이 열림
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const auto = params.get('auto') || params.get('autoClassify');
  //   if (auto === '1') {
  //     setAutoOrganizeTargets(null);
  //     setAutoOrganizeOpen(true);
  //     const url = new URL(window.location.href);
  //     url.searchParams.delete('auto');
  //     url.searchParams.delete('autoClassify');
  //     window.history.replaceState({}, '', url.pathname);
  //   }
  // }, []);

  const handleNotLoggedIn = async () => {
    const result = await Swal.fire({
      title: '로그인이 필요합니다',
      text: '찜보따리는 로그인 후 이용할 수 있습니다.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Google 로그인',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error('Login error:', error);
        onBack();
      }
    } else {
      onBack();
    }
    setLoading(false);
  };

  const loadJjimData = async () => {
    setLoading(true);
    try {
      const allFolders = [];
      const allVideos = [];

      const mainDocRef = doc(db, 'jjimVideos', user.uid);
      const mainDoc = await getDoc(mainDocRef);

      if (mainDoc.exists()) {
        const data = mainDoc.data();
        if (data.folders) allFolders.push(...data.folders);
        if (data.videos) allVideos.push(...data.videos);

        if (data.add_lists && data.add_lists.length > 0) {
          for (const listNum of data.add_lists) {
            const addDocRef = doc(db, 'jjimVideos', `${user.uid}_${listNum}`);
            const addDoc = await getDoc(addDocRef);
            if (addDoc.exists()) {
              const addData = addDoc.data();
              if (addData.folders) allFolders.push(...addData.folders);
              if (addData.videos) allVideos.push(...addData.videos);
            }
          }
        }
      }

      // 최신순 정렬
      allVideos.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setFolders(allFolders);
      setVideos(allVideos);
    } catch (error) {
      console.error('Error loading jjim data:', error);
      Swal.fire({
        title: '오류',
        text: '데이터를 불러오는 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // 선택 토글
  const handleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // 선택 전체 해제
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // 🆕 전체 선택
  const handleSelectAll = () => {
    const allIds = new Set();
    // 현재 폴더의 하위 폴더들
    currentItems.folders.forEach(f => allIds.add(f.id));
    // 현재 폴더의 영상들
    currentItems.videos.forEach(v => allIds.add(v.id));
    setSelectedIds(allIds);
  };

  // 🆕 폴더 자동생성 모달 열기
  const handleAutoGenerateFolders = () => {
    setFolderCreateModalOpen(true);
  };

  // 새 폴더 만들기
  const handleCreateFolder = async () => {
    const { value: folderName } = await Swal.fire({
      title: '새 폴더 만들기',
      input: 'text',
      inputLabel: '폴더 이름',
      inputPlaceholder: '예: 6학년 사회',
      showCancelButton: true,
      confirmButtonText: '만들기',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      inputValidator: (value) => {
        if (!value) return '폴더 이름을 입력해주세요';
      }
    });

    if (folderName) {
      try {
        await createFolder({ user, name: folderName, parentId: currentFolderId });
        await Swal.fire({
          title: '폴더 생성 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '폴더 생성 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // 선택된 항목 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const result = await Swal.fire({
      title: '삭제 확인',
      text: `${selectedIds.size}개 항목을 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedIds) {
          const video = videos.find(v => v.id === id);
          const folder = folders.find(f => f.id === id);
          
          if (video) {
            await deleteVideo({ user, videoId: id });
          } else if (folder) {
            await deleteFolder({ user, folderId: id, moveToRoot: true });
          }
        }
        
        await Swal.fire({
          title: '삭제 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        
        setSelectedIds(new Set());
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '삭제 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // 선택된 항목 이동 - 모달 열기
  const handleMoveSelected = () => {
    if (selectedIds.size === 0) return;
    setFolderMoveModalOpen(true);
  };

  // 실제 이동 처리
  const handleMoveToFolder = async (targetFolderId) => {
    try {
      for (const id of selectedIds) {
        const video = videos.find(v => v.id === id);
        if (video) {
          await moveVideoToFolder({ user, videoId: id, folderId: targetFolderId });
        }
      }
      
      await Swal.fire({
        title: '이동 완료!',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 1500
      });
      
      setSelectedIds(new Set());
      setFolderMoveModalOpen(false);
      loadJjimData();
    } catch (error) {
      Swal.fire({
        title: '오류',
        text: error.message || '이동 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // 영상 상태 변경 (칸반 보드용)
  const handleStatusChange = async (videoId, newStatus) => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      const mainDocRef = doc(db, 'jjimVideos', user.uid);
      const mainDoc = await getDoc(mainDocRef);
      
      if (mainDoc.exists()) {
        const data = mainDoc.data();
        const updatedVideos = (data.videos || []).map(v => 
          v.id === videoId ? { ...v, status: newStatus } : v
        );
        
        await updateDoc(mainDocRef, { videos: updatedVideos });
        loadJjimData();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  // AI 자동 정리 적용
  const handleApplyAutoOrganize = async (moves) => {
    try {
      for (const move of moves) {
        let targetId = move.targetId;
        
        if (move.type === 'create') {
          // 새 폴더 생성
          const existingFolder = folders.find(f => f.name === move.targetName);
          if (existingFolder) {
            targetId = existingFolder.id;
          } else {
            await createFolder({ user, name: move.targetName, parentId: null });
            await loadJjimData();
            const newFolder = folders.find(f => f.name === move.targetName);
            targetId = newFolder?.id || null;
          }
        }
        
        // 영상 이동
        await moveVideoToFolder({ user, videoId: move.videoId, folderId: targetId });
      }
      
      await Swal.fire({
        title: `${moves.length}개 파일이 정리되었습니다!`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
      
      setAutoOrganizeOpen(false);
      loadJjimData();
    } catch (error) {
      Swal.fire({
        title: '오류',
        text: error.message || '정리 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // 선택된 영상만 AI 정리 모달 열기
  const handleClassifySelected = () => {
    const selectedVideos = videos.filter(v => selectedIds.has(v.id));
    if (selectedVideos.length === 0) {
      Swal.fire({
        title: '선택된 영상이 없습니다',
        text: '폴더가 아니라 영상만 선택 후 다시 시도해주세요.',
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    setAutoOrganizeTargets(selectedVideos);
    setAutoOrganizeOpen(true);
  };

  // 브레드크럼 생성
  const getBreadcrumbs = () => {
    const path = [{ id: 'root', name: '내 찜보따리' }];
    let tempId = currentFolderId;
    let depth = 0;
    while (tempId && depth < 10) {
      const folder = folders.find(i => i.id === tempId);
      if (folder) {
        path.splice(1, 0, { id: folder.id, name: folder.name });
        tempId = folder.parentId;
      } else break;
      depth++;
    }
    return path;
  };

  // 현재 폴더의 항목들
  const currentFolders = folders.filter(f =>
    (f.parentId === currentFolderId) || (currentFolderId === null && !f.parentId)
  );

  const currentVideos = videos.filter(v => v.folderId === currentFolderId);

  // 검색 필터링
  const filteredFolders = searchQuery.trim()
    ? currentFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentFolders;

  const filteredVideos = searchQuery.trim()
    ? currentVideos.filter(v => 
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : currentVideos;

  const allItems = [...filteredFolders, ...filteredVideos];
  const hasContent = allItems.length > 0;

  // 미분류 영상 수
  const unorganizedCount = videos.filter(v => !v.folderId).length;

  if (loading) {
    return (
      <div className="jjim-loading">
        <div className="jjim-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`jjim-container ${viewMode === 'board' && isWideView ? 'wide-mode' : ''}`}>
      {/* 헤더 */}
      <div className="jjim-header">
        <h1 className="jjim-title">내 찜보따리</h1>
        <div className="jjim-header-actions">
          <button onClick={handleAutoGenerateFolders} className="jjim-auto-folder-btn">
            <IconWand /> 폴더 자동생성
          </button>
          <button onClick={handleCreateFolder} className="jjim-new-btn">
            <IconPlus /> 새 폴더
          </button>
        </div>
      </div>

      {/* 툴바 */}
      <div className="jjim-toolbar">
        {selectedIds.size > 0 ? (
          // 선택 모드 툴바
          <div className="jjim-selection-bar">
            <button onClick={handleClearSelection} className="jjim-clear-btn">
              <IconX />
            </button>
            <button onClick={handleSelectAll} className="jjim-select-all-btn">
              ✓ 전체 선택
            </button>
            <span className="jjim-selection-count">{selectedIds.size}개 선택됨</span>
            <div className="jjim-selection-actions">
              <button onClick={handleClassifySelected} className="jjim-action-btn primary">
                <IconWand /> AI 정리
              </button>
              <button onClick={handleDeleteSelected} className="jjim-action-btn danger">
                <IconTrash /> 삭제
          </button>
              <button onClick={handleMoveSelected} className="jjim-action-btn primary">
                <IconMove /> 이동
          </button>
        </div>
          </div>
        ) : (
          // 기본 툴바
          <>
            {/* 브레드크럼 */}
            <div className="jjim-breadcrumbs">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <div key={crumb.id} className="jjim-crumb-item">
                  <button
                    onClick={() => setCurrentFolderId(crumb.id === 'root' ? null : crumb.id)}
                    className={`jjim-crumb ${idx === arr.length - 1 ? 'active' : ''}`}
                  >
                    {crumb.name}
                  </button>
                  {idx < arr.length - 1 && <IconChevronRight />}
              </div>
            ))}
          </div>

            {/* 뷰 모드 & AI 정리 */}
            <div className="jjim-toolbar-right">
              {unorganizedCount > 0 && (
                <button
                  onClick={() => { setAutoOrganizeTargets(null); setAutoOrganizeOpen(true); }} 
                  className="jjim-ai-btn"
                >
                  <IconWand /> AI 정리 ({unorganizedCount})
                </button>
              )}
              <div className="jjim-view-toggle">
                    <button
                  onClick={() => setViewMode('list')} 
                  className={`jjim-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <IconList />
                    </button>
                    <button
                  onClick={() => setViewMode('grid')} 
                  className={`jjim-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <IconGrid />
                    </button>
                <button 
                  onClick={() => setViewMode('board')} 
                  className={`jjim-view-btn ${viewMode === 'board' ? 'active' : ''}`}
                >
                  <IconKanban />
                </button>
                </div>
              </div>
          </>
                )}
              </div>

      {/* 검색바 */}
      <div className="jjim-search-bar">
        <IconSearch />
            <input
              type="text"
          placeholder="찜보따리에서 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
          className="jjim-search-input"
        />
        </div>

      {/* 컨텐츠 영역 */}
      <div className="jjim-content" onClick={() => handleClearSelection()}>
      {!hasContent ? (
          <div className="jjim-empty">
            <IconFolderOpen />
            <p>폴더가 비어있습니다</p>
            <button onClick={handleCreateFolder} className="jjim-empty-btn">
              새 폴더 만들기
                      </button>
                    </div>
        ) : viewMode === 'board' ? (
          // 🆕 KanbanBoard 컴포넌트 사용
          <KanbanBoard
            videos={videos}
            folders={folders}
            onAnalyze={(video) => handleVideoClick(video)}
            onOpenVideo={(video) => handleVideoClick(video)}
            onStatusChange={handleStatusChange}
            onWideViewChange={(wide) => setIsWideView(wide)}
            onAddVideo={async ({ url, videoUrl, videoId, title, thumbnail, linkType, status, folderId }) => {
              try {
                // 🆕 제목 Fallback 로직 (필수값 보장)
                let finalTitle = title;
                if (!finalTitle) {
                  if (videoId) {
                    finalTitle = 'YouTube 영상';
                  } else if (linkType === 'twitter') {
                    finalTitle = 'X(Twitter) 게시물';
                  } else if (linkType === 'instagram') {
                    finalTitle = 'Instagram 게시물';
                  } else if (linkType === 'blog') {
                    finalTitle = '블로그 글';
                  } else {
                    finalTitle = url || videoUrl || '새 링크';
                  }
                }

                // 🆕 썸네일 자동 생성
                const finalThumbnail = thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '');
                const finalLinkType = linkType || (videoId ? 'youtube' : 'generic');
                const finalUrl = videoUrl || url;

                // 🆕 즉시 렌더링: State 먼저 업데이트 (Optimistic Update)
                const newVideo = {
                  id: `temp_${Date.now()}`, // 임시 ID
                  videoId,
                  videoUrl: finalUrl,
                  title: finalTitle,
                  thumbnail: finalThumbnail,
                  linkType: finalLinkType,
                  status: status,
                  folderId: folderId || currentFolderId,
                  tags: [],
                  memo: '',
                  isManualAdd: true,
                  createdAt: { seconds: Date.now() / 1000 },
                };

                // State에 즉시 추가 (화면에 바로 표시)
                setVideos(prev => [newVideo, ...prev]);

                // 그 다음 DB에 저장 (백그라운드)
                await addLinkDirectly({
                  user,
                  videoUrl: finalUrl,
                  title: finalTitle,
                  folderId: folderId || currentFolderId,
                  linkType: finalLinkType,
                  thumbnail: finalThumbnail,
                  status: status, // 🆕 칸반 컬럼 ID 전달!
                  tags: [],
                  memo: '',
                });
                
                // DB 저장 후 실제 데이터로 동기화
                await loadJjimData();
              } catch (error) {
                console.error('링크 추가 오류:', error);
                // 에러 시 롤백 (추가했던 임시 항목 제거)
                setVideos(prev => prev.filter(v => !v.id.startsWith('temp_')));
                throw error;
              }
            }}
            onAiOrganize={(targetVideos) => {
              if (targetVideos) {
                setAutoOrganizeTargets(targetVideos);
              } else {
                const unorganized = videos.filter(v => !v.folderId);
                if (unorganized.length > 0) {
                  setAutoOrganizeTargets(unorganized);
                }
              }
              setShowAutoOrganize(true);
            }}
            onRefresh={loadJjimData}
          />
      ) : (
          // 리스트 & 그리드 뷰
          <>
            {/* 🆕 리스트 헤더 바 (전체 선택) */}
            {(filteredFolders.length > 0 || filteredVideos.length > 0) && (
              <div className="jjim-list-header-bar">
                <label className="jjim-select-all-label">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === (filteredFolders.length + filteredVideos.length)}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < (filteredFolders.length + filteredVideos.length)}
                    onChange={() => {
                      if (selectedIds.size === (filteredFolders.length + filteredVideos.length)) {
                        // 전체 해제
                        setSelectedIds(new Set());
                      } else {
                        // 전체 선택
                        const allIds = new Set();
                        filteredFolders.forEach(f => allIds.add(f.id));
                        filteredVideos.forEach(v => allIds.add(v.id));
                        setSelectedIds(allIds);
                      }
                    }}
                  />
                  <span>전체 선택</span>
                </label>
                {selectedIds.size > 0 && (
                  <span className="jjim-selected-count-badge">
                    {selectedIds.size}개 선택됨
                  </span>
                )}
                <span className="jjim-item-count">
                  총 {filteredFolders.length + filteredVideos.length}개
                </span>
              </div>
            )}

            {/* 폴더 섹션 */}
            {filteredFolders.length > 0 && (
              <div className="jjim-section">
                <h3 className="jjim-section-title">Folders</h3>
                <div className={viewMode === 'grid' ? 'jjim-grid' : 'jjim-list'}>
                  {filteredFolders.map(folder => (
              <div
                key={folder.id}
                      className={`jjim-folder-item ${viewMode} ${selectedIds.has(folder.id) ? 'selected' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (selectedIds.size > 0) {
                          handleSelect(folder.id);
                        } else {
                          setCurrentFolderId(folder.id);
                        }
                      }}
                    >
                      <div className="jjim-folder-checkbox">
                        <Checkbox 
                          checked={selectedIds.has(folder.id)} 
                          onChange={() => handleSelect(folder.id)} 
                        />
                  </div>
                      <IconFolder className="jjim-folder-icon" />
                      <span className="jjim-folder-name">{folder.name}</span>
                </div>
                  ))}
                </div>
              </div>
            )}

            {/* 영상 섹션 */}
            {filteredVideos.length > 0 && (
              <div className="jjim-section">
                <h3 className="jjim-section-title">Files</h3>
                <div className={viewMode === 'grid' ? 'jjim-video-grid' : 'jjim-video-list'}>
                  {filteredVideos.map(video => {
                    const videoId = video.videoId;
                    const thumbnail = videoId 
                      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                      : video.thumbnail || 'https://via.placeholder.com/320x180';

            return (
              <div
                key={video.id}
                        className={`jjim-video-item ${viewMode} ${selectedIds.has(video.id) ? 'selected' : ''}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (selectedIds.size > 0) {
                            handleSelect(video.id);
                          } else {
                    window.open(video.videoUrl, '_blank');
                  }
                }}
              >
                        <div className="jjim-video-checkbox">
                          <Checkbox 
                            checked={selectedIds.has(video.id)} 
                            onChange={() => handleSelect(video.id)} 
                          />
                    </div>
                        <div className="jjim-video-thumbnail">
                          <img src={thumbnail} alt={video.title} />
                          {video.duration && (
                            <span className="jjim-video-duration">{video.duration}</span>
                  )}
                </div>
                        <div className="jjim-video-info">
                          <h4 className="jjim-video-title">{video.title || '제목 없음'}</h4>
                          {viewMode === 'list' && (
                            <div className="jjim-video-meta">
                              {video.safetyScore !== undefined && (
                                <SafetyBadge score={video.safetyScore} />
                              )}
                              <span className="jjim-video-date">
                                {video.createdAt?.seconds 
                                  ? new Date(video.createdAt.seconds * 1000).toLocaleDateString()
                                  : '날짜 없음'}
                          </span>
                            </div>
                          )}
                          {viewMode === 'grid' && (
                            <div className="jjim-video-meta-grid">
                              {video.safetyScore !== undefined && (
                                <SafetyBadge score={video.safetyScore} />
                              )}
                            </div>
                    )}
                  </div>
                  </div>
                    );
                  })}
                </div>
                  </div>
                )}
          </>
        )}
                </div>

      {/* AI 자동 정리 모달 */}
      {autoOrganizeOpen && (
        <AutoOrganizeModal 
          videos={videos}
          folders={folders}
          user={user}
          scanTargets={autoOrganizeTargets}
          onClose={() => { setAutoOrganizeOpen(false); setAutoOrganizeTargets(null); }}
          onApply={handleApplyAutoOrganize}
        />
      )}

      {/* 폴더 자동 생성 모달 */}
      {folderCreateModalOpen && (
        <FolderAutoCreateModal
          onClose={() => setFolderCreateModalOpen(false)}
          onComplete={() => loadJjimData()}
        />
      )}

      {/* 폴더 이동 모달 */}
      {folderMoveModalOpen && (
        <FolderMoveModal
          folders={folders}
          selectedCount={selectedIds.size}
          onClose={() => setFolderMoveModalOpen(false)}
          onMove={handleMoveToFolder}
        />
      )}
    </div>
  );
}

