import { useState, useEffect, useRef } from 'react';
import '../styles/cascading-path.css';

/**
 * 계층형 경로 선택기 (Cascading Path Selector)
 * 브레드크럼 스타일로 폴더 경로를 선택할 수 있는 컴포넌트
 */

// 아이콘 컴포넌트들
const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFolderPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/**
 * CascadingPathSelector
 * @param {Array} folders - 전체 폴더 목록 [{id, name, parentId, ...}]
 * @param {string} selectedFolderId - 현재 선택된 폴더 ID
 * @param {string} curriculumPath - AI가 추천한 교육과정 경로 (표시용)
 * @param {function} onSelect - 폴더 선택 시 콜백 (folderId) => void
 * @param {function} onCreateFolder - 새 폴더 생성 콜백 (name, parentId) => void
 * @param {boolean} showCreateNew - 새 폴더 만들기 옵션 표시 여부
 */
export default function CascadingPathSelector({
  folders = [],
  selectedFolderId,
  curriculumPath,
  onSelect,
  onCreateFolder,
  showCreateNew = true
}) {
  const [path, setPath] = useState([]); // 현재 선택된 경로 배열
  const [activeDropdown, setActiveDropdown] = useState(null); // 열린 드롭다운 인덱스
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const dropdownRefs = useRef({});

  // 폴더 ID로 경로 구축
  const buildPathFromFolderId = (folderId) => {
    if (!folderId) return [{ id: 'root', name: '내 찜보따리', parentId: null }];
    
    const pathArray = [];
    let currentId = folderId;
    let safety = 0;
    
    while (currentId && safety < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        pathArray.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
      safety++;
    }
    
    // 루트 추가
    pathArray.unshift({ id: 'root', name: '내 찜보따리', parentId: null });
    
    return pathArray;
  };

  // 특정 parentId의 하위 폴더 가져오기
  const getChildFolders = (parentId) => {
    if (parentId === 'root') {
      return folders.filter(f => !f.parentId || f.parentId === 'root');
    }
    return folders.filter(f => f.parentId === parentId);
  };

  // 학년 폴더 여부
  const isGradeFolder = (name = '') => /학년$/.test(name.trim());

  // 학년 폴더 아래에 기본 학기 폴더가 없으면 빠른 생성 액션 제공
  const renderSemesterQuickCreate = (parent, children) => {
    if (!onCreateFolder) return null;
    if (!isGradeFolder(parent?.name)) return null;

    const hasS1 = children.some(c => c.name === '1학기');
    const hasS2 = children.some(c => c.name === '2학기');

    if (hasS1 && hasS2) return null;

    return (
      <div className="cps-semester-quick-create">
        {!hasS1 && (
          <button
            className="cps-dropdown-item"
            onClick={() => onCreateFolder('1학기', parent.id === 'root' ? null : parent.id)}
          >
            <IconFolder />
            <span>1학기 만들기</span>
          </button>
        )}
        {!hasS2 && (
          <button
            className="cps-dropdown-item"
            onClick={() => onCreateFolder('2학기', parent.id === 'root' ? null : parent.id)}
          >
            <IconFolder />
            <span>2학기 만들기</span>
          </button>
        )}
      </div>
    );
  };

  // 🆕 AI 추천 경로를 기존 폴더와 매칭하여 경로 구축
  const matchCurriculumPathToFolders = (pathString) => {
    if (!pathString) return null;
    
    // 경로 문자열을 배열로 분해 (예: "6학년/실과/건강" -> ["6학년", "실과", "건강"])
    const pathSegments = pathString
      .split('/')
      .filter(p => p && p !== '내 찜보따리' && p !== '찜보따리')
      .map(p => p.trim());
    
    if (pathSegments.length === 0) return null;
    
    // 기존 폴더에서 매칭되는 경로 찾기
    let matchedPath = [{ id: 'root', name: '내 찜보따리', parentId: null }];
    let lastMatchedIndex = -1;
    let currentParentId = 'root';
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i].toLowerCase();
      const children = getChildFolders(currentParentId);
      
      // 이름이 일치하는 폴더 찾기
      const matchedFolder = children.find(f => 
        f.name.toLowerCase() === segment ||
        f.name.toLowerCase().includes(segment) ||
        segment.includes(f.name.toLowerCase())
      );
      
      if (matchedFolder) {
        matchedPath.push(matchedFolder);
        currentParentId = matchedFolder.id;
        lastMatchedIndex = i;
      } else {
        break; // 더 이상 매칭되는 폴더 없음
      }
    }
    
    // 매칭되지 않은 나머지 경로 (새 폴더로 생성할 부분)
    const unmatchedSegments = pathSegments.slice(lastMatchedIndex + 1);
    const newFolderSuggestion = unmatchedSegments.length > 0 ? unmatchedSegments.join('/') : null;
    
    return {
      matchedPath,
      lastMatchedFolderId: matchedPath.length > 1 ? matchedPath[matchedPath.length - 1].id : 'root',
      newFolderSuggestion,
      isFullMatch: unmatchedSegments.length === 0,
    };
  };

  // 초기화: selectedFolderId가 바뀌면 경로 재구축
  useEffect(() => {
    const newPath = buildPathFromFolderId(selectedFolderId);
    setPath(newPath);
  }, [selectedFolderId, folders]);

  // 🆕 AI 추천 경로로 자동 초기화 (curriculumPath가 있고, selectedFolderId가 없을 때)
  useEffect(() => {
    if (curriculumPath && !selectedFolderId) {
      const matchResult = matchCurriculumPathToFolders(curriculumPath);
      if (matchResult) {
        setPath(matchResult.matchedPath);
        
        // 새 폴더 이름 자동 입력
        if (matchResult.newFolderSuggestion) {
          setNewFolderName(matchResult.newFolderSuggestion);
        }
        
        console.log('🎯 [CPS] AI 경로 자동 매칭:', {
          추천경로: curriculumPath,
          매칭된경로: matchResult.matchedPath.map(p => p.name).join('/'),
          새폴더제안: matchResult.newFolderSuggestion,
        });
      }
    }
  }, [curriculumPath, folders]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdown !== null) {
        const ref = dropdownRefs.current[activeDropdown];
        if (ref && !ref.contains(e.target)) {
          setActiveDropdown(null);
          setIsCreatingNew(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // 드롭다운 토글
  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
    setIsCreatingNew(false);
    setNewFolderName('');
  };

  // 폴더 선택 (드롭다운에서)
  const handleSelectFolder = (folder, levelIndex) => {
    // 새 경로 구축: 현재 레벨까지 유지 + 새로 선택한 폴더
    const newPath = [...path.slice(0, levelIndex + 1), folder];
    setPath(newPath);
    setActiveDropdown(null);
    
    // 마지막 선택된 폴더 ID를 콜백으로 전달
    onSelect(folder.id === 'root' ? null : folder.id);
  };

  // 새 폴더 생성
  const handleCreateNewFolder = (parentId) => {
    if (!newFolderName.trim()) return;
    
    if (onCreateFolder) {
      onCreateFolder(newFolderName.trim(), parentId === 'root' ? null : parentId);
    }
    
    setNewFolderName('');
    setIsCreatingNew(false);
    setActiveDropdown(null);
  };

  // 경로의 마지막 폴더 (현재 선택된 위치)
  const currentFolder = path[path.length - 1];
  const currentChildren = getChildFolders(currentFolder?.id || 'root');

  return (
    <div className="cascading-path-selector">
      {/* AI 추천 경로 표시 */}
      {curriculumPath && (
        <div className="cps-curriculum-hint">
          <span className="cps-hint-icon">📚</span>
          <span className="cps-hint-text">추천: {curriculumPath}</span>
        </div>
      )}
      
      {/* 브레드크럼 경로 */}
      <div className="cps-breadcrumb">
        {path.map((item, index) => {
          const children = getChildFolders(item.id);
          const hasChildren = children.length > 0 || showCreateNew;
          const isLast = index === path.length - 1;
          
          return (
            <div 
              key={`${item.id}-${index}`} 
              className="cps-crumb-wrapper"
              ref={el => dropdownRefs.current[index] = el}
            >
              {/* 구분자 */}
              {index > 0 && (
                <span className="cps-separator">
                  <IconChevronRight />
                </span>
              )}
              
              {/* 크럼 버튼 */}
              <button
                className={`cps-crumb-btn ${isLast ? 'active' : ''} ${activeDropdown === index ? 'open' : ''}`}
                onClick={() => hasChildren && toggleDropdown(index)}
              >
                <IconFolder />
                <span className="cps-crumb-name">{item.name}</span>
                {hasChildren && <IconChevronDown />}
              </button>
              
              {/* 드롭다운 */}
              {activeDropdown === index && (
                <div className="cps-dropdown">
                  <div className="cps-dropdown-header">
                    {index === 0 ? '폴더 선택' : `${item.name} 하위`}
                  </div>
                  
                  <div className="cps-dropdown-list">
                    {children.length === 0 && !showCreateNew ? (
                      <div className="cps-dropdown-empty">하위 폴더 없음</div>
                    ) : (
                      <>
                        {renderSemesterQuickCreate(item, children)}
                        {children.map(child => (
                          <button
                            key={child.id}
                            className={`cps-dropdown-item ${path.some(p => p.id === child.id) ? 'selected' : ''}`}
                            onClick={() => handleSelectFolder(child, index)}
                          >
                            <IconFolder />
                            <span>{child.name}</span>
                            {path.some(p => p.id === child.id) && (
                              <span className="cps-check"><IconCheck /></span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                  
                  {/* 새 폴더 만들기 */}
                  {showCreateNew && (
                    <div className="cps-dropdown-footer">
                      {isCreatingNew ? (
                        <div className="cps-new-folder-form">
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="새 폴더 이름"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateNewFolder(item.id);
                              if (e.key === 'Escape') setIsCreatingNew(false);
                            }}
                          />
                          <button 
                            className="cps-create-btn"
                            onClick={() => handleCreateNewFolder(item.id)}
                            disabled={!newFolderName.trim()}
                          >
                            생성
                          </button>
                        </div>
                      ) : (
                        <button
                          className="cps-dropdown-new"
                          onClick={() => setIsCreatingNew(true)}
                        >
                          <IconFolderPlus />
                          <span>새 폴더 만들기</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* 마지막에 하위 폴더 추가 옵션 (현재 선택된 폴더에 하위가 있으면) */}
        {currentChildren.length > 0 && (
          <div 
            className="cps-crumb-wrapper"
            ref={el => dropdownRefs.current['last'] = el}
          >
            <span className="cps-separator">
              <IconChevronRight />
            </span>
            <button
              className={`cps-crumb-btn placeholder ${activeDropdown === 'last' ? 'open' : ''}`}
              onClick={() => toggleDropdown('last')}
            >
              <span className="cps-crumb-name">하위 폴더 선택...</span>
              <IconChevronDown />
            </button>
            
            {activeDropdown === 'last' && (
              <div className="cps-dropdown">
                <div className="cps-dropdown-header">
                  {currentFolder?.name} 하위 폴더
                </div>
                <div className="cps-dropdown-list">
                  {currentChildren.map(child => (
                    <button
                      key={child.id}
                      className="cps-dropdown-item"
                      onClick={() => handleSelectFolder(child, path.length - 1)}
                    >
                      <IconFolder />
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
                {showCreateNew && (
                  <div className="cps-dropdown-footer">
                    {isCreatingNew ? (
                      <div className="cps-new-folder-form">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="새 폴더 이름"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateNewFolder(currentFolder?.id);
                            if (e.key === 'Escape') setIsCreatingNew(false);
                          }}
                        />
                        <button 
                          className="cps-create-btn"
                          onClick={() => handleCreateNewFolder(currentFolder?.id)}
                          disabled={!newFolderName.trim()}
                        >
                          생성
                        </button>
                      </div>
                    ) : (
                      <button
                        className="cps-dropdown-new"
                        onClick={() => setIsCreatingNew(true)}
                      >
                        <IconFolderPlus />
                        <span>여기에 새 폴더 만들기</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


