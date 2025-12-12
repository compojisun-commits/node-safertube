import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createFolder, addLinkDirectly } from '../utils/jjim';

// 미니멀 아이콘 컴포넌트들
const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFolderPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/>
    <line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconYoutube = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default function SaveWizard({ videoData, multiLinks, user, onClose, onSuccess }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // 단일 모드용 상태
  const [title, setTitle] = useState(videoData?.title || "");
  const [memo, setMemo] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showSingleDropdown, setShowSingleDropdown] = useState(false);
  const [singlePath, setSinglePath] = useState([]); // 단일 모드 폴더 탐색 경로
  
  // 멀티 모드용 상태 - 각 링크별 폴더 지정
  const [linkFolders, setLinkFolders] = useState({});
  const [expandedLinkIndex, setExpandedLinkIndex] = useState(null);
  
  // 드롭다운 내 폴더 네비게이션 상태
  const [dropdownPath, setDropdownPath] = useState([]); // 현재 드롭다운에서 탐색 중인 경로
  
  // 일괄 적용 폴더 네비게이션 상태
  const [bulkPath, setBulkPath] = useState([]); // 일괄 적용에서 탐색 중인 경로
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  
  // 멀티 링크 모드 확인
  const isMultiMode = multiLinks && multiLinks.length > 0;
  const linksToSave = isMultiMode ? multiLinks : (videoData ? [videoData] : []);

  // 폴더 데이터 로드
  useEffect(() => {
    loadFolders();
  }, [user]);

  // videoData.title이 변경되면 title 업데이트
  useEffect(() => {
    if (videoData?.title) {
      setTitle(videoData.title);
    }
  }, [videoData?.title]);

  // 멀티 링크 초기화 - 모든 링크를 최상위(null)로 설정
  useEffect(() => {
    if (isMultiMode && multiLinks) {
      const initialFolders = {};
      multiLinks.forEach((_, idx) => {
        initialFolders[idx] = null; // null = 최상위
      });
      setLinkFolders(initialFolders);
    }
  }, [isMultiMode, multiLinks]);

  const loadFolders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const mainDocRef = doc(db, 'jjimVideos', user.uid);
      const mainDoc = await getDoc(mainDocRef);
      
      if (mainDoc.exists()) {
        const data = mainDoc.data();
        setFolders(data.folders || []);
      } else {
        setFolders([]);
      }
    } catch (error) {
      console.error('폴더 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 루트 레벨 폴더만 가져오기
  const getRootFolders = () => folders.filter(f => !f.parentId);

  // 특정 폴더의 하위 폴더 가져오기
  const getChildFolders = (parentId) => {
    if (!parentId) return folders.filter(f => !f.parentId);
    return folders.filter(f => f.parentId === parentId);
  };

  // 현재 드롭다운에서 보여줄 폴더들
  const getCurrentDropdownFolders = () => {
    const currentParentId = dropdownPath.length > 0 
      ? dropdownPath[dropdownPath.length - 1].id 
      : null;
    return getChildFolders(currentParentId);
  };

  // 폴더가 하위 폴더를 가지고 있는지 확인
  const hasChildren = (folderId) => {
    return folders.some(f => f.parentId === folderId);
  };

  // 폴더 이름 가져오기
  const getFolderName = (folderId) => {
    if (!folderId) return '최상위';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : '최상위';
  };

  // 폴더의 전체 경로 이름 가져오기 (예: "6학년 > 사회")
  const getFolderPath = (folderId) => {
    if (!folderId) return '최상위';
    
    const pathParts = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        pathParts.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return pathParts.length > 0 ? pathParts.join(' > ') : '최상위';
  };

  // 드롭다운에서 폴더로 들어가기
  const navigateIntoFolder = (folder) => {
    setDropdownPath([...dropdownPath, folder]);
  };

  // 드롭다운에서 상위로 가기
  const navigateUp = () => {
    setDropdownPath(dropdownPath.slice(0, -1));
  };

  // 드롭다운 열기/닫기
  const toggleDropdown = (linkIndex) => {
    if (expandedLinkIndex === linkIndex) {
      setExpandedLinkIndex(null);
      setDropdownPath([]); // 드롭다운 닫을 때 경로 초기화
    } else {
      setExpandedLinkIndex(linkIndex);
      setDropdownPath([]); // 새 드롭다운 열 때 경로 초기화
      setShowBulkDropdown(false); // 일괄 적용 드롭다운 닫기
    }
  };

  // 일괄 적용 드롭다운 토글
  const toggleBulkDropdown = () => {
    setShowBulkDropdown(!showBulkDropdown);
    setBulkPath([]);
    setExpandedLinkIndex(null); // 개별 드롭다운 닫기
  };

  // 일괄 적용에서 폴더로 들어가기
  const navigateIntoBulkFolder = (folder) => {
    setBulkPath([...bulkPath, folder]);
  };

  // 일괄 적용에서 상위로 가기
  const navigateBulkUp = () => {
    setBulkPath(bulkPath.slice(0, -1));
  };

  // 일괄 적용 현재 폴더 목록
  const getCurrentBulkFolders = () => {
    const currentParentId = bulkPath.length > 0 
      ? bulkPath[bulkPath.length - 1].id 
      : null;
    return getChildFolders(currentParentId);
  };

  // 일괄 적용으로 폴더 선택
  const applyBulkFolder = (folderId) => {
    applyFolderToAll(folderId);
    setShowBulkDropdown(false);
    setBulkPath([]);
  };

  // 단일 모드 드롭다운 토글
  const toggleSingleDropdown = () => {
    setShowSingleDropdown(!showSingleDropdown);
    setSinglePath([]);
  };

  // 단일 모드에서 폴더로 들어가기
  const navigateIntoSingleFolder = (folder) => {
    setSinglePath([...singlePath, folder]);
  };

  // 단일 모드에서 상위로 가기
  const navigateSingleUp = () => {
    setSinglePath(singlePath.slice(0, -1));
  };

  // 단일 모드 현재 폴더 목록
  const getCurrentSingleFolders = () => {
    const currentParentId = singlePath.length > 0 
      ? singlePath[singlePath.length - 1].id 
      : null;
    return getChildFolders(currentParentId);
  };

  // 단일 모드로 폴더 선택
  const selectSingleFolder = (folderId) => {
    setSelectedFolderId(folderId);
    setShowSingleDropdown(false);
    setSinglePath([]);
  };

  // 특정 링크의 폴더 변경
  const handleLinkFolderChange = (linkIndex, folderId) => {
    setLinkFolders(prev => ({
      ...prev,
      [linkIndex]: folderId
    }));
    setExpandedLinkIndex(null);
    setDropdownPath([]); // 폴더 선택 후 경로 초기화
  };

  // 모든 링크에 같은 폴더 적용
  const applyFolderToAll = (folderId) => {
    const newFolders = {};
    linksToSave.forEach((_, idx) => {
      newFolders[idx] = folderId;
    });
    setLinkFolders(newFolders);
  };

  // 새 폴더 생성 핸들러
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      const newFolder = await createFolder({ 
        user, 
        name: newFolderName,
        parentId: null // 최상위에 생성
      });
      
      await loadFolders();
      setNewFolderName("");
      setIsCreatingFolder(false);
      
      // 새로 만든 폴더를 선택
      if (!isMultiMode) {
        setSelectedFolderId(newFolder.id);
      }
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      alert('폴더 생성에 실패했습니다.');
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!isMultiMode && !title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    setSaving(true);
    try {
      if (isMultiMode) {
        // 멀티 링크 - 각각 지정된 폴더에 저장
        for (let i = 0; i < linksToSave.length; i++) {
          const link = linksToSave[i];
          const folderId = linkFolders[i] || null;
          
          await addLinkDirectly({
            user,
            videoUrl: link.url,
            title: link.title || link.url,
            memo: '',
            folderId,
            tags: [],
            linkType: link.type || 'generic',
            thumbnail: link.thumbnail || ''
          });
        }
      } else {
        // 단일 링크 저장
        await addLinkDirectly({
          user,
          videoUrl: videoData.url,
          title: title.trim(),
          memo,
          folderId: selectedFolderId,
          tags: [],
          linkType: videoData.type || 'youtube',
          thumbnail: videoData.thumbnail || ''
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sw-overlay">
        <div className="sw-modal sw-modal-multi">
          <div className="sw-loading">
            <div className="sw-spinner"></div>
            <span>불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sw-modal ${isMultiMode ? 'sw-modal-multi' : ''}`}>
        {/* 헤더 */}
        <div className="sw-header">
          <h2 className="sw-title">
            {isMultiMode ? `${linksToSave.length}개 링크 저장하기` : '찜보따리 저장하기'}
          </h2>
          <button onClick={onClose} className="sw-close-btn">
            <IconX />
          </button>
        </div>

        {isMultiMode ? (
          // ===== 멀티 링크 모드 =====
          <>
            {/* 일괄 적용 옵션 - 폴더 탐색 지원 */}
            <div className="sw-bulk-apply">
              <span className="sw-bulk-label">📁 모두 같은 폴더로:</span>
              <div className="sw-bulk-selector">
                <button
                  className="sw-bulk-trigger"
                  onClick={toggleBulkDropdown}
                >
                  <IconFolder />
                  <span>폴더 선택하기</span>
                  <IconChevronDown />
                </button>
                
                {/* 일괄 적용 드롭다운 */}
                {showBulkDropdown && (
                  <div className="sw-bulk-dropdown">
                    {/* 현재 경로 표시 및 상위 이동 */}
                    {bulkPath.length > 0 && (
                      <div className="sw-dropdown-nav">
                        <button
                          className="sw-dropdown-back"
                          onClick={navigateBulkUp}
                        >
                          <IconArrowLeft />
                          <span>상위로</span>
                        </button>
                        <span className="sw-dropdown-current">
                          📁 {bulkPath[bulkPath.length - 1].name}
                        </span>
                      </div>
                    )}
                    
                    {/* 현재 위치 선택 버튼 */}
                    <button
                      className="sw-dropdown-item sw-dropdown-select"
                      onClick={() => applyBulkFolder(
                        bulkPath.length > 0 ? bulkPath[bulkPath.length - 1].id : null
                      )}
                    >
                      <IconCheck />
                      <span>
                        {bulkPath.length > 0 
                          ? `모두 '${bulkPath[bulkPath.length - 1].name}'에 저장` 
                          : '모두 최상위에 저장'}
                      </span>
                    </button>
                    
                    {/* 하위 폴더 목록 */}
                    {getCurrentBulkFolders().length > 0 && (
                      <div className="sw-dropdown-section-label">
                        하위 폴더로 이동
                      </div>
                    )}
                    
                    {getCurrentBulkFolders().map(folder => (
                      <button
                        key={folder.id}
                        className="sw-dropdown-item sw-dropdown-folder"
                        onClick={() => {
                          if (hasChildren(folder.id)) {
                            navigateIntoBulkFolder(folder);
                          } else {
                            applyBulkFolder(folder.id);
                          }
                        }}
                      >
                        <IconFolder />
                        <span>{folder.name}</span>
                        {hasChildren(folder.id) ? (
                          <IconChevronRight />
                        ) : null}
                      </button>
                    ))}
                    
                    {/* 폴더 없을 때 */}
                    {getCurrentBulkFolders().length === 0 && (
                      <div className="sw-dropdown-empty">
                        하위 폴더가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 링크별 폴더 지정 리스트 */}
            <div className="sw-links-list">
              {linksToSave.map((link, idx) => (
                <div key={idx} className="sw-link-item">
                  {/* 링크 정보 */}
                  <div className="sw-link-info">
                    <div className={`sw-link-icon ${link.type}`}>
                      {link.type === 'youtube' ? <IconYoutube /> : <IconGlobe />}
                    </div>
                    <span className="sw-link-title">{link.title || link.url}</span>
                  </div>
                  
                  {/* 폴더 선택 드롭다운 */}
                  <div className="sw-folder-select-wrapper">
                    <button
                      className="sw-folder-select-btn"
                      onClick={() => toggleDropdown(idx)}
                    >
                      <IconFolder />
                      <span className="sw-folder-path-text">{getFolderPath(linkFolders[idx])}</span>
                      <IconChevronDown />
                    </button>
                    
                    {/* 드롭다운 메뉴 - 하위 폴더 네비게이션 지원 */}
                    {expandedLinkIndex === idx && (
                      <div className="sw-folder-dropdown">
                        {/* 현재 경로 표시 및 상위 이동 */}
                        {dropdownPath.length > 0 && (
                          <div className="sw-dropdown-nav">
                            <button
                              className="sw-dropdown-back"
                              onClick={navigateUp}
                            >
                              <IconArrowLeft />
                              <span>상위로</span>
                            </button>
                            <span className="sw-dropdown-current">
                              📁 {dropdownPath[dropdownPath.length - 1].name}
                            </span>
                          </div>
                        )}
                        
                        {/* 현재 위치 선택 버튼 */}
                        <button
                          className={`sw-dropdown-item sw-dropdown-select ${
                            linkFolders[idx] === (dropdownPath.length > 0 ? dropdownPath[dropdownPath.length - 1].id : null) 
                              ? 'active' 
                              : ''
                          }`}
                          onClick={() => handleLinkFolderChange(
                            idx, 
                            dropdownPath.length > 0 ? dropdownPath[dropdownPath.length - 1].id : null
                          )}
                        >
                          <IconCheck />
                          <span>
                            {dropdownPath.length > 0 
                              ? `'${dropdownPath[dropdownPath.length - 1].name}'에 저장` 
                              : '최상위에 저장'}
                          </span>
                        </button>
                        
                        {/* 하위 폴더 목록 */}
                        {getCurrentDropdownFolders().length > 0 && (
                          <div className="sw-dropdown-section-label">
                            하위 폴더로 이동
                          </div>
                        )}
                        
                        {getCurrentDropdownFolders().map(folder => (
                          <button
                            key={folder.id}
                            className="sw-dropdown-item sw-dropdown-folder"
                            onClick={() => {
                              if (hasChildren(folder.id)) {
                                navigateIntoFolder(folder);
                              } else {
                                handleLinkFolderChange(idx, folder.id);
                              }
                            }}
                          >
                            <IconFolder />
                            <span>{folder.name}</span>
                            {hasChildren(folder.id) ? (
                              <IconChevronRight />
                            ) : (
                              linkFolders[idx] === folder.id && <IconCheck />
                            )}
                          </button>
                        ))}
                        
                        {/* 폴더 없을 때 */}
                        {getCurrentDropdownFolders().length === 0 && (
                          <div className="sw-dropdown-empty">
                            하위 폴더가 없습니다
                          </div>
                        )}
                        
                        {/* 새 폴더 만들기 */}
                        {!isCreatingFolder && (
                          <button
                            className="sw-dropdown-item sw-dropdown-new"
                            onClick={() => setIsCreatingFolder(true)}
                          >
                            <IconFolderPlus />
                            <span>새 폴더 만들기</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 새 폴더 생성 폼 */}
            {isCreatingFolder && (
              <div className="sw-create-folder-section">
                <form onSubmit={handleCreateSubmit} className="sw-create-folder-form">
                  <IconFolderPlus />
                  <input
                    autoFocus
                    type="text"
                    placeholder="새 폴더 이름"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="sw-create-folder-input"
                  />
                  <button type="submit" className="sw-btn-sm">생성</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }} 
                    className="sw-btn-sm secondary"
                  >
                    취소
                  </button>
                </form>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="sw-multi-notice-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>일반 링크는 분석 없이 바로 저장됩니다</span>
            </div>
          </>
        ) : (
          // ===== 단일 링크 모드 =====
          <>
            <div className="sw-video-section">
              <div className="sw-input-group">
                <label className="sw-label">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="sw-input"
                />
              </div>
              <div className="sw-input-group">
                <label className="sw-label">메모 <span className="sw-optional">(선택)</span></label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요"
                  className="sw-textarea"
                  rows={2}
                />
              </div>
            </div>

            <div className="sw-path-section">
              <div className="sw-path-header">
                <span className="sw-section-label">저장 위치</span>
              </div>
              
              {/* 폴더 선택 드롭다운 (하위 폴더 탐색 지원) */}
              <div className="sw-single-folder-selector">
                <button
                  className="sw-single-folder-trigger"
                  onClick={toggleSingleDropdown}
                >
                  <IconFolder />
                  <span className="sw-folder-path-display">{getFolderPath(selectedFolderId)}</span>
                  <IconChevronDown />
                </button>
                
                {/* 드롭다운 메뉴 */}
                {showSingleDropdown && (
                  <div className="sw-single-dropdown">
                    {/* 현재 경로 표시 및 상위 이동 */}
                    {singlePath.length > 0 && (
                      <div className="sw-dropdown-nav">
                        <button
                          className="sw-dropdown-back"
                          onClick={navigateSingleUp}
                        >
                          <IconArrowLeft />
                          <span>상위로</span>
                        </button>
                        <span className="sw-dropdown-current">
                          📁 {singlePath[singlePath.length - 1].name}
                        </span>
                      </div>
                    )}
                    
                    {/* 현재 위치 선택 버튼 */}
                    <button
                      className={`sw-dropdown-item sw-dropdown-select ${
                        selectedFolderId === (singlePath.length > 0 ? singlePath[singlePath.length - 1].id : null) 
                          ? 'active' 
                          : ''
                      }`}
                      onClick={() => selectSingleFolder(
                        singlePath.length > 0 ? singlePath[singlePath.length - 1].id : null
                      )}
                    >
                      <IconCheck />
                      <span>
                        {singlePath.length > 0 
                          ? `'${singlePath[singlePath.length - 1].name}'에 저장` 
                          : '최상위에 저장'}
                      </span>
                    </button>
                    
                    {/* 하위 폴더 목록 */}
                    {getCurrentSingleFolders().length > 0 && (
                      <div className="sw-dropdown-section-label">
                        하위 폴더로 이동
                      </div>
                    )}
                    
                    {getCurrentSingleFolders().map(folder => (
                      <button
                        key={folder.id}
                        className="sw-dropdown-item sw-dropdown-folder"
                        onClick={() => {
                          if (hasChildren(folder.id)) {
                            navigateIntoSingleFolder(folder);
                          } else {
                            selectSingleFolder(folder.id);
                          }
                        }}
                      >
                        <IconFolder />
                        <span>{folder.name}</span>
                        {hasChildren(folder.id) ? (
                          <IconChevronRight />
                        ) : (
                          selectedFolderId === folder.id && <IconCheck />
                        )}
                      </button>
                    ))}
                    
                    {/* 폴더 없을 때 */}
                    {getCurrentSingleFolders().length === 0 && (
                      <div className="sw-dropdown-empty">
                        하위 폴더가 없습니다
                      </div>
                    )}
                    
                    {/* 새 폴더 만들기 */}
                    {!isCreatingFolder && (
                      <button
                        className="sw-dropdown-item sw-dropdown-new"
                        onClick={() => setIsCreatingFolder(true)}
                      >
                        <IconFolderPlus />
                        <span>새 폴더 만들기</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 새 폴더 생성 폼 */}
              {isCreatingFolder && (
                <form onSubmit={handleCreateSubmit} className="sw-new-folder-form" style={{ marginTop: '12px' }}>
                  <IconFolder />
                  <input
                    autoFocus
                    type="text"
                    placeholder="폴더 이름"
                    className="sw-new-folder-input"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <button type="submit" className="sw-btn-sm">생성</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }} 
                    className="sw-btn-sm secondary"
                  >
                    취소
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {/* 하단 버튼 */}
        <div className="sw-footer">
          <button onClick={onClose} className="sw-btn secondary">
            취소
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || (!isMultiMode && !title.trim())}
            className="sw-btn primary"
          >
            {saving 
              ? '저장 중...' 
              : isMultiMode 
                ? `${linksToSave.length}개 링크 저장하기`
                : `'${getFolderName(selectedFolderId)}'에 저장`
            }
          </button>
          {/* 저장 후 바로 AI 자동분류 페이지로 이동 */}
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/jjim?auto=1`;
              window.open(url, '_blank', 'noopener');
            }}
            className="sw-btn ghost"
            title="찜보따리에서 AI 자동분류/정리 실행 (새 탭)"
          >
            AI 자동분류 열기
          </button>
        </div>
      </div>
    </div>
  );
}
