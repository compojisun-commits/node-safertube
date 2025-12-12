/**
 * 🎯 스마트 자동 분류기 v3.0
 * 
 * 핵심 개선사항:
 * 1. 명사 중심 키워드 추출 (서술어/부사/불용어 완전 제거)
 * 2. 2개 추천 시스템 (보수적 기존폴더 + 적극적 신규폴더)
 * 3. 키워드-경로 연관성 설명 (reason 필드)
 * 4. 교육과정 컨텍스트 기반 논리적 분류
 */

import { CurriculumDatabase, getFolderPath } from '../data/curriculumDatabase';

// ============================================
// 🔧 불용어 & 금지어 리스트 (대폭 확장)
// ============================================

// ⛔️ 절대 키워드로 사용 금지
const BANNED_WORDS = new Set([
  // 기능어
  '얼마나', '어떻게', '왜', '무엇을', '무엇이', '무엇', '어디', '언제', '누가', '누구',
  '하기', '하는', '되는', '할', '된', '한', '않는', '못하는', '싶은', '같은',
  '수', '적', '들', '것', '거', '게', '지', '데', '뿐',
  
  // 서술어 어근
  '있다', '없다', '되다', '하다', '않다', '싶다', '모르다', '알다', '보다', '듣다',
  '있는', '없는', '되는', '하는', '않는', '싶은', '모르는', '아는', '보는', '듣는',
  '있어', '없어', '돼', '해', '않아', '싶어', '몰라', '알아', '봐', '들어',
  '있으면', '없으면', '되면', '하면', '않으면',
  
  // 일반어/수식어
  '이유', '방법', '생각', '특징', '과정', '순서', '결과', '내용', '정보', '자료',
  '진짜', '완전', '대박', '꿀팁', '모음', '버전', '최종', '최신', '베스트', '추천',
  '간단', '쉬운', '어려운', '재미있는', '신기한', '놀라운', '중요한',
  '이거', '저거', '그거', '이것', '저것', '그것',
  
  // 조사/어미
  '의', '가', '이', '은', '는', '을', '를', '에', '에서', '와', '과', '도', '로', '으로',
  '부터', '까지', '처럼', '같이', '만', '조차', '마저',
  
  // 접속/부사
  '그리고', '그래서', '하지만', '그러나', '또한', '또', '및', '등', '외',
  '정말', '너무', '많이', '가장', '제일', '매우', '아주', '굉장히', '엄청',
  '모두', '함께', '다양한', '여러', '가지', '각종',
  
  // 시간/빈도
  '지금', '오늘', '내일', '어제', '이번', '저번', '다음', '지난', '올해', '작년',
  '다시', '계속', '자주', '항상', '매일', '가끔', '잠깐', '바로', '곧',
  
  // 플랫폼/형식 관련
  'EBS', 'YouTube', '유튜브', '틱톡', '인스타', '네이버', '카카오',
  '영상', '동영상', '강의', '수업', '공부', '학습', '자료', '파일', '문서',
  '리뷰', '후기', '정리', '요약', '설명', '소개', '특집', '특별', '스페셜',
  '보세요', '보러가기', '알아보아요', '살펴보아요', '알아봐요', '살펴봐요',
  '따라하기', '만들기', '그리기', '해보기', '배우기',
  '편', '화', '회', '부', '탄', '시리즈', '시즌',
]);

// 학년/과목 코드 매핑
const GRADE_MAP = {
  '1학년': '1학년', '2학년': '2학년', '3학년': '3학년', 
  '4학년': '4학년', '5학년': '5학년', '6학년': '6학년',
  'elementary-1': '1학년', 'elementary-2': '2학년', 'elementary-3': '3학년',
  'elementary-4': '4학년', 'elementary-5': '5학년', 'elementary-6': '6학년',
  'elementary-5-6': '5학년', 
  '초1': '1학년', '초2': '2학년', '초3': '3학년', 
  '초4': '4학년', '초5': '5학년', '초6': '6학년',
  'g1': '1학년', 'g2': '2학년', 'g3': '3학년',
  'g4': '4학년', 'g5': '5학년', 'g6': '6학년',
};

const SUBJECT_MAP = {
  '국어': '국어', '수학': '수학', '사회': '사회', '과학': '과학', '도덕': '도덕',
  '영어': '영어', '음악': '음악', '미술': '미술', '체육': '체육', '실과': '실과', '통합': '통합교과',
  'kor': '국어', 'math': '수학', 'soc': '사회', 'sci': '과학', 'moral': '도덕',
  'eng': '영어', 'music': '음악', 'art': '미술', 'pe': '체육', 'prac': '실과', 'int': '통합교과',
};

// 과목별 연관 키워드 (주제 추론용)
const SUBJECT_KEYWORD_HINTS = {
  '국어': ['글쓰기', '읽기', '말하기', '듣기', '문학', '시', '소설', '동화', '독서', '작문', '문법', '맞춤법', '받아쓰기', '일기', '편지', '발표', '토론', '낭독'],
  '수학': ['덧셈', '뺄셈', '곱셈', '나눗셈', '분수', '소수', '도형', '삼각형', '사각형', '원', '넓이', '부피', '그래프', '통계', '확률', '방정식', '비례', '비율', '약수', '배수', '각도'],
  '사회': ['지도', '지역', '도시', '농촌', '역사', '문화', '경제', '정치', '민주주의', '헌법', '선거', '인권', '환경', '지구촌', '세계', '독도', '한국사', '조선', '고려', '삼국'],
  '과학': ['실험', '관찰', '생물', '동물', '식물', '세포', '물질', '에너지', '힘', '운동', '전기', '자석', '빛', '소리', '열', '지구', '태양', '달', '별', '우주', '날씨', '계절', '환경'],
  '도덕': ['예절', '존중', '배려', '정직', '책임', '협동', '공정', '정의', '효도', '우정', '약속', '규칙', '생명', '평화', '나눔', '봉사'],
  '영어': ['알파벳', '단어', '문장', '회화', '발음', '문법', '읽기', '쓰기', '듣기', '말하기', '영단어', '파닉스'],
  '음악': ['노래', '악기', '리듬', '멜로디', '화음', '합창', '독창', '감상', '작곡', '연주', '피아노', '리코더', '국악', '클래식'],
  '미술': ['그림', '색칠', '조각', '공예', '디자인', '스케치', '수채화', '유화', '판화', '조소', '감상', '미술관', '작품'],
  '체육': ['운동', '달리기', '뛰기', '던지기', '수영', '축구', '농구', '야구', '배구', '배드민턴', '줄넘기', '체조', '무용', '건강', '스트레칭'],
  '실과': ['요리', '바느질', '목공', '전기', '로봇', '코딩', '프로그래밍', '식생활', '의생활', '주생활', '소비', '진로', '직업', '기술', '가정'],
};

// ============================================
// 🔑 명사 중심 키워드 추출 (v3.0)
// ============================================

/**
 * 텍스트에서 명사 형태의 핵심 키워드만 추출
 * @param {string} text - 입력 텍스트
 * @param {number} count - 추출할 키워드 수
 * @returns {string[]} 키워드 배열 (최소 1개 보장)
 */
export function extractNounKeywords(text, count = 3) {
  if (!text || typeof text !== 'string') {
    return ['미분류'];
  }

  // 1. 전처리: 특수문자 제거, 소문자화
  let cleaned = text
    .replace(/\[.*?\]/g, ' ')  // [ft. xxx] 같은 부가 정보 제거
    .replace(/\(.*?\)/g, ' ')  // (xxx) 제거
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .replace(/\d{4}년|\d{1,2}월|\d{1,2}일/g, ' ')
    .replace(/\d+분|\d+초|\d+시간|\d+편|\d+화/g, ' ')
    .toLowerCase();

  // 2. 단어 분리 및 필터링
  const words = cleaned
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .filter(w => !BANNED_WORDS.has(w))
    .filter(w => !/^\d+$/.test(w))
    // 서술어 어미 패턴 제거 (-다, -요, -죠, -까, -네, -면)
    .filter(w => !/[다요죠까네면]$/.test(w) || w.length <= 2)
    // 의문형/감탄형 패턴 제거
    .filter(w => !/[?!~]/.test(w));

  // 3. 명사 추정: 2글자 이상, 불용어 아닌 것
  const nouns = words.filter(w => {
    // 영어는 3글자 이상
    if (/^[a-z]+$/.test(w)) return w.length >= 3;
    // 한글은 2글자 이상
    return w.length >= 2;
  });

  // 4. 빈도 계산 및 정렬
  const freq = {};
  nouns.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  
  const sorted = Object.entries(freq)
    .sort((a, b) => {
      // 빈도 우선, 같으면 길이 우선 (더 구체적인 단어)
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    })
    .map(([word]) => word);

  // 5. 결과 반환 (최소 1개 보장)
  if (sorted.length >= count) {
    return sorted.slice(0, count);
  }

  // 부족하면 원본에서 추가 추출 시도
  const fallback = text
    .replace(/[^\sㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !BANNED_WORDS.has(w.toLowerCase()));

  const combined = [...new Set([...sorted, ...fallback])];
  
  return combined.length > 0 
    ? combined.slice(0, count) 
    : ['미분류'];
}

/**
 * 키워드로 과목 추론
 */
export function inferSubjectFromKeywords(keywords) {
  const scores = {};
  
  Object.entries(SUBJECT_KEYWORD_HINTS).forEach(([subject, hints]) => {
    let score = 0;
    keywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      hints.forEach(hint => {
        if (hint.includes(kwLower) || kwLower.includes(hint)) {
          score += 10;
        }
      });
    });
    if (score > 0) scores[subject] = score;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

// ============================================
// 📁 폴더 매칭 & 경로 생성
// ============================================

/**
 * 사용자 폴더 목록을 경로 문자열 배열로 변환
 */
export function buildFolderPathList(folders) {
  if (!folders || folders.length === 0) return [];

  const pathList = [];
  
  const getFullPath = (folderId) => {
    const pathParts = [];
    let currentId = folderId;
    let safe = 0;
    
    while (currentId && safe < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        pathParts.unshift(folder.name);
        currentId = folder.parentId;
      } else break;
      safe++;
    }
    
    return pathParts.join('/');
  };

  folders.forEach(folder => {
    const fullPath = getFullPath(folder.id);
    if (fullPath) {
      pathList.push({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        fullPath,
      });
    }
  });

  return pathList;
}

/**
 * 키워드와 폴더 경로의 연관성 점수 계산
 */
function calculateRelevanceScore(keywords, folderPath) {
  const pathLower = folderPath.toLowerCase();
  const pathParts = pathLower.split('/');
  
  let score = 0;
  const matchedParts = [];

  // 키워드가 경로에 포함되는지 확인
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    pathParts.forEach(part => {
      if (part.includes(kwLower) || kwLower.includes(part)) {
        score += 50;
        if (!matchedParts.includes(part)) matchedParts.push(part);
      }
    });
  });

  // 과목명 매칭 보너스
  Object.values(SUBJECT_MAP).forEach(subj => {
    if (pathLower.includes(subj.toLowerCase())) {
      const inferredSubj = inferSubjectFromKeywords(keywords);
      if (inferredSubj === subj) {
        score += 30;
      }
    }
  });

  return { score, matchedParts };
}

/**
 * 기존 폴더에서 가장 적합한 폴더 찾기 (보수적 접근)
 */
export function findBestExistingFolder(keywords, folders) {
  const pathList = buildFolderPathList(folders);
  if (pathList.length === 0) return null;

  const scored = pathList.map(folder => {
    const { score, matchedParts } = calculateRelevanceScore(keywords, folder.fullPath);
    return { ...folder, score, matchedParts };
  });

  scored.sort((a, b) => b.score - a.score);

  // 점수가 있는 폴더만 반환
  const best = scored.find(f => f.score > 0);
  return best || null;
}

/**
 * 새 폴더 경로 생성 (적극적 접근)
 * 형식: "학년/과목/단원명 또는 핵심주제"
 */
export function generateNewFolderPath(keywords, grade, subject) {
  const gradeName = GRADE_MAP[grade] || grade || '미분류';
  const subjectName = SUBJECT_MAP[subject] || subject || inferSubjectFromKeywords(keywords) || '기타';
  
  // 키워드 중 가장 적합한 것을 단원명으로 사용
  const topicKeyword = keywords[0] || '새 폴더';
  
  return `${gradeName}/${subjectName}/${topicKeyword}`;
}

/**
 * 추천 이유 생성
 */
function generateReason(keywords, path, isNew) {
  const keywordStr = keywords.slice(0, 2).join(', ');
  
  if (isNew) {
    return `키워드 '${keywordStr}'를 기반으로 새 분류 경로를 제안합니다.`;
  }
  
  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  return `키워드 '${keywordStr}'이(가) '${lastPart}' 폴더와 연관성이 높습니다.`;
}

// ============================================
// 🎯 메인 스마트 분류 함수 (v3.0)
// ============================================

/**
 * 스마트 파일 분류 - 2개 추천 반환
 * @param {Object} videoInfo - { title, description, tags }
 * @param {Array} userFolders - 사용자의 찜보따리 폴더 목록
 * @param {Object} options - { grade, subject }
 * @returns {Object} 분류 결과 (recommendations 배열 포함)
 */
export function smartClassify(videoInfo, userFolders = [], options = {}) {
  const { title = '', description = '', tags = [] } = videoInfo;
  const { grade, subject } = options;

  // 1. 전체 텍스트 구성
  const fullText = `${title} ${description} ${(tags || []).join(' ')}`;
  
  console.log('\n========================================');
  console.log('🎯 스마트 분류 v3.0 시작');
  console.log('========================================');
  console.log('📝 입력:', fullText.slice(0, 80) + (fullText.length > 80 ? '...' : ''));

  // 2. 명사 중심 키워드 추출
  const keywords = extractNounKeywords(fullText, 3);
  console.log('🔑 추출 키워드:', keywords.join(', '));

  // 3. 추천 결과 배열
  const recommendations = [];

  // ===== 옵션 A: 보수적 접근 (기존 폴더에서 찾기) =====
  const existingMatch = findBestExistingFolder(keywords, userFolders);
  
  if (existingMatch && existingMatch.score > 0) {
    recommendations.push({
      rank: 1,
      path: existingMatch.fullPath,
      folderId: existingMatch.id,
      folderName: existingMatch.name,
      isNewFolder: false,
      keywords: keywords,
      reason: generateReason(keywords, existingMatch.fullPath, false),
      score: existingMatch.score,
      matchedParts: existingMatch.matchedParts,
    });
  }

  // ===== 옵션 B: 적극적 접근 (새 폴더 경로 제안) =====
  const newPath = generateNewFolderPath(keywords, grade, subject);
  
  // 이미 같은 경로가 존재하는지 확인
  const pathList = buildFolderPathList(userFolders);
  const pathExists = pathList.some(p => p.fullPath.toLowerCase() === newPath.toLowerCase());
  
  if (!pathExists) {
    recommendations.push({
      rank: recommendations.length + 1,
      path: newPath,
      folderId: null,
      folderName: keywords[0] || '새 폴더',
      isNewFolder: true,
      keywords: keywords,
      reason: generateReason(keywords, newPath, true),
      score: 0,
      matchedParts: [],
    });
  }

  // 4. 추천이 없으면 폴백
  if (recommendations.length === 0) {
    const fallbackPath = generateNewFolderPath(keywords, grade, subject);
    recommendations.push({
      rank: 1,
      path: fallbackPath,
      folderId: null,
      folderName: keywords[0] || '미분류',
      isNewFolder: true,
      keywords: keywords,
      reason: '적합한 기존 폴더가 없어 새 경로를 제안합니다.',
      score: 0,
      matchedParts: [],
    });
  }

  // 5. 순위 재정렬 (점수 기준)
  recommendations.sort((a, b) => b.score - a.score);
  recommendations.forEach((rec, idx) => { rec.rank = idx + 1; });

  // 6. 결과 구성
  const result = {
    // 1순위 추천 (기존 호환성 유지)
    recommendedPath: recommendations[0].path,
    isNewPath: recommendations[0].isNewFolder,
    targetFolder: recommendations[0].isNewFolder ? null : {
      id: recommendations[0].folderId,
      name: recommendations[0].folderName,
      path: recommendations[0].path,
    },
    newFolderSuggestion: recommendations[0].isNewFolder ? {
      path: recommendations[0].path,
      name: recommendations[0].folderName,
    } : null,
    
    // 키워드 (절대 빈 배열 아님)
    matchingKeywords: keywords,
    
    // 신뢰도
    confidenceScore: Math.min(recommendations[0].score + 30, 100),
    
    // 🆕 2개 추천 배열
    recommendations: recommendations.slice(0, 2),
    
    // 디버그
    debug: {
      fullText: fullText.slice(0, 100),
      extractedKeywords: keywords,
      totalFolders: userFolders.length,
      recommendationCount: recommendations.length,
    },
  };

  console.log('----------------------------------------');
  console.log('✅ 1순위:', result.recommendations[0]?.path);
  if (result.recommendations[1]) {
    console.log('✅ 2순위:', result.recommendations[1]?.path);
  }
  console.log('🔑 키워드:', result.matchingKeywords.join(', '));
  console.log('📊 신뢰도:', result.confidenceScore + '%');
  console.log('========================================\n');

  return result;
}

/**
 * 여러 비디오를 일괄 분류
 */
export function smartClassifyBatch(videos, userFolders, options = {}) {
  return videos.map(video => {
    const videoInfo = {
      title: video.title || '',
      description: video.memo || video.description || '',
      tags: video.tags || [],
    };

    const result = smartClassify(videoInfo, userFolders, options);

    return {
      videoId: video.id,
      videoTitle: video.title,
      ...result,
    };
  });
}

// ============================================
// 🤖 AI 기반 족집게 분류 (Gemini API)
// ============================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Gemini AI를 활용한 족집게 교육과정 매칭
 * @param {string} fileName - 파일명/제목
 * @param {string} grade - 학년 (예: '6학년')
 * @param {string} subject - 과목 (예: '사회')
 * @param {Array} existingFolders - 기존 폴더 목록
 * @param {string} curriculumContext - 교육과정 컨텍스트
 * @returns {Promise<Object>} AI 분류 결과
 */
export async function aiClassifyWithGemini(fileName, grade, subject, existingFolders = [], curriculumContext = "") {
  // 폴더 목록을 경로 문자열로 변환
  const folderPaths = buildFolderPathList(existingFolders);
  const folderListString = folderPaths.length > 0 
    ? folderPaths.map(f => f.fullPath).join("\n")
    : "(폴더 없음)";

  const gradeName = GRADE_MAP[grade] || grade || '6학년';
  const subjectName = SUBJECT_MAP[subject] || subject || '전과목';

  const prompt = `당신은 대한민국 초등학교 ${gradeName} ${subjectName} 교육과정을 완벽히 꿰뚫고 있는 **수석 교사**입니다.
파일명을 보고 교과서의 **어느 단원(성취기준)**에 해당하는지 파악하여 최적의 저장 경로를 찾아주세요.

**[분석 대상]**
파일명: "${fileName}"
교육과정 참고자료: ${curriculumContext ? curriculumContext.slice(0, 800) : "초등 5~6학년 사회(민주주의, 역사), 국어, 수학, 과학, 실과 등 일반 교과 과정"}

**[현재 찜보따리 폴더]**
${folderListString}

---

**[💡 사고 과정 (Step-by-Step)]**

**STEP 1. 주제 파악**
- 파일명을 보자마자 떠오르는 교과서 핵심 개념을 찾으세요.
- 예: "비상계엄" -> 민주주의의 발전 -> **사회과 민주 정치**
- 예: "단백질 쉐이크" -> 영양소, 식습관 -> **실과 균형 잡힌 식생활**

**STEP 2. 경로 결정**
- **[현재 찜보따리 폴더]**에 이 주제와 딱 맞는 폴더가 있다면? -> 그대로 선택 (isNewFolder: false)
- 없다면? -> 교과서 단원명 기준으로 새 경로 생성 (isNewFolder: true)
- 새 경로 형식: ${gradeName}/${subjectName}/[단원명 또는 핵심주제]

**STEP 3. 키워드 추출**
- 선생님이 검색창에 칠 법한 **'명사'** 3개만 뽑으세요.

---

**[응답 형식 - 반드시 JSON만 출력]**
{
  "recommendations": [
    {
      "rank": 1,
      "path": "추천 경로",
      "isNewFolder": true/false,
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "reason": "이 경로를 추천하는 이유 (키워드와 교과 연결성 설명)"
    },
    {
      "rank": 2,
      "path": "대안 경로",
      "isNewFolder": true/false,
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "reason": "대안 경로 추천 이유"
    }
  ]
}

JSON만 출력:`;

  try {
    console.log('\n🤖 [AI 분류] Gemini API 호출 중...');
    console.log('📝 파일명:', fileName);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // 낮은 온도로 일관성 있는 응답
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ AI 응답에서 JSON을 찾을 수 없음, 규칙 기반으로 폴백');
      return null;
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    
    console.log('✅ [AI 분류 완료]');
    if (aiResult.recommendations?.[0]) {
      console.log('  1순위:', aiResult.recommendations[0].path);
      console.log('  키워드:', aiResult.recommendations[0].keywords?.join(', '));
      console.log('  이유:', aiResult.recommendations[0].reason);
    }

    // 결과를 smartClassify 형식으로 변환
    const recommendations = (aiResult.recommendations || []).map((rec, idx) => {
      // 기존 폴더에서 매칭되는지 확인
      const existingFolder = folderPaths.find(f => 
        f.fullPath.toLowerCase() === rec.path?.toLowerCase() ||
        f.name.toLowerCase() === rec.path?.split('/').pop()?.toLowerCase()
      );

      return {
        rank: rec.rank || idx + 1,
        path: rec.path || `${gradeName}/${subjectName}/미분류`,
        folderId: existingFolder?.id || null,
        folderName: rec.path?.split('/').pop() || '미분류',
        isNewFolder: rec.isNewFolder !== false && !existingFolder,
        keywords: rec.keywords || extractNounKeywords(fileName, 3),
        reason: rec.reason || '교육과정 기반 AI 분류',
        score: idx === 0 ? 100 : 70,
        matchedParts: [],
        isAiGenerated: true,
      };
    });

    // 추천이 없으면 null 반환 (규칙 기반으로 폴백)
    if (recommendations.length === 0) return null;

    return {
      recommendedPath: recommendations[0].path,
      isNewPath: recommendations[0].isNewFolder,
      targetFolder: recommendations[0].isNewFolder ? null : {
        id: recommendations[0].folderId,
        name: recommendations[0].folderName,
        path: recommendations[0].path,
      },
      newFolderSuggestion: recommendations[0].isNewFolder ? {
        path: recommendations[0].path,
        name: recommendations[0].folderName,
      } : null,
      matchingKeywords: recommendations[0].keywords,
      confidenceScore: 90, // AI 분류는 높은 신뢰도
      recommendations: recommendations.slice(0, 2),
      isAiClassified: true,
      debug: {
        model: 'gemini-2.0-flash-exp',
        fileName,
        grade: gradeName,
        subject: subjectName,
      },
    };
  } catch (error) {
    console.error('❌ [AI 분류 실패]', error);
    return null; // 실패 시 null 반환 → 규칙 기반으로 폴백
  }
}

/**
 * 하이브리드 스마트 분류 (AI 우선 + 규칙 기반 폴백)
 * @param {Object} videoInfo - { title, description, tags }
 * @param {Array} userFolders - 사용자 폴더 목록
 * @param {Object} options - { grade, subject, useAi }
 * @returns {Promise<Object>} 분류 결과
 */
export async function smartClassifyHybrid(videoInfo, userFolders = [], options = {}) {
  const { title = '', description = '', tags = [] } = videoInfo;
  const { grade, subject, useAi = true, curriculumContext = '' } = options;

  const fullText = `${title} ${description} ${(tags || []).join(' ')}`;

  // AI 분류 시도 (useAi가 true이고 API 키가 있을 때)
  if (useAi && GEMINI_API_KEY) {
    try {
      const aiResult = await aiClassifyWithGemini(
        title || fullText.slice(0, 100),
        grade,
        subject,
        userFolders,
        curriculumContext
      );

      if (aiResult && aiResult.recommendations?.length > 0) {
        console.log('🎯 AI 분류 결과 사용');
        return aiResult;
      }
    } catch (error) {
      console.warn('AI 분류 실패, 규칙 기반으로 폴백:', error);
    }
  }

  // AI 실패 시 규칙 기반 분류
  console.log('📋 규칙 기반 분류 사용');
  return smartClassify(videoInfo, userFolders, options);
}

// ============================================
// 🧪 테스트 함수
// ============================================

export function testSmartClassify(title, folders = [], options = {}) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 스마트 분류 v3.0 테스트                                   ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ 입력:', title.slice(0, 50));
  console.log('║ 폴더 수:', folders.length);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const result = smartClassify({ title }, folders, options);

  console.log('\n[추천 결과]');
  result.recommendations.forEach(rec => {
    console.log(`  ${rec.rank}순위: ${rec.path}`);
    console.log(`    - 새 폴더: ${rec.isNewFolder ? 'Yes' : 'No'}`);
    console.log(`    - 키워드: ${rec.keywords.join(', ')}`);
    console.log(`    - 이유: ${rec.reason}`);
  });

  return result;
}

// 테스트 예시
export function runTests() {
  console.log('\n\n========== 스마트 분류기 v3.0 테스트 ==========\n');
  
  const testFolders = [
    { id: '1', name: '6학년', parentId: null },
    { id: '2', name: '국어', parentId: '1' },
    { id: '3', name: '수학', parentId: '1' },
    { id: '4', name: '과학', parentId: '1' },
    { id: '5', name: '실험 관찰', parentId: '4' },
  ];

  const testCases = [
    '하루한끼 단백질쉐이크로 대체해보면 얼마나 빠질까?',
    '교양 없으면 안 되는 이유 [ft. 영화평론가가 역사 얘기해도 되는 이유]',
    '6학년 과학 식물의 구조 실험 영상',
    '분수의 덧셈과 뺄셈 쉽게 배우기',
  ];

  testCases.forEach(title => {
    testSmartClassify(title, testFolders, { grade: '6학년', subject: '과학' });
    console.log('\n---\n');
  });
}

export default {
  smartClassify,
  smartClassifyBatch,
  smartClassifyHybrid, // 🆕 AI + 규칙 하이브리드
  aiClassifyWithGemini, // 🆕 AI 전용
  extractNounKeywords,
  inferSubjectFromKeywords,
  findBestExistingFolder,
  generateNewFolderPath,
  buildFolderPathList,
  testSmartClassify,
  runTests,
  // 기존 호환성 유지
  extractKeywordsGuaranteed: extractNounKeywords,
};
