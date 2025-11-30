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
// [AI 자동 정리 모달]
// ==========================================
const AutoOrganizeModal = ({ videos, folders, onClose, onApply, user }) => {
  const [status, setStatus] = useState('scanning');
  const [proposals, setProposals] = useState([]);
  
  const getFullPath = (folderId) => {
    if (!folderId) return '내 찜보따리';
    let path = [];
    let currentId = folderId;
    let safe = 0;
    while (currentId && safe < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder.name);
        currentId = folder.parentId;
      } else break;
      safe++;
    }
    return path.length > 0 ? path.join(' > ') : '내 찜보따리';
  };

  useEffect(() => {
    const scan = async () => {
      // 미분류 영상만 가져오기 (folderId가 없는 영상)
      const rootVideos = videos.filter(v => !v.folderId);
      
      const moves = [];
      rootVideos.forEach(video => {
        const text = ((video.title || '') + ' ' + (video.tags || []).join(' ')).toLowerCase();
        let bestMatchId = null;
        
        // 폴더 이름과 매칭
        folders.forEach(folder => {
          const folderName = folder.name.toLowerCase();
          if (text.includes(folderName) || folderName.split(' ').some(word => text.includes(word))) {
            bestMatchId = folder.id;
          }
        });
        
        if (bestMatchId) {
          const targetFolder = folders.find(f => f.id === bestMatchId);
          moves.push({ 
            type: 'move', 
            videoId: video.id, 
            videoTitle: video.title, 
            targetId: bestMatchId, 
            targetName: targetFolder?.name || '알 수 없음',
            checked: true 
          });
        } else {
          // 태그 기반 새 폴더 제안
          const suggestedName = video.tags && video.tags.length > 0 ? video.tags[0] : '기타 자료';
          moves.push({ 
            type: 'create', 
            videoId: video.id, 
            videoTitle: video.title, 
            targetName: suggestedName, 
            targetId: 'new_folder',
            checked: true 
          });
        }
      });
      
      // 1.5초 후 결과 표시 (분석 효과)
      setTimeout(() => {
        setProposals(moves);
        setStatus('proposal');
      }, 1500);
    };
    scan();
  }, [videos, folders]);

  const handleToggle = (index) => {
    const newProposals = [...proposals];
    newProposals[index].checked = !newProposals[index].checked;
    setProposals(newProposals);
  };

  const handleChangeTarget = (index, newTargetId) => {
    const newProposals = [...proposals];
    if (newTargetId === 'create_new') {
      newProposals[index].type = 'create';
      newProposals[index].targetId = 'new_folder';
      newProposals[index].targetName = '새 폴더';
    } else {
      newProposals[index].type = 'move';
      newProposals[index].targetId = newTargetId;
      const targetFolder = folders.find(f => f.id === newTargetId);
      newProposals[index].targetName = targetFolder?.name || '알 수 없음';
    }
    setProposals(newProposals);
  };

  const handleChangeNewFolderName = (index, name) => {
    const newProposals = [...proposals];
    newProposals[index].targetName = name;
    setProposals(newProposals);
  };

  return (
    <div className="jjim-modal-overlay">
      <div className="jjim-auto-organize-modal">
        <div className="jjim-aom-header">
          <div className="jjim-aom-title">
            <IconWand /> AI 자동 정리
          </div>
          <button onClick={onClose} className="jjim-close-btn">
            <IconX />
          </button>
        </div>
        <p className="jjim-aom-desc">AI 제안이 마음에 들지 않으면 직접 수정할 수 있습니다.</p>
        
        <div className="jjim-aom-content">
          {status === 'scanning' ? (
            <div className="jjim-aom-scanning">
              <IconLoader />
              <p>미분류 영상을 분석 중...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="jjim-aom-empty">
              정리할 파일이 없습니다.
            </div>
          ) : (
            <div className="jjim-aom-list">
              {proposals.map((move, idx) => (
                <div key={idx} className={`jjim-aom-item ${move.checked ? 'checked' : ''}`}>
                  <div className="jjim-aom-item-header">
                    <Checkbox checked={move.checked} onChange={() => handleToggle(idx)} />
                    <div className="jjim-aom-video-title">
                      <IconFileVideo />
                      <span>{move.videoTitle}</span>
                    </div>
                  </div>
                  {move.checked && (
                    <div className="jjim-aom-item-action">
                      <div className="jjim-aom-arrow"><IconArrowRight /></div>
                      <div className="jjim-aom-select-wrapper">
                        <select 
                          className="jjim-aom-select"
                          value={move.type === 'create' ? 'create_new' : move.targetId}
                          onChange={(e) => handleChangeTarget(idx, e.target.value)}
                        >
                          <optgroup label="작업 선택">
                            <option value="create_new">✨ 새 폴더 만들기...</option>
                          </optgroup>
                          <optgroup label="기존 폴더로 이동">
                            {folders.map(folder => (
                              <option key={folder.id} value={folder.id}>
                                📁 {getFullPath(folder.id)}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <IconChevronDown />
                      </div>
                      {move.type === 'create' && (
                        <div className="jjim-aom-new-folder">
                          <input 
                            type="text" 
                            className="jjim-aom-input"
                            value={move.targetName} 
                            onChange={(e) => handleChangeNewFolderName(idx, e.target.value)} 
                            placeholder="새 폴더 이름"
                          />
                          <IconFolderPlus />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="jjim-aom-footer">
          <button onClick={onClose} className="jjim-btn secondary">닫기</button>
          {status === 'proposal' && proposals.length > 0 && (
            <button 
              onClick={() => onApply(proposals.filter(p => p.checked))} 
              className="jjim-btn primary gradient"
            >
              <IconWand /> 적용하기
            </button>
          )}
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
  
  // 뷰 모드: 'list', 'grid', 'board'
  const [viewMode, setViewMode] = useState('list');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [autoOrganizeOpen, setAutoOrganizeOpen] = useState(false);
  
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

  // 선택된 항목 이동
  const handleMoveSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const folderOptions = folders.reduce((acc, folder) => {
      acc[folder.id] = folder.name;
      return acc;
    }, { 'null': '📁 최상위 (루트)' });

    const { value: targetFolderId } = await Swal.fire({
      title: '폴더로 이동',
      input: 'select',
      inputOptions: folderOptions,
      showCancelButton: true,
      confirmButtonText: '이동',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
    });

    if (targetFolderId !== undefined) {
      try {
        const folderId = targetFolderId === 'null' ? null : targetFolderId;
        
        for (const id of selectedIds) {
          const video = videos.find(v => v.id === id);
          if (video) {
            await moveVideoToFolder({ user, videoId: id, folderId });
          }
        }
        
        await Swal.fire({
          title: '이동 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        
        setSelectedIds(new Set());
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '이동 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
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
    <div className="jjim-container">
      {/* 헤더 */}
      <div className="jjim-header">
        <h1 className="jjim-title">내 찜보따리</h1>
        <button onClick={handleCreateFolder} className="jjim-new-btn">
          <IconPlus /> 새 폴더
        </button>
      </div>

      {/* 툴바 */}
      <div className="jjim-toolbar">
        {selectedIds.size > 0 ? (
          // 선택 모드 툴바
          <div className="jjim-selection-bar">
            <button onClick={handleClearSelection} className="jjim-clear-btn">
              <IconX />
            </button>
            <span className="jjim-selection-count">{selectedIds.size}개 선택됨</span>
            <div className="jjim-selection-actions">
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
                  onClick={() => setAutoOrganizeOpen(true)} 
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
          // 칸반 보드 뷰
          <div className="jjim-board">
            {boardColumns.map(col => {
              const colVideos = currentVideos.filter(v => (v.status || 'inbox') === col.id);
              return (
                <div key={col.id} className="jjim-board-column">
                  <div className="jjim-board-column-header">
                    <span className={`jjim-column-label ${col.color}`}>{col.label}</span>
                    <span className="jjim-column-count">{colVideos.length}</span>
                  </div>
                  <div className="jjim-board-column-content">
                    {colVideos.map(video => (
                      <div 
                        key={video.id} 
                        className={`jjim-board-card ${selectedIds.has(video.id) ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSelect(video.id); }}
                      >
                        <div className="jjim-board-card-checkbox">
                          <Checkbox checked={selectedIds.has(video.id)} onChange={() => handleSelect(video.id)} />
                        </div>
                        <div className="jjim-board-card-thumbnail">
                          <img 
                            src={video.videoId ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` : video.thumbnail || 'https://via.placeholder.com/320x180'} 
                            alt={video.title}
                          />
                        </div>
                        <div className="jjim-board-card-title">{video.title}</div>
                        <div className="jjim-board-card-footer">
                          {video.safetyScore !== undefined ? (
                            <SafetyBadge score={video.safetyScore} />
                          ) : (
                            <SafetyBadge score={100} />
                          )}
                          <select 
                            className="jjim-status-select"
                            value={video.status || 'inbox'}
                            onChange={(e) => { e.stopPropagation(); handleStatusChange(video.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {boardColumns.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // 리스트 & 그리드 뷰
          <>
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
          onClose={() => setAutoOrganizeOpen(false)}
          onApply={handleApplyAutoOrganize}
        />
      )}
    </div>
  );
}
