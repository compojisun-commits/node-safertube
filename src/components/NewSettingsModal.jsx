import { useState, useEffect } from 'react';
import '../styles/new-settings.css';

// 시작 페이지 옵션
const LANDING_PAGE_OPTIONS = [
  { 
    id: 'analyze', 
    name: '영상 분석', 
    icon: '🔍',
    description: '유튜브 영상의 안전성을 분석해요',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  { 
    id: 'recommend', 
    name: '수업 추천', 
    icon: '📚',
    description: '교육과정에 맞는 영상을 추천해요',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  { 
    id: 'jjim', 
    name: '찜보따리', 
    icon: '🎒',
    description: '저장한 영상을 관리해요',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
];

// 찜보따리 뷰 모드 옵션
const JJIM_VIEW_OPTIONS = [
  {
    id: 'folder',
    name: '폴더뷰',
    icon: '📁',
    description: '폴더로 정리된 목록',
    visual: (
      <div className="view-preview folder">
        <div className="preview-folder"><span>📂</span></div>
        <div className="preview-folder"><span>📂</span></div>
        <div className="preview-folder"><span>📂</span></div>
      </div>
    )
  },
  {
    id: 'list',
    name: '리스트뷰',
    icon: '📋',
    description: '한눈에 보는 목록',
    visual: (
      <div className="view-preview list">
        <div className="preview-item"></div>
        <div className="preview-item"></div>
        <div className="preview-item"></div>
      </div>
    )
  },
  {
    id: 'kanban',
    name: '칸반보드',
    icon: '📊',
    description: '드래그로 관리하는 보드',
    visual: (
      <div className="view-preview kanban">
        <div className="preview-column"></div>
        <div className="preview-column"></div>
        <div className="preview-column"></div>
      </div>
    )
  },
];

// 아이콘 컴포넌트
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function NewSettingsModal({ isOpen, onClose }) {
  const [landingPage, setLandingPage] = useState('analyze');
  const [jjimViewMode, setJjimViewMode] = useState('folder');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState({ landingPage: 'analyze', jjimViewMode: 'folder' });

  // 저장된 설정 불러오기
  useEffect(() => {
    if (isOpen) {
      const savedLanding = localStorage.getItem('default_landing_page') || 'analyze';
      const savedView = localStorage.getItem('default_jjim_view') || 'folder';
      
      if (LANDING_PAGE_OPTIONS.some(opt => opt.id === savedLanding)) {
        setLandingPage(savedLanding);
      }
      if (JJIM_VIEW_OPTIONS.some(opt => opt.id === savedView)) {
        setJjimViewMode(savedView);
      }
      
      setInitialSettings({ landingPage: savedLanding, jjimViewMode: savedView });
    }
  }, [isOpen]);

  // 변경 감지
  useEffect(() => {
    const changed = landingPage !== initialSettings.landingPage || 
                   jjimViewMode !== initialSettings.jjimViewMode;
    setHasChanges(changed);
  }, [landingPage, jjimViewMode, initialSettings]);

  // 설정 저장
  const handleSave = () => {
    localStorage.setItem('default_landing_page', landingPage);
    localStorage.setItem('default_jjim_view', jjimViewMode);
    setInitialSettings({ landingPage, jjimViewMode });
    setHasChanges(false);
    onClose();
  };

  // 모달 닫기 (배경 클릭)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedLanding = LANDING_PAGE_OPTIONS.find(o => o.id === landingPage);
  const selectedView = JJIM_VIEW_OPTIONS.find(o => o.id === jjimViewMode);

  return (
    <div className="nsm-overlay" onClick={handleOverlayClick}>
      <div className="nsm-modal">
        {/* 헤더 */}
        <div className="nsm-header">
          <div className="nsm-header-content">
            <div className="nsm-header-icon">
              <IconSettings />
            </div>
            <div>
              <h2>설정</h2>
              <p>나만의 튜브링을 만들어보세요</p>
            </div>
          </div>
          <button className="nsm-close-btn" onClick={onClose}>
            <IconX />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="nsm-content">
          {/* 시작 페이지 설정 */}
          <div className="nsm-section">
            <div className="nsm-section-header">
              <div className="nsm-section-title">
                <span className="nsm-section-icon">🏠</span>
                <h3>시작 페이지</h3>
              </div>
              <p>앱을 켤 때 가장 먼저 보고 싶은 화면은?</p>
            </div>
            
            <div className="nsm-card-grid">
              {LANDING_PAGE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  className={`nsm-card ${landingPage === option.id ? 'selected' : ''}`}
                  onClick={() => setLandingPage(option.id)}
                >
                  <div 
                    className="nsm-card-icon"
                    style={{ background: option.gradient }}
                  >
                    {option.icon}
                  </div>
                  <div className="nsm-card-name">{option.name}</div>
                  {landingPage === option.id && (
                    <div className="nsm-card-check">
                      <IconCheck />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 찜보따리 뷰 모드 설정 (시작 페이지가 찜보따리일 때 강조) */}
          <div className={`nsm-section ${landingPage === 'jjim' ? 'highlighted' : ''}`}>
            <div className="nsm-section-header">
              <div className="nsm-section-title">
                <span className="nsm-section-icon">👀</span>
                <h3>찜보따리 보기 방식</h3>
                {landingPage === 'jjim' && (
                  <span className="nsm-badge">시작 화면</span>
                )}
              </div>
              <p>찜보따리를 열 때 어떤 화면으로 볼까요?</p>
            </div>
            
            <div className="nsm-view-options">
              {JJIM_VIEW_OPTIONS.map(option => (
                <button
                  key={option.id}
                  className={`nsm-view-card ${jjimViewMode === option.id ? 'selected' : ''}`}
                  onClick={() => setJjimViewMode(option.id)}
                >
                  <div className="nsm-view-visual">
                    {option.visual}
                  </div>
                  <div className="nsm-view-info">
                    <span className="nsm-view-icon">{option.icon}</span>
                    <span className="nsm-view-name">{option.name}</span>
                  </div>
                  {jjimViewMode === option.id && (
                    <div className="nsm-view-check">
                      <IconCheck />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 현재 설정 미리보기 */}
          <div className="nsm-preview-box">
            <div className="nsm-preview-title">✨ 앱 시작 시</div>
            <div className="nsm-preview-flow">
              <div 
                className="nsm-preview-item"
                style={{ background: selectedLanding?.gradient }}
              >
                <span>{selectedLanding?.icon}</span>
                <span>{selectedLanding?.name}</span>
              </div>
              
              {landingPage === 'jjim' && (
                <>
                  <IconChevronRight />
                  <div className="nsm-preview-item view">
                    <span>{selectedView?.icon}</span>
                    <span>{selectedView?.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="nsm-footer">
          <button className="nsm-btn-cancel" onClick={onClose}>
            취소
          </button>
          <button 
            className={`nsm-btn-save ${!hasChanges ? 'no-changes' : ''}`}
            onClick={handleSave}
          >
            {hasChanges ? '💾 저장하기' : '✓ 저장됨'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 설정 버튼 컴포넌트 (트리거용)
export function SettingsButton({ onClick }) {
  return (
    <button className="nsm-trigger-btn" onClick={onClick} title="설정">
      <IconSettings />
    </button>
  );
}
