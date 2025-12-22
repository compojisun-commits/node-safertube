import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, addDoc, collection, Timestamp, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { addToJjim } from '../utils/jjim';
import { addLikeSubject, removeLikeSubject, isLikedSubject } from '../utils/likeSubject';

export default function RecommendationResult({ requestId, onReset, onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVideos, setExpandedVideos] = useState({});
  const [emailNotificationEnabled, setEmailNotificationEnabled] = useState(false);
  const [sortBy, setSortBy] = useState('duration'); // 'duration', 'views', 'likes'
  const [likedVideos, setLikedVideos] = useState({}); // videoId: boolean
  const [jjimedVideos, setJjimedVideos] = useState({}); // videoId: boolean

  useEffect(() => {
    if (!requestId) return;

    // Firestore 실시간 리스닝
    const unsubscribe = onSnapshot(
      doc(db, 'recommendationRequests', requestId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setResult(data);
          if (data.status === 'completed' || data.status === 'error') {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error('Error listening to document:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  const toggleVideo = (videoId) => {
    setExpandedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  // 키워드 자동 저장 함수 (좋아요/찜 2개 이상 시)
  const saveKeywordIfNeeded = async () => {
    if (!result || !result.intention || !result.gradeLevel || !result.subject) return;

    // 좋아요 + 찜 개수 확인
    const likedCount = Object.values(likedVideos).filter(Boolean).length;
    const jjimedCount = Object.values(jjimedVideos).filter(Boolean).length;
    const totalCount = likedCount + jjimedCount;

    if (totalCount >= 2) {
      try {
        const docName = `${result.gradeLevel}-${result.subject}`;
        const keywordDocRef = doc(db, "recommendKeywords", docName);
        const keywordDoc = await getDoc(keywordDocRef);

        const keyword = result.intention.trim();

        if (!keywordDoc.exists()) {
          // 문서가 없으면 새로 생성
          await setDoc(keywordDocRef, {
            gradeLevel: result.gradeLevel,
            subject: result.subject,
            keywords: [keyword],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          console.log(`✅ 키워드 저장: "${keyword}" (새 문서 생성)`);
        } else {
          // 이미 있으면 중복 체크 후 추가
          const data = keywordDoc.data();
          const keywords = data.keywords || [];

          if (!keywords.includes(keyword)) {
            await updateDoc(keywordDocRef, {
              keywords: arrayUnion(keyword),
              updatedAt: Timestamp.now()
            });
            console.log(`✅ 키워드 저장: "${keyword}" (기존 문서에 추가)`);
          } else {
            console.log(`ℹ️ 키워드 이미 존재: "${keyword}"`);
          }
        }
      } catch (error) {
        console.error('키워드 저장 오류:', error);
      }
    }
  };

  // 찜하기 핸들러
  const handleJjim = async (video) => {
    if (!user) {
      const result = await Swal.fire({
        title: '로그인이 필요합니다',
        text: '찜하기 기능을 사용하려면 로그인이 필요합니다.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '로그인',
        cancelButtonText: '취소'
      });
      if (result.isConfirmed) {
        await loginWithGoogle();
      }
      return;
    }

    try {
      await addToJjim({
        user,
        videoUrl: video.videoUrl,
        videoId: video.videoId,
        title: video.title,
        analysis: {
          safetyScore: video.safetyScore,
          summary: video.summary,
          warnings: video.warnings || [],
        },
      });

      setJjimedVideos(prev => {
        const newState = { ...prev, [video.videoId]: true };
        // 상태 업데이트 후 키워드 저장 체크
        setTimeout(() => saveKeywordIfNeeded(), 100);
        return newState;
      });

      await Swal.fire({
        title: '찜 완료!',
        text: '내 찜보따리에 추가되었습니다.',
        icon: 'success',
        confirmButtonColor: '#4285f4',
        timer: 1500
      });
    } catch (error) {
      console.error('찜하기 오류:', error);
      await Swal.fire({
        title: '오류',
        text: error.message || '찜하기 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#4285f4'
      });
    }
  };

  // 좋아요 핸들러
  const handleLike = async (video) => {
    if (!user) {
      const result = await Swal.fire({
        title: '로그인이 필요합니다',
        text: '좋아요 기능을 사용하려면 로그인이 필요합니다.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '로그인',
        cancelButtonText: '취소'
      });
      if (result.isConfirmed) {
        await loginWithGoogle();
      }
      return;
    }

    try {
      const isLiked = likedVideos[video.videoId];
      const subject = result.subject;

      if (isLiked) {
        // 좋아요 취소
        await removeLikeSubject({ user, subject, videoId: video.videoId });
        setLikedVideos(prev => ({ ...prev, [video.videoId]: false }));
        await Swal.fire({
          title: '좋아요 취소',
          text: '좋아요가 취소되었습니다.',
          icon: 'info',
          confirmButtonColor: '#6c757d',
          timer: 1000
        });
      } else {
        // 좋아요 추가
        await addLikeSubject({
          user,
          subject,
          videoId: video.videoId,
          videoUrl: video.videoUrl,
          title: video.title,
          summary: video.summary || '',
          duration: video.duration || 0,
          safetyScore: video.safetyScore || 0,
        });
        setLikedVideos(prev => {
          const newState = { ...prev, [video.videoId]: true };
          // 상태 업데이트 후 키워드 저장 체크
          setTimeout(() => saveKeywordIfNeeded(), 100);
          return newState;
        });
        await Swal.fire({
          title: '좋아요!',
          text: `${subject} 좋아요 목록에 추가되었습니다.`,
          icon: 'success',
          confirmButtonColor: '#4285f4',
          timer: 1500
        });
      }
    } catch (error) {
      console.error('좋아요 오류:', error);
      await Swal.fire({
        title: '오류',
        text: error.message || '좋아요 처리 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#4285f4'
      });
    }
  };

  // 새로고침 핸들러 (4개 더 추가, 로그인 시 2회 제한)
  const handleRefresh = async () => {
    if (!result) return;

    // 비로그인 사용자는 사용 불가
    if (!user) {
      await Swal.fire({
        title: '로그인이 필요합니다',
        text: '새로고침 기능은 로그인 후 사용 가능합니다.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '로그인',
        cancelButtonText: '취소'
      }).then((result) => {
        if (result.isConfirmed) {
          loginWithGoogle();
        }
      });
      return;
    }

    // 새로고침 사용 횟수 체크 (requestId별로 관리)
    const refreshKey = `refresh_count_${requestId}`;
    const refreshCount = parseInt(localStorage.getItem(refreshKey) || '0');

    if (refreshCount >= 2) {
      await Swal.fire({
        title: '새로고침 한도 초과',
        text: '이 추천 결과는 이미 2번 새로고침했습니다.',
        icon: 'warning',
        confirmButtonColor: '#4285f4'
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: '새로고침',
      html: `같은 조건으로 4개의 영상을 더 추가할까요?<br/><small>남은 횟수: ${2 - refreshCount}/2</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4285f4',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '추가',
      cancelButtonText: '취소'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setLoading(true);

      // 같은 조건으로 새 요청 생성 (maxResults: 4)
      const docRef = await addDoc(collection(db, "recommendationRequests"), {
        gradeLevel: result.gradeLevel,
        subject: result.subject,
        intention: result.intention || null,
        objective: result.objective || `${result.subject} 수업을 위한 적합한 영상 추천`,
        preferredDuration: result.preferredDuration || null,
        materials: result.materials || [],
        maxResults: 4, // 4개만 검색
        userId: user?.uid || null,
        status: "pending",
        createdAt: Timestamp.now(),
      });

      // 새로고침 횟수 증가
      localStorage.setItem(refreshKey, (refreshCount + 1).toString());

      await Swal.fire({
        title: '새로고침 시작!',
        text: '같은 조건으로 4개 영상을 추가로 검색합니다.',
        icon: 'success',
        confirmButtonColor: '#4285f4',
        timer: 1500
      });

      // 새 요청 ID로 리다이렉트
      window.location.href = `?requestId=${docRef.id}`;
    } catch (error) {
      console.error('새로고침 오류:', error);
      await Swal.fire({
        title: '오류',
        text: '새로고침 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#4285f4'
      });
      setLoading(false);
    }
  };

  const handleEmailNotification = async () => {
    if (!user) {
      // 비로그인 상태: 로그인 유도
      const result = await Swal.fire({
        title: '로그인이 필요합니다',
        text: '추천 완료 시 이메일로 결과를 받으시려면 구글 로그인이 필요합니다.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '구글 로그인하기',
        cancelButtonText: '취소'
      });

      if (result.isConfirmed) {
        try {
          const loggedInUser = await loginWithGoogle();
          setEmailNotificationEnabled(true);

          await new Promise(resolve => setTimeout(resolve, 1000));

          const userEmail = loggedInUser?.user?.email || user?.email;

          if (userEmail) {
            await Swal.fire({
              title: '이메일 알림 설정 완료!',
              text: `추천이 완료되면 ${userEmail}로 결과를 보내드립니다.`,
              icon: 'success',
              confirmButtonColor: '#4285f4',
              timer: 2000
            });

            await updateDoc(doc(db, 'recommendationRequests', requestId), {
              sendEmail: true,
              userEmail: userEmail
            });
          }
        } catch (error) {
          console.error('Login error:', error);
          await Swal.fire({
            title: '오류',
            text: '로그인 중 문제가 발생했습니다. 다시 시도해주세요.',
            icon: 'error',
            confirmButtonColor: '#4285f4'
          });
        }
      }
    } else {
      // 로그인 상태: 이메일 알림 토글
      const newState = !emailNotificationEnabled;
      setEmailNotificationEnabled(newState);

      if (newState) {
        await Swal.fire({
          title: '이메일 알림 설정 완료!',
          text: `추천이 완료되면 ${user.email}로 결과를 보내드립니다.`,
          icon: 'success',
          confirmButtonColor: '#4285f4',
          timer: 2000
        });

        await updateDoc(doc(db, 'recommendationRequests', requestId), {
          sendEmail: true,
          userEmail: user.email
        });
      } else {
        await Swal.fire({
          title: '이메일 알림 해제',
          text: '이메일 알림이 해제되었습니다.',
          icon: 'info',
          confirmButtonColor: '#6c757d',
          timer: 1500
        });

        await updateDoc(doc(db, 'recommendationRequests', requestId), {
          sendEmail: false
        });
      }
    }
  };

  // 분석 중일 때 (실시간 스트리밍 UI)
  const isAnalyzing = result?.status === 'analyzing';
  const analyzedCount = result?.analyzedCount || 0;
  const totalVideos = result?.totalVideos || 0;
  const streamingRecommendations = result?.recommendations || [];

  if (loading || result?.status === 'pending' || result?.status === 'processing') {
    return (
      <div style={{
        width: '100%',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        margin: '0 auto'
      }}>
        <div style={{
          width: '100%',
          padding: '60px 40px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          <div style={{ margin: '20px 0' }}>
            <div className="spinner" style={{
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #4285f4',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 30px'
            }}></div>
          </div>
          <h2 style={{ color: '#333', fontSize: '28px', marginBottom: '15px' }}>🔍 영상 검색 중...</h2>
          <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
            AI가 적합한 YouTube 영상을 찾고<br/>
            각 영상의 안전도를 분석하고 있습니다.<br/>
            잠시만 기다려주세요. (약 1~2분 소요)
          </p>
        </div>

        {/* 이메일 알림 버튼 */}
        <button
          onClick={handleEmailNotification}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: emailNotificationEnabled ? '#28a745' : (user ? '#4285f4' : '#ffc107'),
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }}
        >
          {user ? (
            emailNotificationEnabled ? '✅ 완료되면 이메일 받기 설정됨' : '📧 완료되면 이메일 받기'
          ) : (
            '🔐 로그인하고 이메일 받기'
          )}
        </button>
      </div>
    );
  }

  // 분석 중 + 중간 결과가 있을 때 (실시간 스트리밍)
  if (isAnalyzing) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '900px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        color: '#333'
      }}>
        {/* 진행 상황 헤더 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4285f4',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h2 style={{ margin: 0, color: '#1976d2', fontSize: '24px' }}>
              🔍 분석 중... ({analyzedCount}/{totalVideos})
            </h2>
          </div>

          {/* 프로그레스 바 */}
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#bbdefb',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${totalVideos > 0 ? (analyzedCount / totalVideos) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#4285f4',
              borderRadius: '6px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>

          <p style={{ margin: '15px 0 0', color: '#666', fontSize: '14px' }}>
            분석이 완료된 영상부터 먼저 보여드립니다
          </p>
        </div>

        {/* 분석 완료된 영상 목록 (실시간) */}
        {streamingRecommendations.length > 0 ? (
          <div>
            <h3 style={{ color: '#4285f4', marginBottom: '20px' }}>
              ✅ 분석 완료 ({streamingRecommendations.length}개)
            </h3>

            {streamingRecommendations.map((video, idx) => {
              const isExpanded = expandedVideos[video.videoId];
              const safetyColor = video.safetyScore >= 80 ? '#28a745' : video.safetyScore >= 50 ? '#ffc107' : '#dc3545';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    marginBottom: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    animation: 'fadeIn 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4285f4';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* 영상 요약 정보 */}
                  <div onClick={() => toggleVideo(video.videoId)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#333', fontSize: '18px', flex: 1 }}>
                        {video.title}
                      </h4>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: safetyColor,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginLeft: '10px'
                      }}>
                        {video.safetyScore}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                      <span>⏱️ {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      {video.warningCount > 0 && (
                        <span style={{ color: '#dc3545', fontWeight: '600' }}>
                          ⚠️ 주의 장면 {video.warningCount}개
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>
                        {isExpanded ? '▼ 접기' : '▶ 자세히 보기'}
                      </span>
                    </div>
                  </div>

                  {/* 상세 정보 (펼쳤을 때만) */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid #ddd'
                    }}>
                      {video.summary && (
                        <div style={{
                          padding: '15px',
                          backgroundColor: '#e8f4f8',
                          borderRadius: '8px',
                          marginBottom: '15px',
                          borderLeft: '4px solid #4285f4'
                        }}>
                          <h5 style={{ color: '#4285f4', marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>📝 영상 요약</h5>
                          <p style={{ margin: 0, lineHeight: '1.5', fontSize: '13px', color: '#333' }}>{video.summary}</p>
                        </div>
                      )}

                      {/* 액션 버튼들 */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJjim(video);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: jjimedVideos[video.videoId] ? '#ffc107' : '#f1f3f4',
                            color: jjimedVideos[video.videoId] ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ⭐ {jjimedVideos[video.videoId] ? '찜 완료' : '찜하기'}
                        </button>

                        <a
                          href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            backgroundColor: '#ff0000',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          YouTube 보기
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <p style={{ fontSize: '16px' }}>분석 중입니다... 잠시만 기다려주세요</p>
          </div>
        )}

        {/* CSS 애니메이션 */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  if (result?.status === 'error') {
    return (
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: 'red', marginBottom: '15px' }}>❌ 추천 실패</h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>{result.error || '알 수 없는 오류가 발생했습니다'}</p>
        <button
          onClick={onReset}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!result?.recommendations) {
    return null;
  }

  const { recommendations } = result;

  // 정렬 함수
  const sortVideos = (videos) => {
    const sorted = [...videos];
    if (sortBy === 'views') {
      return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'likes') {
      return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }
    // 기본값: duration (이미 카테고리별로 분류되어 있음)
    return sorted;
  };

  // 영상 길이별로 그룹화
  const durationCategories = [
    { label: '5분 이내', maxDuration: 300, videos: [] },
    { label: '10분 이내', maxDuration: 600, videos: [] },
    { label: '15분 이내', maxDuration: 900, videos: [] },
    { label: '20분 이내', maxDuration: 1200, videos: [] },
    { label: '30분 이내', maxDuration: 1800, videos: [] },
    { label: '40분 이내', maxDuration: 2400, videos: [] },
    { label: '40분 이상', maxDuration: Infinity, videos: [] }
  ];

  // 영상을 카테고리별로 분류
  recommendations.forEach(video => {
    const duration = video.duration || 0;
    for (const category of durationCategories) {
      if (duration <= category.maxDuration) {
        category.videos.push(video);
        break;
      }
    }
  });

  // 각 카테고리 내에서 정렬 적용
  durationCategories.forEach(category => {
    category.videos = sortVideos(category.videos);
  });

  // 비어있지 않은 카테고리만 필터링
  const nonEmptyCategories = durationCategories.filter(cat => cat.videos.length > 0);

  return (
    <>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        color: '#333'
      }}>
        <h2 style={{ color: '#4285f4', marginBottom: '20px' }}>✅ 영상 추천 완료</h2>

        {/* 요청 정보 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#e8f0fe',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📋 요청 정보</h3>
          <p style={{ margin: '8px 0' }}><strong>주제:</strong> {result.subject}</p>
          <p style={{ margin: '8px 0' }}><strong>목표:</strong> {result.objective}</p>
          <p style={{ margin: '8px 0' }}><strong>총 {recommendations.length}개 영상 발견</strong></p>
        </div>

        {/* 정렬 버튼 */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSortBy('duration')}
            style={{
              padding: '10px 20px',
              backgroundColor: sortBy === 'duration' ? '#4285f4' : '#f1f3f4',
              color: sortBy === 'duration' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            ⏱️ 시간순
          </button>
          <button
            onClick={() => setSortBy('views')}
            style={{
              padding: '10px 20px',
              backgroundColor: sortBy === 'views' ? '#4285f4' : '#f1f3f4',
              color: sortBy === 'views' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            👁️ 조회수순
          </button>
          <button
            onClick={() => setSortBy('likes')}
            style={{
              padding: '10px 20px',
              backgroundColor: sortBy === 'likes' ? '#4285f4' : '#f1f3f4',
              color: sortBy === 'likes' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            👍 좋아요순
          </button>
        </div>

        {/* 영상 길이별 목록 */}
        {nonEmptyCategories.map((category, catIdx) => (
          <div key={catIdx} style={{ marginBottom: '30px' }}>
            <h3 style={{
              color: '#4285f4',
              fontSize: '22px',
              marginBottom: '15px',
              borderBottom: '2px solid #4285f4',
              paddingBottom: '10px'
            }}>
              ⏱️ {category.label} ({category.videos.length}개)
            </h3>

            {category.videos.map((video, idx) => {
              const isExpanded = expandedVideos[video.videoId];
              const safetyColor = video.safetyScore >= 80 ? '#28a745' : video.safetyScore >= 50 ? '#ffc107' : '#dc3545';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    marginBottom: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4285f4';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* 영상 요약 정보 (항상 표시) */}
                  <div onClick={() => toggleVideo(video.videoId)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#333', fontSize: '18px', flex: 1 }}>
                        {video.title}
                      </h4>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: safetyColor,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginLeft: '10px'
                      }}>
                        {video.safetyScore}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                      <span>⏱️ {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      {video.warningCount > 0 && (
                        <span style={{ color: '#dc3545', fontWeight: '600' }}>
                          ⚠️ 주의 장면 {video.warningCount}개
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>
                        {isExpanded ? '▼ 접기' : '▶ 자세히 보기'}
                      </span>
                    </div>
                  </div>

                  {/* 상세 정보 (펼쳤을 때만 표시) */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid #ddd'
                    }}>
                      {/* 영상 요약 */}
                      {video.summary && (
                        <div style={{
                          padding: '15px',
                          backgroundColor: '#e8f4f8',
                          borderRadius: '8px',
                          marginBottom: '15px',
                          borderLeft: '4px solid #4285f4'
                        }}>
                          <h5 style={{ color: '#4285f4', marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>📝 영상 요약</h5>
                          <p style={{ margin: 0, lineHeight: '1.5', fontSize: '13px', color: '#333' }}>{video.summary}</p>
                        </div>
                      )}

                      {/* 안전도 설명 */}
                      {video.safetyDescription && (
                        <div style={{
                          padding: '15px',
                          backgroundColor: video.safetyScore >= 80 ? '#d4edda' : video.safetyScore >= 50 ? '#fff3cd' : '#f8d7da',
                          borderRadius: '8px',
                          marginBottom: '15px'
                        }}>
                          <h5 style={{
                            color: video.safetyScore >= 80 ? '#28a745' : video.safetyScore >= 50 ? '#856404' : '#721c24',
                            marginTop: 0,
                            marginBottom: '8px',
                            fontSize: '14px'
                          }}>
                            🛡️ 안전도 평가
                          </h5>
                          <p style={{ margin: 0, lineHeight: '1.5', fontSize: '13px' }}>{video.safetyDescription}</p>
                        </div>
                      )}

                      {/* 주의 장면 */}
                      {video.warnings && video.warnings.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <h5 style={{ color: '#dc3545', marginBottom: '10px', fontSize: '14px' }}>🚨 주의 장면 ({video.warnings.length}개)</h5>
                          {video.warnings.slice(0, 5).map((warning, wIdx) => (
                            <div key={wIdx} style={{
                              padding: '10px',
                              backgroundColor: '#fff3cd',
                              borderLeft: '4px solid #ffc107',
                              marginBottom: '8px',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}>
                              <strong>{warning.timestamp}</strong> - {warning.description}
                              {warning.reason && (
                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                                  사유: {warning.reason}
                                </div>
                              )}
                            </div>
                          ))}
                          {video.warnings.length > 5 && (
                            <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                              외 {video.warnings.length - 5}개 더...
                            </p>
                          )}
                        </div>
                      )}

                      {/* 주요 장면 */}
                      {video.chapters && video.chapters.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <h5 style={{ color: '#4285f4', marginBottom: '10px', fontSize: '14px' }}>📌 주요 장면</h5>
                          {video.chapters.map((chapter, cIdx) => (
                            <div key={cIdx} style={{
                              padding: '8px 12px',
                              backgroundColor: '#f0f4ff',
                              borderLeft: '3px solid #4285f4',
                              marginBottom: '6px',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}>
                              <strong style={{ color: '#4285f4' }}>{chapter.timestamp}</strong> - {chapter.title}
                              {chapter.description && (
                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                                  {chapter.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 전체 흐름 */}
                      {video.flow && video.flow.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <h5 style={{ color: '#28a745', marginBottom: '10px', fontSize: '14px' }}>🎬 영상 흐름</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {video.flow.slice(0, 6).map((segment, fIdx) => (
                              <div key={fIdx} style={{
                                padding: '8px 10px',
                                backgroundColor: '#f0fff4',
                                borderLeft: '3px solid #28a745',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                <strong style={{ color: '#28a745' }}>{segment.timestamp}</strong>
                                <div style={{ marginTop: '2px', color: '#333' }}>{segment.description}</div>
                              </div>
                            ))}
                          </div>
                          {video.flow.length > 6 && (
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                              외 {video.flow.length - 6}개 구간 더...
                            </p>
                          )}
                        </div>
                      )}

                      {/* 액션 버튼들 */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {/* 찜하기 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJjim(video);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: jjimedVideos[video.videoId] ? '#ffc107' : '#f1f3f4',
                            color: jjimedVideos[video.videoId] ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ⭐ {jjimedVideos[video.videoId] ? '찜 완료' : '찜하기'}
                        </button>

                        {/* 좋아요 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(video);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: likedVideos[video.videoId] ? '#e91e63' : '#f1f3f4',
                            color: likedVideos[video.videoId] ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ❤️ {likedVideos[video.videoId] ? '좋아요 취소' : '좋아요'}
                        </button>

                        {/* YouTube 링크 */}
                        <a
                          href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            backgroundColor: '#ff0000',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          YouTube 보기
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 플로팅 버튼들 */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 1000
      }}>
        {/* 홈으로 버튼 */}
        <button
          onClick={onBack}
          title="홈으로 돌아가기"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(66, 133, 244, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(66, 133, 244, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(66, 133, 244, 0.4)';
          }}
        >
          🏠
        </button>

        {/* 새로고침 버튼 (같은 조건 5개) */}
        <button
          onClick={handleRefresh}
          title="같은 조건으로 5개 다시 검색"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fbbc04',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(251, 188, 4, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(251, 188, 4, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(251, 188, 4, 0.4)';
          }}
        >
          🔄
        </button>

        {/* 처음부터 버튼 */}
        <button
          onClick={onReset}
          title="처음부터 다시 시작"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(52, 168, 83, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(52, 168, 83, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(52, 168, 83, 0.4)';
          }}
        >
          ✨
        </button>
      </div>
    </>
  );
}
