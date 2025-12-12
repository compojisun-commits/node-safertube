/**
 * 사용자 맞춤 폴더 자동 생성 유틸리티
 * 온보딩 완료 시 선택한 학년/과목에 맞는 폴더 트리 생성
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// 과목 정보
const SUBJECT_INFO = {
  kor: { name: '국어', color: '#ef4444' },
  math: { name: '수학', color: '#3b82f6' },
  soc: { name: '사회', color: '#f59e0b' },
  sci: { name: '과학', color: '#10b981' },
  moral: { name: '도덕', color: '#8b5cf6' },
  prac: { name: '실과', color: '#06b6d4' },
  music: { name: '음악', color: '#ec4899' },
  art: { name: '미술', color: '#f97316' },
  pe: { name: '체육', color: '#22c55e' },
  eng: { name: '영어', color: '#6366f1' },
};

// 학년별 대표 단원 (간소화된 버전)
const CURRICULUM_UNITS = {
  // 국어
  kor: {
    1: ['한글 놀이', '글자를 만들어요', '다함께 아야어여'],
    2: ['시를 즐겨요', '인물의 마음', '문장으로 표현해요'],
    3: ['재미있는 상상', '자료 정리하며 글쓰기', '주장과 근거'],
    4: ['생각과 느낌 나누기', '이야기의 세계', '글의 구조'],
    5: ['대화와 공감', '작품 속 인물', '글의 구조와 논리'],
    6: ['비유하는 표현', '이야기 간추리기', '정보와 표현 판단하기'],
  },
  // 수학
  math: {
    1: ['9까지의 수', '덧셈과 뺄셈', '모양과 규칙'],
    2: ['세 자리 수', '덧셈과 뺄셈', '길이 재기'],
    3: ['곱셈', '나눗셈', '분수와 소수'],
    4: ['큰 수', '각도', '곱셈과 나눗셈'],
    5: ['약수와 배수', '분수의 덧셈과 뺄셈', '도형의 넓이'],
    6: ['분수의 나눗셈', '소수의 나눗셈', '비와 비율'],
  },
  // 사회
  soc: {
    3: ['우리 고장', '지도와 방위', '옛날과 오늘날'],
    4: ['지역의 위치', '우리 지역의 발전', '문화재와 역사'],
    5: ['국토와 자연환경', '인권과 법', '경제와 생활'],
    6: ['민주주의의 발전', '우리나라의 경제', '세계와 지구촌'],
  },
  // 과학
  sci: {
    3: ['물질의 성질', '동물의 생활', '지표의 변화'],
    4: ['지층과 화석', '식물의 생활', '물체의 무게'],
    5: ['온도와 열', '태양계와 별', '용해와 용액'],
    6: ['전기의 이용', '생물과 환경', '날씨와 계절'],
  },
  // 도덕
  moral: {
    3: ['나와 너', '우리 함께', '배려와 존중'],
    4: ['도덕적 상상력', '정직과 약속', '공정과 정의'],
    5: ['자율과 책임', '나눔과 봉사', '갈등 해결'],
    6: ['내 삶의 주인', '봉사하는 삶', '통일 한국'],
  },
  // 실과
  prac: {
    5: ['생활과 기술', '목공과 공작', '발명과 문제해결'],
    6: ['생활과 소프트웨어', '로봇과 코딩', '지속가능한 생활'],
  },
  // 음악
  music: {
    3: ['음악의 요소', '노래 부르기', '악기 연주'],
    4: ['리듬과 가락', '합창과 합주', '세계의 음악'],
    5: ['음악의 역사', '창작 활동', '음악과 문화'],
    6: ['다양한 음악', '음악 감상', '음악과 생활'],
  },
  // 미술
  art: {
    3: ['관찰과 표현', '색과 형태', '미술과 생활'],
    4: ['상상과 표현', '판화와 조소', '미술 감상'],
    5: ['디자인과 공예', '현대 미술', '미술과 문화'],
    6: ['미술의 역사', '영상과 미디어', '미술과 진로'],
  },
  // 체육
  pe: {
    3: ['건강 체력', '움직임 활동', '표현 활동'],
    4: ['도전 활동', '경쟁 활동', '여가 활동'],
    5: ['체력 운동', '네트형 경쟁', '필드형 경쟁'],
    6: ['건강과 체력', '영역형 경쟁', '안전한 생활'],
  },
  // 영어
  eng: {
    3: ['Hello!', 'What is this?', 'I like apples'],
    4: ['How are you?', 'What time is it?', 'I can swim'],
    5: ['Nice to meet you', 'Where is the library?', 'What do you want?'],
    6: ['How was your vacation?', 'I want to be a teacher', 'What will you do?'],
  },
};

/**
 * 고유 ID 생성
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 학기별 단원 정보 (1학기/2학기 구분)
const CURRICULUM_BY_SEMESTER = {
  // 국어
  kor: {
    1: { 1: ['한글 놀이', '글자를 만들어요'], 2: ['다함께 아야어여', '문장을 읽어요'] },
    2: { 1: ['시를 즐겨요', '인물의 마음'], 2: ['문장으로 표현해요', '이야기 세계'] },
    3: { 1: ['재미있는 상상', '중심 생각 찾기'], 2: ['자료 정리하며 글쓰기', '주장과 근거'] },
    4: { 1: ['생각과 느낌 나누기', '인물의 성격'], 2: ['이야기의 세계', '글의 구조'] },
    5: { 1: ['대화와 공감', '글의 구조'], 2: ['작품 속 인물', '글의 논리'] },
    6: { 1: ['비유하는 표현', '이야기 간추리기'], 2: ['정보와 표현 판단하기', '생각을 담아 고쳐쓰기'] },
  },
  // 수학
  math: {
    1: { 1: ['9까지의 수', '덧셈과 뺄셈'], 2: ['50까지의 수', '모양과 규칙'] },
    2: { 1: ['세 자리 수', '덧셈과 뺄셈'], 2: ['곱셈 구구', '길이 재기'] },
    3: { 1: ['곱셈', '나눗셈'], 2: ['분수와 소수', '들이와 무게'] },
    4: { 1: ['큰 수', '각도'], 2: ['곱셈과 나눗셈', '다각형'] },
    5: { 1: ['약수와 배수', '분수의 덧셈과 뺄셈'], 2: ['분수의 곱셈', '도형의 넓이'] },
    6: { 1: ['분수의 나눗셈', '소수의 나눗셈'], 2: ['비와 비율', '원의 넓이'] },
  },
  // 사회
  soc: {
    3: { 1: ['우리 고장', '지도와 방위'], 2: ['옛날과 오늘날', '가족과 친척'] },
    4: { 1: ['지역의 위치', '촌락과 도시'], 2: ['우리 지역의 발전', '문화재와 역사'] },
    5: { 1: ['국토와 자연환경', '인권과 법'], 2: ['경제와 생활', '사회의 변화'] },
    6: { 1: ['민주주의의 발전', '우리나라의 경제'], 2: ['세계와 지구촌', '한반도의 미래와 통일'] },
  },
  // 과학
  sci: {
    3: { 1: ['물질의 성질', '동물의 생활'], 2: ['지표의 변화', '물질의 상태'] },
    4: { 1: ['지층과 화석', '식물의 생활'], 2: ['물체의 무게', '혼합물의 분리'] },
    5: { 1: ['온도와 열', '태양계와 별'], 2: ['용해와 용액', '생물과 환경'] },
    6: { 1: ['전기의 이용', '식물의 구조'], 2: ['날씨와 계절', '에너지와 생활'] },
  },
  // 도덕
  moral: {
    3: { 1: ['나와 너', '우리 함께'], 2: ['배려와 존중', '정직한 생활'] },
    4: { 1: ['도덕적 상상력', '정직과 약속'], 2: ['공정과 정의', '아름다운 사람'] },
    5: { 1: ['자율과 책임', '나눔과 봉사'], 2: ['갈등 해결', '통일 한국'] },
    6: { 1: ['내 삶의 주인', '봉사하는 삶'], 2: ['공정한 세상', '평화와 통일'] },
  },
  // 실과
  prac: {
    5: { 1: ['생활과 기술', '목공과 공작'], 2: ['발명과 문제해결', '생활과 정보'] },
    6: { 1: ['생활과 소프트웨어', '로봇과 코딩'], 2: ['지속가능한 생활', '기술과 발명'] },
  },
  // 음악
  music: {
    3: { 1: ['음악의 요소', '노래 부르기'], 2: ['악기 연주', '세계의 음악'] },
    4: { 1: ['리듬과 가락', '합창과 합주'], 2: ['음악 감상', '음악 만들기'] },
    5: { 1: ['음악의 역사', '창작 활동'], 2: ['음악과 문화', '다양한 연주'] },
    6: { 1: ['다양한 음악', '음악 감상'], 2: ['음악과 생활', '졸업 음악회'] },
  },
  // 미술
  art: {
    3: { 1: ['관찰과 표현', '색과 형태'], 2: ['미술과 생활', '작품 감상'] },
    4: { 1: ['상상과 표현', '판화와 조소'], 2: ['미술 감상', '디자인'] },
    5: { 1: ['디자인과 공예', '현대 미술'], 2: ['미술과 문화', '영상 미술'] },
    6: { 1: ['미술의 역사', '영상과 미디어'], 2: ['미술과 진로', '졸업 전시'] },
  },
  // 체육
  pe: {
    3: { 1: ['건강 체력', '움직임 활동'], 2: ['표현 활동', '게임 활동'] },
    4: { 1: ['도전 활동', '경쟁 활동'], 2: ['여가 활동', '표현 활동'] },
    5: { 1: ['체력 운동', '네트형 경쟁'], 2: ['필드형 경쟁', '표현 활동'] },
    6: { 1: ['건강과 체력', '영역형 경쟁'], 2: ['안전한 생활', '도전 활동'] },
  },
  // 영어
  eng: {
    3: { 1: ['Hello!', 'What is this?'], 2: ['I like apples', 'How many?'] },
    4: { 1: ['How are you?', 'What time is it?'], 2: ['I can swim', 'Let\'s play'] },
    5: { 1: ['Nice to meet you', 'Where is the library?'], 2: ['What do you want?', 'I\'d like pizza'] },
    6: { 1: ['How was your vacation?', 'I want to be a teacher'], 2: ['What will you do?', 'Thank you'] },
  },
};

/**
 * 사용자 맞춤 폴더 생성
 * 기존 jjimVideos 구조에 맞춰 folders 배열에 추가
 * @param {string} userId - Firebase user ID
 * @param {number[]} grades - 담당 학년 배열
 * @param {string[]} subjects - 담당 과목 ID 배열
 * @param {string} hierarchy - 폴더 계층 구조 ('grade-semester-subject', 'grade-subject-semester', 'grade-subject')
 */
export async function generateUserFolders(userId, grades, subjects, hierarchy = 'grade-semester-subject') {
  console.log('📁 폴더 생성 시작:', { userId, grades, subjects, hierarchy });

  // jjimVideos/{userId} 문서 참조
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  
  try {
    // 1. 기존 문서 가져오기
    const jjimDoc = await getDoc(jjimDocRef);
    const existingFolders = jjimDoc.exists() ? (jjimDoc.data().folders || []) : [];
    const existingFolderIds = new Set(existingFolders.map(f => f.id));
    
    // 2. 새로 추가할 폴더들
    const newFolders = [];
    let folderCount = 0;
    const now = Timestamp.now();

    // 3. 계층 구조에 따라 폴더 생성
    for (const grade of grades) {
      const gradeId = `g${grade}`;
      
      // 학년 폴더가 없으면 추가
      if (!existingFolderIds.has(gradeId)) {
        newFolders.push({
          id: gradeId,
          name: `${grade}학년`,
          parentId: null,
          type: 'folder',
          protected: true,
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(gradeId);
        folderCount++;
      }

      // 계층 구조별 폴더 생성
      if (hierarchy === 'grade-semester-subject') {
        // 학년 > 학기 > 과목 > 단원
        folderCount += createGradeSemesterSubjectFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      } else if (hierarchy === 'grade-subject-semester') {
        // 학년 > 과목 > 학기 > 단원
        folderCount += createGradeSubjectSemesterFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      } else {
        // 학년 > 과목 > 단원 (학기 없음)
        folderCount += createGradeSubjectFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      }
    }

    // 6. 기타 폴더 생성
    if (!existingFolderIds.has('etc')) {
      newFolders.push({
        id: 'etc',
        name: '📦 기타',
        parentId: null,
        type: 'folder',
        protected: true,
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add('etc');
      folderCount++;
    }

    // 미분류 폴더
    if (!existingFolderIds.has('unclassified')) {
      newFolders.push({
        id: 'unclassified',
        name: '📥 미분류',
        parentId: 'etc',
        type: 'folder',
        protected: true,
        createdAt: now,
        updatedAt: now
      });
      folderCount++;
    }

    // 7. 문서 업데이트
    if (newFolders.length > 0) {
      const allFolders = [...existingFolders, ...newFolders];
      
      if (jjimDoc.exists()) {
        await setDoc(jjimDocRef, {
          folders: allFolders,
          updatedAt: now
        }, { merge: true });
      } else {
        await setDoc(jjimDocRef, {
          folders: allFolders,
          videos: [],
          add_lists: [],
          createdAt: now,
          updatedAt: now
        });
      }
      
      console.log(`✅ 폴더 생성 완료! 새로 추가된 폴더: ${newFolders.length}개`);
    } else {
      console.log('ℹ️ 추가할 새 폴더 없음 (이미 존재)');
    }

    return folderCount;
  } catch (error) {
    console.error('❌ 폴더 생성 오류:', error);
    throw error;
  }
}

/**
 * 학년 > 학기 > 과목 > 단원 구조로 폴더 생성
 */
function createGradeSemesterSubjectFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;
  const semesters = [1, 2];

  for (const semester of semesters) {
    const semesterId = `${gradeId}-s${semester}`;
    
    // 학기 폴더 생성
    if (!existingFolderIds.has(semesterId)) {
      newFolders.push({
        id: semesterId,
        name: `${semester}학기`,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        metadata: { grade, semester },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(semesterId);
      count++;
    }

    // 과목 폴더 생성
    for (const subjectId of subjects) {
      const subjectInfo = SUBJECT_INFO[subjectId];
      if (!subjectInfo) continue;

      // 해당 학년에 해당 과목이 있는지 확인
      const semesterUnits = CURRICULUM_BY_SEMESTER[subjectId]?.[grade]?.[semester];
      if (!semesterUnits && ['soc', 'sci'].includes(subjectId) && grade < 3) continue;
      if (!semesterUnits && subjectId === 'prac' && grade < 5) continue;

      const subjectFolderId = `${semesterId}-${subjectId}`;
      
      if (!existingFolderIds.has(subjectFolderId)) {
        newFolders.push({
          id: subjectFolderId,
          name: subjectInfo.name,
          parentId: semesterId,
          type: 'folder',
          protected: true,
          color: subjectInfo.color,
          metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name },
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(subjectFolderId);
        count++;
      }

      // 단원 폴더 생성
      if (semesterUnits && semesterUnits.length > 0) {
        for (let i = 0; i < semesterUnits.length; i++) {
          const unitName = semesterUnits[i];
          const unitFolderId = `${subjectFolderId}-u${i + 1}`;

          if (!existingFolderIds.has(unitFolderId)) {
            newFolders.push({
              id: unitFolderId,
              name: `${i + 1}. ${unitName}`,
              parentId: subjectFolderId,
              type: 'folder',
              protected: false,
              metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name, unitNumber: i + 1, unitName },
              createdAt: now,
              updatedAt: now
            });
            existingFolderIds.add(unitFolderId);
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * 학년 > 과목 > 학기 > 단원 구조로 폴더 생성
 */
function createGradeSubjectSemesterFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;

  for (const subjectId of subjects) {
    const subjectInfo = SUBJECT_INFO[subjectId];
    if (!subjectInfo) continue;

    // 해당 학년에 해당 과목이 있는지 확인
    const subjectData = CURRICULUM_BY_SEMESTER[subjectId]?.[grade];
    if (!subjectData && ['soc', 'sci'].includes(subjectId) && grade < 3) continue;
    if (!subjectData && subjectId === 'prac' && grade < 5) continue;

    const subjectFolderId = `${gradeId}-${subjectId}`;
    
    // 과목 폴더 생성
    if (!existingFolderIds.has(subjectFolderId)) {
      newFolders.push({
        id: subjectFolderId,
        name: subjectInfo.name,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        color: subjectInfo.color,
        metadata: { grade, subject: subjectId, subjectName: subjectInfo.name },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(subjectFolderId);
      count++;
    }

    // 학기별 폴더 생성
    for (const semester of [1, 2]) {
      const semesterId = `${subjectFolderId}-s${semester}`;
      const semesterUnits = subjectData?.[semester];
      
      if (!existingFolderIds.has(semesterId)) {
        newFolders.push({
          id: semesterId,
          name: `${semester}학기`,
          parentId: subjectFolderId,
          type: 'folder',
          protected: true,
          metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name },
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(semesterId);
        count++;
      }

      // 단원 폴더 생성
      if (semesterUnits && semesterUnits.length > 0) {
        for (let i = 0; i < semesterUnits.length; i++) {
          const unitName = semesterUnits[i];
          const unitFolderId = `${semesterId}-u${i + 1}`;

          if (!existingFolderIds.has(unitFolderId)) {
            newFolders.push({
              id: unitFolderId,
              name: `${i + 1}. ${unitName}`,
              parentId: semesterId,
              type: 'folder',
              protected: false,
              metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name, unitNumber: i + 1, unitName },
              createdAt: now,
              updatedAt: now
            });
            existingFolderIds.add(unitFolderId);
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * 학년 > 과목 > 단원 구조로 폴더 생성 (학기 없음)
 */
function createGradeSubjectFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;

  for (const subjectId of subjects) {
    const subjectInfo = SUBJECT_INFO[subjectId];
    if (!subjectInfo) continue;

    // 해당 학년에 해당 과목이 있는지 확인
    const units = CURRICULUM_UNITS[subjectId]?.[grade];
    if (!units && ['soc', 'sci'].includes(subjectId) && grade < 3) continue;
    if (!units && subjectId === 'prac' && grade < 5) continue;

    const subjectFolderId = `${gradeId}-${subjectId}`;
    
    // 과목 폴더 생성
    if (!existingFolderIds.has(subjectFolderId)) {
      newFolders.push({
        id: subjectFolderId,
        name: subjectInfo.name,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        color: subjectInfo.color,
        metadata: { grade, subject: subjectId, subjectName: subjectInfo.name },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(subjectFolderId);
      count++;
    }

    // 단원 폴더 생성 (모든 학기 단원 합침)
    if (units && units.length > 0) {
      for (let i = 0; i < units.length; i++) {
        const unitName = units[i];
        const unitFolderId = `${subjectFolderId}-u${i + 1}`;

        if (!existingFolderIds.has(unitFolderId)) {
          newFolders.push({
            id: unitFolderId,
            name: `${i + 1}. ${unitName}`,
            parentId: subjectFolderId,
            type: 'folder',
            protected: false,
            metadata: { grade, subject: subjectId, subjectName: subjectInfo.name, unitNumber: i + 1, unitName },
            createdAt: now,
            updatedAt: now
          });
          existingFolderIds.add(unitFolderId);
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * 사용자의 기존 폴더 가져오기
 */
export async function getUserFolders(userId) {
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  const jjimDoc = await getDoc(jjimDocRef);
  
  if (jjimDoc.exists()) {
    return jjimDoc.data().folders || [];
  }
  return [];
}

/**
 * 폴더 존재 여부 확인
 */
export async function hasFolders(userId) {
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  const jjimDoc = await getDoc(jjimDocRef);
  
  if (jjimDoc.exists()) {
    const folders = jjimDoc.data().folders || [];
    return folders.length > 0;
  }
  return false;
}

