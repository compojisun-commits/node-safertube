import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { addToJjim, removeFromJjim } from '../utils/jjim';
import Swal from 'sweetalert2';

export default function UserHistory({ onBack }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'analysis', 'recommendation'
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);
  const [jjimVideos, setJjimVideos] = useState([]); // 찜보따리에 저장된 영상들
  const [folders, setFolders] = useState([]); // 폴더 목록

  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        // 분석 요청 히스토리 (orderBy 제거, 클라이언트 측 정렬)
        const analysisQuery = query(
          collection(db, 'analysisRequests'),
          where('userId', '==', user.uid)
        );
        const analysisSnapshot = await getDocs(analysisQuery);
        const analysisData = analysisSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'analysis'
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime; // 최신순 정렬
          });

        // 추천 요청 히스토리 (orderBy 제거, 클라이언트 측 정렬)
        const recommendationQuery = query(
          collection(db, 'recommendationRequests'),
          where('userId', '==', user.uid)
        );
        const recommendationSnapshot = await getDocs(recommendationQuery);
        const recommendationData = recommendationSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'recommendation'
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime; // 최신순 정렬
          });

        setAnalysisHistory(analysisData);
        setRecommendationHistory(recommendationData);

        // 찜보따리 데이터 로드
        await loadJjimVideos();
      } catch (error) {
        console.error('히스토리 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  // 찜보따리 데이터 로드
  const loadJjimVideos = async () => {
    if (!user) return;

    try {
      const mainDocRef = doc(db, 'jjimVideos', user.uid);
      const mainDoc = await getDoc(mainDocRef);

      if (!mainDoc.exists()) {
        setJjimVideos([]);
        setFolders([]);
        return;
      }

      const data = mainDoc.data();
      let allVideos = data.videos || [];
      const allFolders = data.folders || [];

      // 추가 문서들도 확인
      const addLists = data.add_lists || [];
      for (const listNum of addLists) {
        const addDocRef = doc(db, 'jjimVideos', `${user.uid}_${listNum}`);
        const addDoc = await getDoc(addDocRef);
        if (addDoc.exists()) {
          const addData = addDoc.data();
          allVideos = [...allVideos, ...(addData.videos || [])];
        }
      }

      setJjimVideos(allVideos);
      setFolders(allFolders);
    } catch (error) {
      console.error('찜보따리 로드 오류:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 정보 없음';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const formatGradeLevel = (gradeLevel) => {
    const gradeMap = {
      'elementary-1-2': '초1~2',
      'elementary-3-4': '초3~4',
      'elementary-5-6': '초5~6',
      'middle-school': '중학생',
      'high-school': '고등학생'
    };
    return gradeMap[gradeLevel] || gradeLevel;
  };

  // 특정 영상이 찜보따리에 있는지 확인
  const isInJjim = (videoId) => {
    return jjimVideos.some(v => v.videoId === videoId);
  };

  // 폴더 선택 및 정보 입력 팝업
  const selectFolder = async (defaultTitle = '', defaultMemo = '', defaultTags = []) => {
    // 폴더 계층 구조를 만들기 위한 헬퍼 함수
    const buildFolderTree = (parentId = null, depth = 0) => {
      return folders
        .filter(f => f.parentId === parentId)
        .map(folder => {
          const indent = '&nbsp;&nbsp;'.repeat(depth * 2);
          const icon = depth === 0 ? '📁' : '└';
          return `<option value="${folder.id}">${indent}${icon} ${folder.name}</option>` +
            buildFolderTree(folder.id, depth + 1);
        })
        .join('');
    };

    const folderOptions = buildFolderTree();

    const result = await Swal.fire({
      title: '📌 찜보따리에 추가',
      width: '600px',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <div style="margin-bottom: 16px;">
            <label for="jjim-title" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px;">
              📝 제목 <span style="color: #9ca3af; font-weight: normal; font-size: 12px;">(선택)</span>
            </label>
            <input
              id="jjim-title"
              class="swal2-input"
              placeholder="영상 제목을 입력하세요"
              value="${defaultTitle.replace(/"/g, '&quot;')}"
              style="width: 100%; margin: 0; padding: 10px; font-size: 14px;"
            />
          </div>

          <div style="margin-bottom: 16px;">
            <label for="jjim-memo" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px;">
              💬 메모 <span style="color: #9ca3af; font-weight: normal; font-size: 12px;">(선택)</span>
            </label>
            <textarea
              id="jjim-memo"
              class="swal2-textarea"
              placeholder="메모를 입력하세요"
              rows="2"
              style="width: 100%; margin: 0; padding: 10px; font-size: 14px; resize: vertical;"
            >${defaultMemo}</textarea>
          </div>

          <div style="margin-bottom: 16px;">
            <label for="jjim-tags" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px;">
              🏷️ 태그 <span style="color: #9ca3af; font-weight: normal; font-size: 12px;">(쉼표로 구분)</span>
            </label>
            <input
              id="jjim-tags"
              class="swal2-input"
              placeholder="예: 수학, 5학년, 분수"
              value="${defaultTags.join(', ')}"
              style="width: 100%; margin: 0; padding: 10px; font-size: 14px;"
            />
          </div>

          <div style="margin-bottom: 8px;">
            <label for="folder-select" style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px;">
              📁 폴더 <span style="color: #9ca3af; font-weight: normal; font-size: 12px;">(선택)</span>
            </label>
            <select id="folder-select" class="swal2-input" style="width: 100%; margin: 0; padding: 10px; font-family: monospace; font-size: 14px;">
              <option value="">📂 루트 (폴더 없음)</option>
              ${folderOptions}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '💾 저장',
      cancelButtonText: '취소',
      confirmButtonColor: '#4285f4',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const title = document.getElementById('jjim-title').value.trim();
        const memo = document.getElementById('jjim-memo').value.trim();
        const tagsInput = document.getElementById('jjim-tags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        const folderId = document.getElementById('folder-select').value || null;

        return {
          title: title || null,
          memo: memo || null,
          tags: tags.length > 0 ? tags : [],
          folderId
        };
      }
    });

    if (result.isConfirmed) {
      return result.value;
    }
    return undefined; // 취소한 경우
  };

  // 찜하기/해제 토글
  const handleToggleJjim = async (e, item, recommendedVideo = null) => {
    e.stopPropagation(); // 항목 펼치기 방지

    if (!user) {
      await Swal.fire({
        title: '로그인 필요',
        text: '찜하기는 로그인 후 이용 가능합니다.',
        icon: 'info',
        confirmButtonColor: '#4285f4'
      });
      return;
    }

    // 분석 항목인 경우
    if (item.type === 'analysis') {
      const videoId = item.videoId;
      const inJjim = isInJjim(videoId);

      try {
        if (inJjim) {
          // 찜 해제
          await removeFromJjim({ user, videoId });
          await Swal.fire({
            title: '찜 해제',
            text: '찜보따리에서 제거되었습니다.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          // 폴더 및 정보 입력
          const defaultTitle = item.analysis?.title || item.videoUrl || '';
          const jjimData = await selectFolder(defaultTitle, '', []);
          if (jjimData === undefined) return; // 취소한 경우

          // 찜하기
          await addToJjim({
            user,
            videoUrl: item.videoUrl,
            videoId: videoId,
            analysis: item.analysis,
            title: jjimData.title || defaultTitle,
            folderId: jjimData.folderId,
            memo: jjimData.memo || '',
            tags: jjimData.tags || []
          });
          await Swal.fire({
            title: '찜 완료',
            text: '찜보따리에 저장되었습니다.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
        // 찜보따리 데이터 다시 로드
        await loadJjimVideos();
      } catch (error) {
        console.error('찜하기 오류:', error);
        await Swal.fire({
          title: '오류',
          text: '찜하기 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
    // 추천 항목의 개별 영상인 경우
    else if (item.type === 'recommendation' && recommendedVideo) {
      // YouTube URL에서 videoId 추출
      const extractVideoId = (url) => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
          /youtube\.com\/embed\/([^&\n?#]+)/,
          /youtube\.com\/v\/([^&\n?#]+)/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const videoId = extractVideoId(recommendedVideo.videoUrl);
      if (!videoId) {
        await Swal.fire({
          title: '오류',
          text: '유효한 YouTube URL이 아닙니다.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      const inJjim = isInJjim(videoId);

      try {
        if (inJjim) {
          // 찜 해제
          await removeFromJjim({ user, videoId });
          await Swal.fire({
            title: '찜 해제',
            text: '찜보따리에서 제거되었습니다.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          // 폴더 및 정보 입력
          const defaultTitle = recommendedVideo.title || recommendedVideo.videoUrl || '';
          const jjimData = await selectFolder(defaultTitle, '', []);
          if (jjimData === undefined) return; // 취소한 경우

          // 찜하기 (추천 영상은 분석 데이터가 없으므로 간단하게)
          await addToJjim({
            user,
            videoUrl: recommendedVideo.videoUrl,
            videoId: videoId,
            analysis: {
              safetyScore: recommendedVideo.safetyScore,
              summary: recommendedVideo.reasoning || '',
              educationalValue: recommendedVideo.reasoning || '',
              risks: []
            },
            title: jjimData.title || defaultTitle,
            folderId: jjimData.folderId,
            memo: jjimData.memo || '',
            tags: jjimData.tags || []
          });
          await Swal.fire({
            title: '찜 완료',
            text: '찜보따리에 저장되었습니다.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
        // 찜보따리 데이터 다시 로드
        await loadJjimVideos();
      } catch (error) {
        console.error('찜하기 오류:', error);
        await Swal.fire({
          title: '오류',
          text: '찜하기 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '대기 중', color: 'bg-yellow-100 text-yellow-800' },
      processing: { text: '처리 중', color: 'bg-blue-100 text-blue-800' },
      completed: { text: '완료', color: 'bg-green-100 text-green-800' },
      error: { text: '오류', color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getFilteredHistory = () => {
    if (activeTab === 'analysis') return analysisHistory;
    if (activeTab === 'recommendation') return recommendationHistory;
    // 전체: 두 리스트 합치고 날짜순 정렬
    return [...analysisHistory, ...recommendationHistory].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  };

  const filteredHistory = getFilteredHistory();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-600 mb-4">로그인이 필요한 서비스입니다.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">내 히스토리</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← 돌아가기
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors border-b-4 whitespace-nowrap ${
            activeTab === 'all'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          전체 ({analysisHistory.length + recommendationHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors border-b-4 whitespace-nowrap ${
            activeTab === 'analysis'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline">영상 분석 </span>
          <span className="sm:hidden">분석 </span>
          ({analysisHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendation')}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors border-b-4 whitespace-nowrap ${
            activeTab === 'recommendation'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline">수업 추천 </span>
          <span className="sm:hidden">추천 </span>
          ({recommendationHistory.length})
        </button>
      </div>

      {/* 히스토리 리스트 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">히스토리가 없습니다</p>
          <p className="text-sm">영상 분석이나 수업 추천을 이용해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
            >
              {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                {/* 타입과 상태 배지 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {item.type === 'analysis' ? (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold">
                      🔍 <span className="hidden sm:inline">영상 </span>분석
                    </span>
                  ) : (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                      📚 <span className="hidden sm:inline">수업 </span>추천
                    </span>
                  )}
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-gray-400">
                    {expandedItem === item.id ? '▲ 접기' : '▼ 자세히'}
                  </span>
                </div>

                {/* 날짜와 찜하기 버튼 */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 찜하기 버튼 (분석 항목만) */}
                  {item.type === 'analysis' && item.videoId && (
                    <button
                      onClick={(e) => handleToggleJjim(e, item)}
                      className="hover:scale-110 transition-transform"
                      title={isInJjim(item.videoId) ? '찜보따리에서 제거' : '찜보따리에 추가'}
                    >
                      {isInJjim(item.videoId) ? (
                        // 채워진 별
                        <svg width="24" height="24" className="sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        // 빈 별
                        <svg width="24" height="24" className="sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  )}
                  <span className="text-xs sm:text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                </div>
              </div>

              {item.type === 'analysis' ? (
                // 영상 분석 항목
                <div>
                  <div className="mb-2">
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm sm:text-base font-medium break-words"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.analysis?.title || item.memo || item.videoUrl}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">학년: {formatGradeLevel(item.gradeLevel) || '미지정'}</span>
                    {item.sendEmail && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">이메일 발송 ✅</span>}
                  </div>

                  {/* 상세 정보 - 펼쳤을 때만 표시 */}
                  {expandedItem === item.id && item.analysis && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* 안전도 점수 */}
                      {item.analysis.safetyScore !== undefined && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <span className="font-semibold text-gray-700">안전도: </span>
                          <span className={`text-xl font-bold ${
                            item.analysis.safetyScore >= 80 ? 'text-green-600' :
                            item.analysis.safetyScore >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {item.analysis.safetyScore}/100
                          </span>
                        </div>
                      )}

                      {/* 요약 */}
                      {item.analysis.summary && (
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">요약: </span>
                          <p className="text-sm text-gray-600 mt-1">{item.analysis.summary}</p>
                        </div>
                      )}

                      {/* 교육적 가치 */}
                      {item.analysis.educationalValue && (
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">교육적 가치: </span>
                          <p className="text-sm text-gray-600 mt-1">{item.analysis.educationalValue}</p>
                        </div>
                      )}

                      {/* 위험 요소 */}
                      {item.analysis.risks && item.analysis.risks.length > 0 && (
                        <div className="mt-3">
                          <span className="font-semibold text-red-600">⚠️ 위험 요소:</span>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            {item.analysis.risks.map((risk, idx) => (
                              <li key={idx} className="text-sm text-gray-600">{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // 수업 추천 항목
                <div>
                  <div className="mb-2 text-sm sm:text-base font-medium text-gray-800">
                    {item.subject} - {formatGradeLevel(item.gradeLevel)}
                  </div>
                  {item.intention && (
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">
                      수업 의도: {item.intention}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    {item.preferredDuration && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {item.preferredDuration}분 이내
                      </span>
                    )}
                    {item.materials && item.materials.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        준비물: {item.materials.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* 상세 정보 - 펼쳤을 때만 표시 */}
                  {expandedItem === item.id && item.recommendations && item.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="font-semibold text-gray-700">
                        추천 영상 ({item.recommendations.length}개):
                      </span>
                      <div className="mt-3 space-y-3">
                        {item.recommendations.map((video, idx) => {
                          // YouTube URL에서 videoId 추출
                          const extractVideoId = (url) => {
                            const patterns = [
                              /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
                              /youtube\.com\/embed\/([^&\n?#]+)/,
                              /youtube\.com\/v\/([^&\n?#]+)/,
                            ];
                            for (const pattern of patterns) {
                              const match = url.match(pattern);
                              if (match) return match[1];
                            }
                            return null;
                          };
                          const videoId = extractVideoId(video.videoUrl);

                          return (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg relative">
                              {/* 찜하기 버튼 */}
                              {videoId && (
                                <button
                                  onClick={(e) => handleToggleJjim(e, item, video)}
                                  className="absolute top-2 right-2 hover:scale-110 transition-transform"
                                  title={isInJjim(videoId) ? '찜보따리에서 제거' : '찜보따리에 추가'}
                                >
                                  {isInJjim(videoId) ? (
                                    // 채워진 별
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    // 빈 별
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </button>
                              )}
                              <a
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-medium pr-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {video.title || video.videoUrl}
                              </a>
                              {video.safetyScore !== undefined && (
                                <div className="mt-1">
                                  <span className="text-sm text-gray-600">안전도: </span>
                                  <span className={`text-sm font-semibold ${
                                    video.safetyScore >= 80 ? 'text-green-600' :
                                    video.safetyScore >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {video.safetyScore}/100
                                  </span>
                                </div>
                              )}
                              {video.reasoning && (
                                <p className="text-xs text-gray-500 mt-1">
                                  추천 이유: {video.reasoning}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {expandedItem !== item.id && item.recommendations && (
                    <div className="mt-2 text-xs sm:text-sm text-blue-600 font-medium">
                      추천 영상 {item.recommendations.length}개
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
