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

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function SaveWizard({ videoData, user, onClose, onSuccess }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [path, setPath] = useState([]);
  const [recommendedPath, setRecommendedPath] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [title, setTitle] = useState(videoData?.title || "");
  const [memo, setMemo] = useState("");

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

  // AI 경로 추천 알고리즘
  useEffect(() => {
    if (!videoData || folders.length === 0) return;
    
    const findBestPath = () => {
      const foundPath = [];
      const textToSearch = (title || videoData.title || '').toLowerCase();
      
      const findMatch = (parentId) => {
        const children = folders.filter(item => 
          parentId === 'root' ? !item.parentId : item.parentId === parentId
        );
        return children.find(child => {
          const folderName = child.name.toLowerCase();
          return textToSearch.includes(folderName) || folderName.includes(textToSearch.split(' ')[0]);
        });
      };

      let currentId = 'root';
      let nextMatch = findMatch('root');
      
      while (nextMatch) {
        foundPath.push(nextMatch);
        currentId = nextMatch.id;
        nextMatch = findMatch(currentId);
      }
      
      setRecommendedPath(foundPath);
    };
    
    findBestPath();
  }, [videoData, folders, title]);

  // 현재 위치의 하위 폴더들 가져오기
  const getChildren = (parentId) => {
    if (parentId === 'root') {
      return folders.filter(f => !f.parentId);
    }
    return folders.filter(f => f.parentId === parentId);
  };

  const currentParentId = path.length > 0 ? path[path.length - 1].id : 'root';
  const currentOptions = getChildren(currentParentId);

  // 폴더 선택 핸들러
  const handleSelect = (item) => {
    setPath([...path, item]);
  };

  // 새 폴더 생성 핸들러
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      const parentId = currentParentId === 'root' ? null : currentParentId;
      await createFolder({ 
        user, 
        name: newFolderName,
        parentId
      });
      
      await loadFolders();
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      alert('폴더 생성에 실패했습니다.');
    }
  };

  // 브레드크럼 클릭 핸들러
  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setPath([]);
    } else {
      setPath(path.slice(0, index + 1));
    }
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    if (path.length > 0) {
      setPath(path.slice(0, -1));
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    setSaving(true);
    try {
      const folderId = currentParentId === 'root' ? null : currentParentId;
      
      await addLinkDirectly({
        user,
        videoUrl: videoData.url,
        title: title.trim(),
        memo,
        folderId,
        tags: []
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 추천 폴더인지 확인
  const isRecommended = (itemId) => recommendedPath.some(rp => rp.id === itemId);

  const currentLocationName = path.length > 0 ? path[path.length - 1].name : '최상위';

  if (loading) {
    return (
      <div className="sw-overlay">
        <div className="sw-modal">
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
      <div className="sw-modal">
        {/* 헤더 */}
        <div className="sw-header">
          <h2 className="sw-title">찜보따리 저장하기</h2>
          <button onClick={onClose} className="sw-close-btn">
            <IconX />
          </button>
        </div>

        {/* 영상 정보 */}
        <div className="sw-video-section">
          <div className="sw-input-group">
            <label className="sw-label">영상 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="영상 제목을 입력하세요"
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

        {/* 경로 표시 */}
        <div className="sw-path-section">
          <div className="sw-path-header">
            <span className="sw-section-label">저장 위치</span>
            {path.length > 0 && (
              <button onClick={handleGoBack} className="sw-back-link">
                <IconArrowLeft /> 상위로
              </button>
            )}
          </div>
          <div className="sw-breadcrumb">
            <button 
              onClick={() => handleBreadcrumbClick(-1)} 
              className={`sw-crumb ${path.length === 0 ? 'active' : ''}`}
            >
              <IconHome /> 최상위
            </button>
            {path.map((p, idx) => (
              <span key={p.id} className="sw-crumb-group">
                <IconChevronRight />
                <button 
                  onClick={() => handleBreadcrumbClick(idx)} 
                  className={`sw-crumb ${idx === path.length - 1 ? 'active' : ''}`}
                >
                  {p.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 폴더 목록 */}
        <div className="sw-folders-section">
          <div className="sw-folders-list">
            {/* 새 폴더 만들기 */}
            {isCreatingFolder ? (
              <form onSubmit={handleCreateSubmit} className="sw-new-folder-form">
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
                <button type="button" onClick={() => setIsCreatingFolder(false)} className="sw-btn-sm secondary">취소</button>
              </form>
            ) : (
              <button onClick={() => setIsCreatingFolder(true)} className="sw-add-folder-btn">
                <IconFolderPlus />
                <span>새 폴더</span>
              </button>
            )}

            {/* 폴더 아이템들 */}
            {currentOptions.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`sw-folder-item ${isRecommended(item.id) ? 'recommended' : ''}`}
              >
                <div className="sw-folder-info">
                  <IconFolder />
                  <span className="sw-folder-name">{item.name}</span>
                </div>
                {isRecommended(item.id) && (
                  <span className="sw-recommended-tag">
                    <IconStar /> 추천
                  </span>
                )}
              </button>
            ))}

            {/* 빈 상태 */}
            {currentOptions.length === 0 && !isCreatingFolder && (
              <div className="sw-empty">
                하위 폴더가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="sw-footer">
          <button onClick={onClose} className="sw-btn secondary">
            취소
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || !title.trim()}
            className="sw-btn primary"
          >
            {saving ? '저장 중...' : `'${currentLocationName}'에 저장`}
          </button>
        </div>
      </div>
    </div>
  );
}
