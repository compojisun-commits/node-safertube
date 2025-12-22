import { useState } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { generateUserFolders } from '../utils/folderGenerator';
import Swal from 'sweetalert2';
import '../styles/onboarding.css';

const SUBJECTS = [
  { id: 'kor', name: '국어', color: '#ef4444' },
  { id: 'math', name: '수학', color: '#3b82f6' },
  { id: 'soc', name: '사회', color: '#f59e0b' },
  { id: 'sci', name: '과학', color: '#10b981' },
  { id: 'moral', name: '도덕', color: '#8b5cf6' },
  { id: 'prac', name: '실과', color: '#06b6d4' },
  { id: 'music', name: '음악', color: '#ec4899' },
  { id: 'art', name: '미술', color: '#f97316' },
  { id: 'pe', name: '체육', color: '#22c55e' },
  { id: 'eng', name: '영어', color: '#6366f1' },
];

const GRADES = [1, 2, 3, 4, 5, 6];

// 폴더 계층 구조 옵션
const FOLDER_HIERARCHY_OPTIONS = [
  { 
    id: 'grade-semester-subject', 
    name: '학년 > 학기 > 과목', 
    example: '6학년 > 1학기 > 국어 > 단원',
    icon: '📚'
  },
  { 
    id: 'grade-subject-semester', 
    name: '학년 > 과목 > 학기', 
    example: '6학년 > 국어 > 1학기 > 단원',
    icon: '📖'
  },
  { 
    id: 'grade-subject', 
    name: '학년 > 과목 (학기 없음)', 
    example: '6학년 > 국어 > 단원',
    icon: '📁'
  },
];

export default function OnboardingModal({ onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null); // 'homeroom' | 'subject'
  const [grade, setGrade] = useState(null); // 담임용 - 단일 학년
  const [targetGrades, setTargetGrades] = useState([]); // 전담용 - 복수 학년
  const [targetSubjects, setTargetSubjects] = useState([]); // 선택된 과목들
  const [folderHierarchy, setFolderHierarchy] = useState('grade-semester-subject'); // 폴더 계층 구조
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 담임 선택 시 모든 과목 자동 선택
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'homeroom') {
      setTargetSubjects(SUBJECTS.map(s => s.id));
    } else {
      setTargetSubjects([]);
    }
    setStep(2);
  };

  // 학년 토글 (전담용)
  const toggleGrade = (g) => {
    setTargetGrades(prev => 
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  // 과목 토글
  const toggleSubject = (subjectId) => {
    setTargetSubjects(prev =>
      prev.includes(subjectId) 
        ? prev.filter(x => x !== subjectId) 
        : [...prev, subjectId]
    );
  };

  // 전체 선택/해제 (담임용 과목)
  const toggleAllSubjects = () => {
    if (targetSubjects.length === SUBJECTS.length) {
      setTargetSubjects([]);
    } else {
      setTargetSubjects(SUBJECTS.map(s => s.id));
    }
  };

  // 완료 처리
  const handleComplete = async () => {
    // 유효성 검사
    if (role === 'homeroom' && !grade) {
      Swal.fire({
        icon: 'warning',
        title: '학년을 선택해주세요',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (role === 'subject' && targetGrades.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '담당 학년을 선택해주세요',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (targetSubjects.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '담당 과목을 선택해주세요',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 사용자 프로필 저장
      const userData = {
        school_level: 'elementary',
        role,
        grade: role === 'homeroom' ? grade : null,
        target_grades: role === 'subject' ? targetGrades.sort((a, b) => a - b) : [grade],
        target_subjects: targetSubjects,
        folder_hierarchy: folderHierarchy,
        onboardingCompleted: true,
        onboardingCompletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      // 2. 폴더 자동 생성 (선택한 계층 구조로)
      const grades = role === 'homeroom' ? [grade] : targetGrades;
      await generateUserFolders(user.uid, grades, targetSubjects, folderHierarchy);

      // 3. 완료 알림
      await Swal.fire({
        icon: 'success',
        title: '설정 완료! 🎉',
        html: `
          <p style="margin-bottom: 10px;">
            ${role === 'homeroom' ? `${grade}학년 담임` : `${targetGrades.join(', ')}학년 전담`} 선생님으로 설정되었습니다.
          </p>
          <p style="color: #666; font-size: 14px;">
            맞춤 폴더가 자동으로 생성되었습니다!
          </p>
        `,
        confirmButtonColor: '#10b981',
        timer: 3000
      });

      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      Swal.fire({
        icon: 'error',
        title: '오류 발생',
        text: '설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* 헤더 */}
        <div className="onboarding-header">
          <div className="onboarding-logo">📚</div>
          <h2>튜브링에 오신 것을 환영합니다!</h2>
          <p>맞춤 설정을 위해 몇 가지만 알려주세요</p>
        </div>

        {/* Step 인디케이터 */}
        <div className="onboarding-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>역할 선택</p>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>세부 설정</p>
          </div>
        </div>

        {/* Step 1: 역할 선택 */}
        {step === 1 && (
          <div className="onboarding-content">
            <h3>어떤 역할로 사용하시나요?</h3>
            <div className="role-cards">
              <button 
                className="role-card"
                onClick={() => handleRoleSelect('homeroom')}
              >
                <div className="role-icon">👩‍🏫</div>
                <h4>담임 교사</h4>
                <p>한 학급의 모든 과목을 담당해요</p>
                <ul>
                  <li>✓ 담당 학년 하나 선택</li>
                  <li>✓ 전 과목 폴더 자동 생성</li>
                </ul>
              </button>
              <button 
                className="role-card"
                onClick={() => handleRoleSelect('subject')}
              >
                <div className="role-icon">📖</div>
                <h4>교과 전담</h4>
                <p>특정 과목을 여러 학년에 가르쳐요</p>
                <ul>
                  <li>✓ 담당 학년 복수 선택</li>
                  <li>✓ 담당 과목만 폴더 생성</li>
                </ul>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 세부 설정 */}
        {step === 2 && (
          <div className="onboarding-content">
            {/* 담임 교사 - 학년 선택 */}
            {role === 'homeroom' && (
              <>
                <h3>담당 학년을 선택해주세요</h3>
                <div className="grade-grid single">
                  {GRADES.map(g => (
                    <button
                      key={g}
                      className={`grade-btn ${grade === g ? 'selected' : ''}`}
                      onClick={() => setGrade(g)}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>

                <div className="subject-section">
                  <div className="subject-header">
                    <h4>담당 과목</h4>
                    <button 
                      className="toggle-all-btn"
                      onClick={toggleAllSubjects}
                    >
                      {targetSubjects.length === SUBJECTS.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                  <p className="subject-hint">담임 선생님은 기본적으로 전 과목이 선택됩니다. 필요에 따라 조정하세요.</p>
                  <div className="subject-grid">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject.id}
                        className={`subject-btn ${targetSubjects.includes(subject.id) ? 'selected' : ''}`}
                        style={{ '--subject-color': subject.color }}
                        onClick={() => toggleSubject(subject.id)}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 폴더 계층 구조 선택 */}
                <div className="hierarchy-section">
                  <h4>📂 폴더 구조 선택</h4>
                  <p className="hierarchy-hint">자료를 정리할 폴더 구조를 선택하세요. 나중에 설정에서 변경할 수 있어요.</p>
                  <div className="hierarchy-options">
                    {FOLDER_HIERARCHY_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        className={`hierarchy-option ${folderHierarchy === option.id ? 'selected' : ''}`}
                        onClick={() => setFolderHierarchy(option.id)}
                      >
                        <div className="hierarchy-option-header">
                          <span className="hierarchy-icon">{option.icon}</span>
                          <span className="hierarchy-name">{option.name}</span>
                          {folderHierarchy === option.id && <span className="hierarchy-check">✓</span>}
                        </div>
                        <div className="hierarchy-example">{option.example}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 교과 전담 - 복수 학년/과목 선택 */}
            {role === 'subject' && (
              <>
                <h3>담당 학년을 선택해주세요 (복수 선택 가능)</h3>
                <div className="grade-grid">
                  {GRADES.map(g => (
                    <button
                      key={g}
                      className={`grade-btn ${targetGrades.includes(g) ? 'selected' : ''}`}
                      onClick={() => toggleGrade(g)}
                    >
                      {g}학년
                      {targetGrades.includes(g) && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>

                <div className="subject-section">
                  <h4>담당 과목을 선택해주세요 (복수 선택 가능)</h4>
                  <div className="subject-grid">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject.id}
                        className={`subject-btn ${targetSubjects.includes(subject.id) ? 'selected' : ''}`}
                        style={{ '--subject-color': subject.color }}
                        onClick={() => toggleSubject(subject.id)}
                      >
                        {subject.name}
                        {targetSubjects.includes(subject.id) && <span className="check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 폴더 계층 구조 선택 */}
                <div className="hierarchy-section">
                  <h4>📂 폴더 구조 선택</h4>
                  <p className="hierarchy-hint">자료를 정리할 폴더 구조를 선택하세요. 나중에 설정에서 변경할 수 있어요.</p>
                  <div className="hierarchy-options">
                    {FOLDER_HIERARCHY_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        className={`hierarchy-option ${folderHierarchy === option.id ? 'selected' : ''}`}
                        onClick={() => setFolderHierarchy(option.id)}
                      >
                        <div className="hierarchy-option-header">
                          <span className="hierarchy-icon">{option.icon}</span>
                          <span className="hierarchy-name">{option.name}</span>
                          {folderHierarchy === option.id && <span className="hierarchy-check">✓</span>}
                        </div>
                        <div className="hierarchy-example">{option.example}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 선택 요약 */}
            <div className="selection-summary">
              <h4>선택 요약</h4>
              <div className="summary-content">
                <div className="summary-item">
                  <span className="label">역할:</span>
                  <span className="value">{role === 'homeroom' ? '담임 교사' : '교과 전담'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">학년:</span>
                  <span className="value">
                    {role === 'homeroom' 
                      ? (grade ? `${grade}학년` : '미선택') 
                      : (targetGrades.length > 0 ? targetGrades.map(g => `${g}학년`).join(', ') : '미선택')
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">과목:</span>
                  <span className="value">
                    {targetSubjects.length > 0 
                      ? targetSubjects.map(id => SUBJECTS.find(s => s.id === id)?.name).join(', ')
                      : '미선택'
                    }
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">폴더 구조:</span>
                  <span className="value">
                    {FOLDER_HIERARCHY_OPTIONS.find(h => h.id === folderHierarchy)?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="onboarding-actions">
              <button 
                className="back-btn"
                onClick={() => setStep(1)}
              >
                ← 이전
              </button>
              <button 
                className="complete-btn"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? '설정 중...' : '설정 완료 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

