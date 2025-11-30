import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Board({ onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 프로필 설정 상태
  const [grade, setGrade] = useState('elementary-1-2');
  const [subject, setSubject] = useState('');
  const [displayName, setDisplayName] = useState('');

  // 게시물 상태
  const [selectedGrade, setSelectedGrade] = useState('전체');
  const [selectedSubject, setSelectedSubject] = useState('전체');
  const [selectedSemester, setSelectedSemester] = useState('전체');
  const [sharedVideos, setSharedVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // 게시물 작성 모달
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    videoUrl: '',
    title: '',
    description: '',
    tags: '',
    teacherNote: '',
    grade: 'elementary-6',
    subject: '사회',
    semester: '1'
  });

  useEffect(() => {
    checkUserProfile();
  }, [user]);

  useEffect(() => {
    if (!showNicknameModal && !loading) {
      loadSharedVideos();
    }
  }, [selectedGrade, selectedSubject, selectedSemester, showNicknameModal, loading]);

  const checkUserProfile = async () => {
    if (!user) {
      // 비로그인 사용자 - 로그인 유도
      const result = await Swal.fire({
        title: '로그인이 필요합니다',
        text: '풀어 보따리는 선생님들의 공유 공간입니다. 로그인 후 이용해주세요.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Google 로그인',
        cancelButtonText: '취소'
      });

      if (result.isConfirmed) {
        try {
          await loginWithGoogle();
          // 로그인 성공 후 다시 프로필 체크
          setTimeout(() => {
            checkUserProfile();
          }, 1000);
        } catch (error) {
          console.error('Login error:', error);
          onBack();
        }
      } else {
        onBack();
      }
      setLoading(false);
      return;
    }

    // 로그인 사용자 - 프로필 확인
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists() && userDoc.data().profile?.setupCompleted) {
        // 프로필 설정 완료
        setLoading(false);
      } else {
        // 프로필 미설정 - 닉네임 설정 모달 표시
        setShowNicknameModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!displayName.trim() || !grade) {
      Swal.fire({
        title: '입력 필요',
        text: '학년과 닉네임을 모두 입력해주세요',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        profile: {
          displayName: displayName.trim(),
          grade,
          subject: subject || null,
          setupCompleted: true
        },
        sharedCount: 0,
        likedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      setShowNicknameModal(false);

      await Swal.fire({
        title: '환영합니다!',
        text: '프로필 설정이 완료되었습니다.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      Swal.fire({
        title: '오류',
        text: '프로필 저장 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const loadSharedVideos = async () => {
    setLoadingVideos(true);
    try {
      console.log('Loading videos with filters:', { selectedGrade, selectedSubject, selectedSemester });

      // 동적으로 where 조건 구성
      const constraints = [];

      if (selectedGrade !== '전체') {
        constraints.push(where('grade', '==', selectedGrade));
      }

      if (selectedSubject !== '전체') {
        constraints.push(where('subject', '==', selectedSubject));
      }

      if (selectedSemester !== '전체') {
        constraints.push(where('semester', '==', selectedSemester));
      }

      // orderBy와 limit 추가
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(20));

      const q = query(collection(db, 'sharedVideos'), ...constraints);

      const querySnapshot = await getDocs(q);
      const videos = [];
      querySnapshot.forEach((doc) => {
        videos.push({ id: doc.id, ...doc.data() });
      });

      console.log('Loaded videos:', videos.length, videos);
      setSharedVideos(videos);
    } catch (error) {
      console.error('Error loading videos:', error);
      console.error('Error details:', error.message, error.code);

      // 인덱스 에러인 경우 안내 메시지
      if (error.code === 'failed-precondition') {
        Swal.fire({
          title: '인덱스 설정 필요',
          text: 'Firestore 인덱스를 생성해야 합니다. 콘솔 링크를 확인해주세요.',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
      }
    } finally {
      setLoadingVideos(false);
    }
  };

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

  const handlePostSubmit = async () => {
    if (!postForm.videoUrl.trim() || !postForm.title.trim()) {
      Swal.fire({
        title: '입력 필요',
        text: '영상 URL과 제목을 모두 입력해주세요',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const videoId = extractVideoId(postForm.videoUrl);
    if (!videoId) {
      Swal.fire({
        title: '잘못된 URL',
        text: '유효한 YouTube URL을 입력해주세요',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    try {
      // 사용자 프로필 가져오기
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'sharedVideos'), {
        videoId,
        videoUrl: postForm.videoUrl,
        title: postForm.title,
        description: postForm.description,
        tags: postForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        teacherNote: postForm.teacherNote,
        grade: postForm.grade,
        subject: postForm.subject,
        semester: postForm.semester,
        authorId: user.uid,
        authorName: userData?.profile?.displayName || user.displayName,
        likes: 0,
        likedBy: [],
        createdAt: new Date()
      });

      setShowPostModal(false);
      setPostForm({
        videoUrl: '',
        title: '',
        description: '',
        tags: '',
        teacherNote: '',
        grade: 'elementary-6',
        subject: '사회',
        semester: '1'
      });

      await Swal.fire({
        title: '공유 완료!',
        text: '영상이 성공적으로 공유되었습니다.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });

      loadSharedVideos();
    } catch (error) {
      console.error('Error sharing video:', error);
      Swal.fire({
        title: '오류',
        text: '영상 공유 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showPostModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📤 영상 공유하기
          </h2>

          <div className="space-y-4">
            {/* YouTube URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube URL (필수)
              </label>
              <input
                type="text"
                value={postForm.videoUrl}
                onChange={(e) => setPostForm({...postForm, videoUrl: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제목 (필수)
              </label>
              <input
                type="text"
                value={postForm.title}
                onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                placeholder="예: 4.19 혁명 다큐멘터리"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 학년/과목/학기 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  학년
                </label>
                <select
                  value={postForm.grade}
                  onChange={(e) => setPostForm({...postForm, grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="elementary-6">6학년</option>
                  <option value="elementary-5">5학년</option>
                  <option value="elementary-4">4학년</option>
                  <option value="elementary-3">3학년</option>
                  <option value="elementary-2">2학년</option>
                  <option value="elementary-1">1학년</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  과목
                </label>
                <select
                  value={postForm.subject}
                  onChange={(e) => setPostForm({...postForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="사회">사회</option>
                  <option value="과학">과학</option>
                  <option value="국어">국어</option>
                  <option value="수학">수학</option>
                  <option value="체육">체육</option>
                  <option value="미술">미술</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  학기
                </label>
                <select
                  value={postForm.semester}
                  onChange={(e) => setPostForm({...postForm, semester: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명 (선택)
              </label>
              <textarea
                value={postForm.description}
                onChange={(e) => setPostForm({...postForm, description: e.target.value})}
                placeholder="영상에 대한 간단한 설명..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                태그 (선택, 쉼표로 구분)
              </label>
              <input
                type="text"
                value={postForm.tags}
                onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                placeholder="예: 4.19혁명, 민주주의, 다큐멘터리"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 교사 메모 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                교사 메모 (선택)
              </label>
              <textarea
                value={postForm.teacherNote}
                onChange={(e) => setPostForm({...postForm, teacherNote: e.target.value})}
                placeholder="수업 활용 팁, 주의사항 등..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPostModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handlePostSubmit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                공유하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showNicknameModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            🎓 풀어 보따리에 오신 것을 환영합니다!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            선생님의 프로필을 설정해주세요
          </p>

          <div className="space-y-6">
            {/* 담당 학년 선택 */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                담당 학년 선택 (필수)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'kindergarten', label: '유아 5~7세', emoji: '👶' },
                  { value: 'elementary-1-2', label: '초등 1~2학년', emoji: '🐣' },
                  { value: 'elementary-3-4', label: '초등 3~4학년', emoji: '🐥' },
                  { value: 'elementary-5-6', label: '초등 5~6학년', emoji: '🐤' }
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGrade(g.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      grade === g.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.emoji}</div>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 담당 과목 선택 */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                담당 과목 선택 (선택)
              </label>
              <div className="flex flex-wrap gap-2">
                {['담임', '사회', '과학', '국어', '수학', '체육', '미술', '음악', '실과'].map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSubject(subject === subj ? '' : subj)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      subject === subj
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* 닉네임 입력 */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                닉네임 입력 (필수)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 6학년 담임 (김*현), 사회 전담 (이*주)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 다른 선생님들에게 보여질 이름입니다
              </p>
            </div>

            {/* 완료 버튼 */}
            <button
              onClick={handleProfileSubmit}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors"
            >
              완료하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 좌측: 필터 */}
      <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-xl self-start sticky top-24">
        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b">
          카테고리
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">학년</h4>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="전체">-- 전체 --</option>
              <option value="elementary-6">6학년</option>
              <option value="elementary-5">5학년</option>
              <option value="elementary-4">4학년</option>
              <option value="elementary-3">3학년</option>
              <option value="elementary-2">2학년</option>
              <option value="elementary-1">1학년</option>
            </select>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">과목</h4>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="전체">-- 전체 --</option>
              <option value="사회">사회</option>
              <option value="과학">과학</option>
              <option value="국어">국어</option>
              <option value="수학">수학</option>
              <option value="체육">체육</option>
              <option value="미술">미술</option>
            </select>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">학기</h4>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="전체">-- 전체 --</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
          <button
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            필터 적용
          </button>
        </div>
      </aside>

      {/* 우측: 게시물 목록 */}
      <section className="w-full md:w-3/4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            풀어 보따리 (수업 나눔)
            <span className="text-gray-500 text-xl ml-2 hidden md:inline">
              ({selectedGrade === '전체' ? '전체 학년' : selectedGrade.replace('elementary-', '') + '학년'}, {selectedSubject === '전체' ? '전체 과목' : selectedSubject})
            </span>
          </h2>
          <button
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            <span>영상 공유</span>
          </button>
        </div>

        {/* 검색창 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="내용, #태그, 작성자, 교사 메모로 검색... (예: 4.19, 김*현)"
            className="w-full px-5 py-3 text-gray-700 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* 단원별 키워드 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            💡 '6학년 1학기 사회' 단원별 키워드
          </h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-xs font-semibold text-gray-500 mb-2">
                1. 민주주의의 발전
              </h5>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                  #민주주의
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-300">
                  #4.19혁명
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-300">
                  #5.18민주화운동
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 정렬 컨트롤 */}
        <div className="flex justify-end items-center mb-4">
          <span className="text-sm text-gray-600 mr-2">정렬:</span>
          <button className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 px-2 py-1">
            최신순
          </button>
          <button className="text-sm font-semibold text-gray-500 hover:text-blue-600 px-2 py-1">
            좋아요순
          </button>
        </div>

        {/* 게시물 목록 */}
        <div className="space-y-6">
          {loadingVideos ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : sharedVideos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">아직 공유된 영상이 없습니다</p>
              <p className="text-sm mt-2">첫 번째로 영상을 공유해보세요!</p>
            </div>
          ) : (
            sharedVideos.map((video) => (
              <div key={video.id} className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* 썸네일 */}
                  <div className="md:w-1/3">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => window.open(video.videoUrl, '_blank')}
                    />
                  </div>

                  {/* 내용 */}
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {video.title}
                    </h3>

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {video.grade.replace('elementary-', '')}학년
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {video.subject}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {video.semester}학기
                      </span>
                    </div>

                    {/* 설명 */}
                    {video.description && (
                      <p className="text-gray-700 text-sm mb-3">
                        {video.description}
                      </p>
                    )}

                    {/* 태그 */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {video.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 교사 메모 */}
                    {video.teacherNote && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>💡 교사 메모:</strong> {video.teacherNote}
                        </p>
                      </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t">
                      <span>작성자: {video.authorName}</span>
                      <span>
                        {video.createdAt?.toDate?.().toLocaleDateString('ko-KR') || '날짜 정보 없음'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
