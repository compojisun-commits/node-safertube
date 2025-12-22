import { useAuth } from '../context/AuthContext';

// 설정 아이콘
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function Header({ mode, onModeChange, onSettingsClick }) {
  const { user, loginWithGoogle, logout } = useAuth();

  const navItems = [
    { id: 'analyze', label: '영상분석' },
    { id: 'recommend', label: '수업추천' },
    { id: 'jjim', label: '찜보따리' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        {/* 로고 */}
        <div 
          className="header-logo" 
          onClick={() => onModeChange('analyze')}
        >
          <img src="/logo_large.png" alt="튜브링" className="header-logo-img" />
          <span className="header-logo-text">튜브링</span>
        </div>

        {/* 네비게이션 - 가운데 정렬 */}
        <nav className="header-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`nav-item ${mode === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* 오른쪽 버튼들 */}
        <div className="header-actions">
          {user ? (
            <>
              {/* 설정 버튼 */}
              <button 
                className="btn-settings"
                onClick={onSettingsClick}
                title="내 설정 (학년/과목)"
              >
                <IconSettings />
              </button>
              <button 
                className="user-profile"
                onClick={() => onModeChange('history')}
                title="내 히스토리"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="user-name">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
              <button className="btn-logout" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="btn-signup" onClick={loginWithGoogle}>
                회원가입
              </button>
              <button className="btn-login" onClick={loginWithGoogle}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
