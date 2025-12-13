import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateUserFolders } from '../utils/folderGenerator';
import Swal from 'sweetalert2';
import '../styles/folder-create-modal.css';

// 과목 목록
const SUBJECTS = [
  { id: 'kor', name: '국어', color: '#ef4444', icon: '📕' },
  { id: 'math', name: '수학', color: '#3b82f6', icon: '📘' },
  { id: 'social', name: '사회', color: '#f59e0b', icon: '📙' },
  { id: 'science', name: '과학', color: '#10b981', icon: '📗' },
  { id: 'moral', name: '도덕', color: '#8b5cf6', icon: '💜' },
  { id: 'prac', name: '실과', color: '#06b6d4', icon: '🔧' },
  { id: 'music', name: '음악', color: '#ec4899', icon: '🎵' },
  { id: 'art', name: '미술', color: '#f97316', icon: '🎨' },
  { id: 'pe', name: '체육', color: '#22c55e', icon: '⚽' },
  { id: 'eng', name: '영어', color: '#6366f1', icon: '🔤' },
  { id: 'int', name: '통합교과', color: '#14b8a6', icon: '🌈' },
];

const GRADES = [1, 2, 3, 4, 5, 6];
const SEMESTERS = [1, 2];

// 아이콘 컴포넌트
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconWand = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);

const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function FolderAutoCreateModal({ onClose, onComplete }) {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 과목 토글
  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(x => x !== subjectId)
        : [...prev, subjectId]
    );
  };

  // 전체 선택/해제
  const toggleAllSubjects = () => {
    if (selectedSubjects.length === SUBJECTS.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(SUBJECTS.map(s => s.id));
    }
  };

  // 폴더 구조 미리보기 생성
  const folderPreview = useMemo(() => {
    if (!selectedGrade) return null;

    const grade = `${selectedGrade}학년`;
    const semester = selectedSemester ? `${selectedSemester}학기` : null;
    const subjects = selectedSubjects
      .map(id => SUBJECTS.find(s => s.id === id))
      .filter(Boolean);

    return { grade, semester, subjects };
  }, [selectedGrade, selectedSemester, selectedSubjects]);

  // 폴더 생성 실행
  const handleCreate = async () => {
    if (!selectedGrade) {
      Swal.fire({
        icon: 'warning',
        title: '학년을 선택해주세요',
        confirmButtonColor: '#8b5cf6'
      });
      return;
    }

    if (selectedSubjects.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '과목을 선택해주세요',
        text: '최소 1개 이상의 과목을 선택해주세요.',
        confirmButtonColor: '#8b5cf6'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // generateUserFolders(userId, grades[], subjects[], hierarchy)
      const folderCount = await generateUserFolders(
        user.uid,
        [selectedGrade],
        selectedSubjects,
        'grade-semester-subject' // 학년 > 학기 > 과목 구조
      );

      await Swal.fire({
        icon: 'success',
        title: '폴더 생성 완료! 🎉',
        html: `<p>${folderCount}개의 폴더가 생성되었습니다.</p>`,
        confirmButtonColor: '#8b5cf6',
        timer: 2000
      });

      onComplete?.();
      onClose();
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      Swal.fire({
        icon: 'error',
        title: '오류 발생',
        text: error.message || '폴더 생성 중 문제가 발생했습니다.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fcm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fcm-modal">
        {/* 헤더 */}
        <div className="fcm-header">
          <div className="fcm-header-content">
            <span className="fcm-header-icon">📁</span>
            <div>
              <h2>폴더 자동 생성</h2>
              <p>학년, 학기, 과목을 선택하면 폴더를 자동으로 만들어 드려요</p>
            </div>
          </div>
          <button className="fcm-close-btn" onClick={onClose}>
            <IconX />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="fcm-content">
          {/* 학년 선택 */}
          <div className="fcm-section">
            <label className="fcm-label">
              <span className="fcm-label-icon">🎓</span>
              학년 선택
            </label>
            <div className="fcm-grade-grid">
              {GRADES.map(g => (
                <button
                  key={g}
                  className={`fcm-grade-btn ${selectedGrade === g ? 'selected' : ''}`}
                  onClick={() => setSelectedGrade(g)}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* 학기 선택 */}
          <div className="fcm-section">
            <label className="fcm-label">
              <span className="fcm-label-icon">📅</span>
              학기 선택 <span className="fcm-optional">(선택사항)</span>
            </label>
            <div className="fcm-semester-grid">
              <button
                className={`fcm-semester-btn ${selectedSemester === null ? 'selected' : ''}`}
                onClick={() => setSelectedSemester(null)}
              >
                전체 (1·2학기)
              </button>
              {SEMESTERS.map(s => (
                <button
                  key={s}
                  className={`fcm-semester-btn ${selectedSemester === s ? 'selected' : ''}`}
                  onClick={() => setSelectedSemester(s)}
                >
                  {s}학기
                </button>
              ))}
            </div>
          </div>

          {/* 과목 선택 */}
          <div className="fcm-section">
            <div className="fcm-subject-header">
              <label className="fcm-label">
                <span className="fcm-label-icon">📚</span>
                과목 선택
              </label>
              <button className="fcm-toggle-all" onClick={toggleAllSubjects}>
                {selectedSubjects.length === SUBJECTS.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="fcm-subject-grid">
              {SUBJECTS.map(subject => (
                <button
                  key={subject.id}
                  className={`fcm-subject-btn ${selectedSubjects.includes(subject.id) ? 'selected' : ''}`}
                  style={{ '--subject-color': subject.color }}
                  onClick={() => toggleSubject(subject.id)}
                >
                  <span className="fcm-subject-icon">{subject.icon}</span>
                  <span className="fcm-subject-name">{subject.name}</span>
                  {selectedSubjects.includes(subject.id) && (
                    <span className="fcm-subject-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 폴더 구조 미리보기 */}
          {folderPreview && selectedSubjects.length > 0 && (
            <div className="fcm-preview-section">
              <label className="fcm-label">
                <span className="fcm-label-icon">👀</span>
                폴더 구조 미리보기
              </label>
              <div className="fcm-preview">
                <div className="fcm-tree">
                  <div className="fcm-tree-item root">
                    <IconFolder />
                    <span>📂 {folderPreview.grade}</span>
                  </div>
                  
                  {folderPreview.semester ? (
                    // 특정 학기 선택 시
                    <div className="fcm-tree-branch">
                      <div className="fcm-tree-item semester">
                        <span className="fcm-tree-line">└</span>
                        <IconFolder />
                        <span>📁 {folderPreview.semester}</span>
                      </div>
                      <div className="fcm-tree-subjects">
                        {folderPreview.subjects.map((sub, idx) => (
                          <div key={sub.id} className="fcm-tree-item subject">
                            <span className="fcm-tree-line">
                              {idx === folderPreview.subjects.length - 1 ? '└' : '├'}
                            </span>
                            <span className="fcm-tree-subject-dot" style={{ background: sub.color }}></span>
                            <span>{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // 전체 학기 선택 시
                    SEMESTERS.map((sem, semIdx) => (
                      <div key={sem} className="fcm-tree-branch">
                        <div className="fcm-tree-item semester">
                          <span className="fcm-tree-line">
                            {semIdx === SEMESTERS.length - 1 ? '└' : '├'}
                          </span>
                          <IconFolder />
                          <span>📁 {sem}학기</span>
                        </div>
                        <div className="fcm-tree-subjects">
                          {folderPreview.subjects.slice(0, 3).map((sub, idx) => (
                            <div key={sub.id} className="fcm-tree-item subject">
                              <span className="fcm-tree-line">
                                {idx === Math.min(2, folderPreview.subjects.length - 1) ? '└' : '├'}
                              </span>
                              <span className="fcm-tree-subject-dot" style={{ background: sub.color }}></span>
                              <span>{sub.name}</span>
                            </div>
                          ))}
                          {folderPreview.subjects.length > 3 && (
                            <div className="fcm-tree-item more">
                              <span className="fcm-tree-line">└</span>
                              <span>... 외 {folderPreview.subjects.length - 3}개</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 선택 요약 */}
          <div className="fcm-summary">
            <div className="fcm-summary-item">
              <span className="fcm-summary-label">학년</span>
              <span className="fcm-summary-value">
                {selectedGrade ? `${selectedGrade}학년` : '미선택'}
              </span>
            </div>
            <div className="fcm-summary-divider"></div>
            <div className="fcm-summary-item">
              <span className="fcm-summary-label">학기</span>
              <span className="fcm-summary-value">
                {selectedSemester ? `${selectedSemester}학기` : '전체'}
              </span>
            </div>
            <div className="fcm-summary-divider"></div>
            <div className="fcm-summary-item">
              <span className="fcm-summary-label">과목</span>
              <span className="fcm-summary-value">
                {selectedSubjects.length > 0 
                  ? `${selectedSubjects.length}개 선택`
                  : '미선택'}
              </span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="fcm-footer">
          <button className="fcm-btn-cancel" onClick={onClose}>
            취소
          </button>
          <button
            className="fcm-btn-create"
            onClick={handleCreate}
            disabled={isSubmitting || !selectedGrade || selectedSubjects.length === 0}
          >
            {isSubmitting ? (
              <>
                <span className="fcm-spinner"></span>
                생성 중...
              </>
            ) : (
              <>
                <IconWand />
                폴더 생성하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

