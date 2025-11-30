import { useAuth } from '../context/AuthContext';

export default function Header({ mode, onModeChange }) {
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
