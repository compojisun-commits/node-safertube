import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      // 1. 약관 동의 팝업
      const termsResult = await Swal.fire({
        title: 'SaferTube 이용약관',
        html: `
          <div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #ff0000; margin-bottom: 15px;">서비스 이용약관 및 개인정보 처리방침</h3>

            <p style="margin-bottom: 15px; line-height: 1.6;">
              SaferTube는 YouTube 영상의 안전성을 분석하고 교육용 영상을 추천하는 서비스입니다.
            </p>

            <h4 style="color: #333; margin-top: 20px;">수집하는 정보:</h4>
            <ul style="margin: 10px 0; line-height: 1.6;">
              <li>Google 로그인 정보 (이메일, 이름, 프로필 사진)</li>
              <li>서비스 이용 기록 (분석 요청, 크레딧 사용량)</li>
              <li>이메일 알림 설정 (선택 시)</li>
            </ul>

            <h4 style="color: #333; margin-top: 20px;">주요 서비스:</h4>
            <ul style="margin: 10px 0; line-height: 1.6;">
              <li>YouTube 영상 안전성 분석 (AI 기반)</li>
              <li>교육용 영상 추천 (주제별, 필터 적용)</li>
              <li>체육/미술 수업 영상 추천</li>
              <li>일일 한도: 로그인 5회, 비로그인 3회</li>
            </ul>

            <h4 style="color: #333; margin-top: 20px;">중요 안내:</h4>
            <ul style="margin: 10px 0; line-height: 1.6;">
              <li>AI 분석 결과는 참고용이며 100% 정확성을 보장하지 않습니다</li>
              <li>최종 사용 여부는 이용자가 직접 판단해야 합니다</li>
              <li>현재 무료 서비스로 제공됩니다</li>
            </ul>

            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              상세한 내용은 서비스 하단의 "이용약관" 및 "개인정보 처리방침"에서 확인하실 수 있습니다.
            </p>
          </div>
        `,
        width: 700,
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '동의하고 로그인',
        cancelButtonText: '취소',
        customClass: {
          popup: 'terms-popup'
        }
      });

      if (!termsResult.isConfirmed) {
        return null; // 사용자가 취소한 경우
      }

      // 2. Google 로그인 진행
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result.user;

      // 3. Firestore에 약관 동의 기록 저장
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      await setDoc(userDocRef, {
        email: loggedInUser.email,
        displayName: loggedInUser.displayName,
        photoURL: loggedInUser.photoURL,
        termsAccepted: true,
        termsAcceptedAt: Timestamp.now(),
        termsVersion: '2025-10-28',
        lastLogin: Timestamp.now(),
        // 기존 데이터 유지
        ...(userDoc.exists() ? {
          creditsUsed: userDoc.data().creditsUsed || 0,
          recommendCreditsUsed: userDoc.data().recommendCreditsUsed || 0,
          lastReset: userDoc.data().lastReset,
          lastRecommendReset: userDoc.data().lastRecommendReset
        } : {})
      }, { merge: true });

      await Swal.fire({
        title: '로그인 성공!',
        text: `환영합니다, ${loggedInUser.displayName || '사용자'}님!`,
        icon: 'success',
        confirmButtonColor: '#4285f4',
        timer: 2000
      });

      return result;
    } catch (error) {
      console.error('로그인 실패:', error);

      // 사용자가 취소한 경우가 아니라면 에러 표시
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        await Swal.fire({
          title: '로그인 실패',
          text: '로그인 중 문제가 발생했습니다. 다시 시도해주세요.',
          icon: 'error',
          confirmButtonColor: '#ff0000'
        });
      }

      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await Swal.fire({
        title: '로그아웃 완료',
        text: '안전하게 로그아웃되었습니다.',
        icon: 'success',
        confirmButtonColor: '#6c757d',
        timer: 1500
      });
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
