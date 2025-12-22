import { useState } from 'react';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import RecommendationResult from './RecommendationResult';
import Swal from 'sweetalert2';

export default function PhysicalArtsRecommendation({ onBack }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // 폼 상태
  const [activityType, setActivityType] = useState('체육'); // '체육' or '미술'
  const [availableTools, setAvailableTools] = useState('');
  const [teacherInvolvement, setTeacherInvolvement] = useState('보통'); // '적음', '보통', '많음'
  const [gradeLevel, setGradeLevel] = useState('elementary-1-2');
  const [duration, setDuration] = useState('40'); // '40' (한 차시) or '80' (두 차시)
  const [studentLevel, setStudentLevel] = useState('중'); // '하', '중', '상'

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!availableTools.trim()) {
      Swal.fire({
        title: '입력 필요',
        text: '교실에 있는 도구나 재료를 입력해주세요',
        icon: 'warning',
        confirmButtonColor: '#4285f4'
      });
      return;
    }

    setLoading(true);

    try {
      // 로컬 개발 환경 체크
      const isLocalDev = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

      // 크레딧 사용량 확인 및 표시
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { recommendCreditsUsed: 0 };

        const creditsUsed = userData.recommendCreditsUsed || 0;
        const maxCredits = 10;

        if (isLocalDev) {
          await Swal.fire({
            title: '로컬 개발 모드',
            html: `현재 추천 크레딧 사용량: <b>${creditsUsed}/${maxCredits}</b><br/><small>(로컬에서는 무제한 사용 가능)</small>`,
            icon: 'info',
            confirmButtonColor: '#4285f4',
            timer: 2000
          });
        } else {
          if (creditsUsed >= maxCredits) {
            await Swal.fire({
              title: '하루 한도 초과',
              html: `오늘의 무료 추천 한도를 모두 사용했습니다.<br/>사용량: <b>${creditsUsed}/${maxCredits}</b>`,
              icon: 'warning',
              confirmButtonColor: '#4285f4'
            });
            setLoading(false);
            return;
          }
        }
      } else {
        const maxCredits = 3;
        if (isLocalDev) {
          await Swal.fire({
            title: '로컬 개발 모드',
            html: `비로그인 상태 (로컬에서는 무제한)<br/>프로덕션: <b>하루 ${maxCredits}개 제한</b>`,
            icon: 'info',
            confirmButtonColor: '#4285f4',
            timer: 2000
          });
        }
      }

      // 비로그인 사용자 고유 ID 생성
      let anonymousId = null;
      if (!user) {
        anonymousId = localStorage.getItem('safertube_anonymous_id');
        if (!anonymousId) {
          anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('safertube_anonymous_id', anonymousId);
        }
      }

      // 주제와 목표 자동 생성
      const subject = `${activityType} 수업`;
      const durationText = duration === '40' ? '한 차시(40분)' : '두 차시(80분)';
      const levelText = studentLevel === '하' ? '초급' : studentLevel === '중' ? '중급' : '상급';
      const objective = `${durationText} 수업을 위한 ${levelText} 수준의 ${activityType} 활동입니다. 교실에 ${availableTools}이(가) 있고, 교사 개입 정도는 ${teacherInvolvement}입니다. 이 조건에 맞는 ${activityType} 활동을 학생들이 즐겁게 할 수 있도록 영상을 추천해주세요.`;

      // Firestore에 추천 요청 생성
      const docRef = await addDoc(collection(db, 'recommendationRequests'), {
        subject,
        objective,
        gradeLevel,
        userId: user?.uid || null,
        anonymousId: anonymousId,
        activityType, // 체육/미술 구분
        availableTools,
        teacherInvolvement,
        duration, // 차시 (40분 or 80분)
        studentLevel, // 학생 수준 (하, 중, 상)
        isPhysicalArts: true, // 체육/미술 추천임을 표시
        status: 'pending',
        createdAt: Timestamp.now()
      });

      setRequestId(docRef.id);
    } catch (error) {
      console.error('Error creating recommendation request:', error);
      Swal.fire({
        title: '오류',
        text: '추천 요청 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#4285f4'
      });
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRequestId(null);
    setActivityType('체육');
    setAvailableTools('');
    setTeacherInvolvement('보통');
    setGradeLevel('elementary-1-2');
    setDuration('40');
    setStudentLevel('중');
    setLoading(false);
  };

  if (requestId) {
    return <RecommendationResult requestId={requestId} onReset={handleReset} onBack={onBack} />;
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ff6b35',
          marginBottom: '10px'
        }}>
          {activityType === '체육' ? '⚽' : '🎨'} 체육/미술 수업 추천
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          교실 환경에 맞는 {activityType} 활동을 찾아드립니다
        </p>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
            }}
          >
            ← 홈으로 돌아가기
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* 활동 유형 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            🎯 활동 유형
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActivityType('체육')}
              style={{
                padding: '16px',
                backgroundColor: activityType === '체육' ? '#ff6b35' : 'white',
                color: activityType === '체육' ? 'white' : '#333',
                border: `2px solid ${activityType === '체육' ? '#ff6b35' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activityType === '체육' ? '600' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              ⚽ 체육 수업
            </button>
            <button
              type="button"
              onClick={() => setActivityType('미술')}
              style={{
                padding: '16px',
                backgroundColor: activityType === '미술' ? '#ff6b35' : 'white',
                color: activityType === '미술' ? 'white' : '#333',
                border: `2px solid ${activityType === '미술' ? '#ff6b35' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activityType === '미술' ? '600' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              🎨 미술 수업
            </button>
          </div>
        </div>

        {/* 학년 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            👶 대상 학년
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { value: 'elementary-1-2', label: '초등 1~2학년', emoji: '🐣' },
              { value: 'elementary-3-4', label: '초등 3~4학년', emoji: '🐥' },
              { value: 'elementary-5-6', label: '초등 5~6학년', emoji: '🐤' },
              { value: 'middle-school', label: '중학생', emoji: '🦅' }
            ].map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => setGradeLevel(grade.value)}
                style={{
                  padding: '12px',
                  backgroundColor: gradeLevel === grade.value ? '#ff6b35' : 'white',
                  color: gradeLevel === grade.value ? 'white' : '#333',
                  border: `2px solid ${gradeLevel === grade.value ? '#ff6b35' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: gradeLevel === grade.value ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {grade.emoji} {grade.label}
              </button>
            ))}
          </div>
        </div>

        {/* 교실 도구/재료 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            🛠️ 교실에 있는 도구/재료
          </label>
          <input
            type="text"
            value={availableTools}
            onChange={(e) => setAvailableTools(e.target.value)}
            placeholder={activityType === '체육'
              ? "예: 공, 훌라후프, 매트, 줄넘기"
              : "예: 색종이, 가위, 풀, 크레용, 물감"}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              boxSizing: 'border-box',
              transition: 'border-color 0.3s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* 수업 차시 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            ⏰ 수업 차시
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDuration('40')}
              style={{
                padding: '12px',
                backgroundColor: duration === '40' ? '#ff6b35' : 'white',
                color: duration === '40' ? 'white' : '#333',
                border: `2px solid ${duration === '40' ? '#ff6b35' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: duration === '40' ? '600' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              한 차시 (40분)
            </button>
            <button
              type="button"
              onClick={() => setDuration('80')}
              style={{
                padding: '12px',
                backgroundColor: duration === '80' ? '#ff6b35' : 'white',
                color: duration === '80' ? 'white' : '#333',
                border: `2px solid ${duration === '80' ? '#ff6b35' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: duration === '80' ? '600' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              두 차시 (80분)
            </button>
          </div>
        </div>

        {/* 학생 수준 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            📊 학생 수준
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { value: '하', label: '하 (초급)' },
              { value: '중', label: '중 (중급)' },
              { value: '상', label: '상 (상급)' }
            ].map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setStudentLevel(level.value)}
                style={{
                  padding: '12px',
                  backgroundColor: studentLevel === level.value ? '#ff6b35' : 'white',
                  color: studentLevel === level.value ? 'white' : '#333',
                  border: `2px solid ${studentLevel === level.value ? '#ff6b35' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: studentLevel === level.value ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            • 하: 기초 단계, 쉬운 활동<br/>
            • 중: 평균 수준, 적당한 난이도<br/>
            • 상: 숙련 단계, 도전적인 활동
          </p>
        </div>

        {/* 교사 개입 정도 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
            👨‍🏫 교사 개입 정도
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['적음', '보통', '많음'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setTeacherInvolvement(level)}
                style={{
                  padding: '12px',
                  backgroundColor: teacherInvolvement === level ? '#ff6b35' : 'white',
                  color: teacherInvolvement === level ? 'white' : '#333',
                  border: `2px solid ${teacherInvolvement === level ? '#ff6b35' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: teacherInvolvement === level ? '600' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            • 적음: 학생 자율 활동 중심<br/>
            • 보통: 교사 설명 + 학생 활동<br/>
            • 많음: 교사 시범 및 단계별 지도
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !availableTools.trim()}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: loading || !availableTools.trim() ? '#ccc' : '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: loading || !availableTools.trim() ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: loading || !availableTools.trim() ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading && availableTools.trim()) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.5)';
              e.target.style.backgroundColor = '#e55a2b';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = loading || !availableTools.trim() ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.3)';
            e.target.style.backgroundColor = loading || !availableTools.trim() ? '#ccc' : '#ff6b35';
          }}
        >
          {loading ? '🔍 검색 중...' : `✨ ${activityType} 영상 추천받기`}
        </button>
      </form>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: user ? '#d4edda' : '#fff3cd',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#333',
        border: `1px solid ${user ? '#c3e6cb' : '#ffeaa7'}`
      }}>
        <strong>📊 하루 무료 한도:</strong><br/>
        {user ? (
          <span>✅ 로그인 완료 - 하루 10회 추천 가능</span>
        ) : (
          <span>⚠️ 비로그인 - 하루 3회만 가능 / <strong>구글 로그인하면 10회로 증가!</strong></span>
        )}
      </div>

      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#ffe8e0',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#333',
        border: '1px solid #ffd4c4'
      }}>
        <strong>💡 추천 방식:</strong><br/>
        입력하신 도구와 교사 개입 정도를 바탕으로<br/>
        실제 교실에서 바로 활용 가능한 {activityType} 영상을 추천해드립니다.
      </div>
    </div>
  );
}
