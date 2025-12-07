/**
 * AI 자동 분류 유틸리티 - 초등 교과 자료 분류기
 * 
 * ## 🚨 Critical Rules
 * 
 * ### Rule 1. 메타데이터는 분류 근거에서 제외
 * - 날짜/연도: 2025., 12.3, 12월, 2024년
 * - 순서/회차: 1부, 2부, Part 1, Ep.3
 * - 시간/기간: 6시간, 1주년, 10분, 30초
 * 
 * ### Rule 2. 사회/역사 키워드의 절대 우위 (Semantic Override)
 * - 계엄, 쿠데타, 민주주의, 대통령, 내란 등 발견 시
 * - 수학 매칭 가능성 = 0% (강제)
 * - 즉시 사회 > 민주주의 폴더로 강제 할당
 * 
 * ### Rule 3. 검증 시뮬레이션
 * - "이 숫자가 수학적 연산용인가, 날짜/시간인가?"
 * - 날짜/시간이면 수학 폴더 배정 취소
 * 
 * ### Rule 4. Entity > Action (대상 우선의 법칙) ⚖️
 * - 구체적 대상/고유명사(Entity)가 행위(Action)보다 우선
 * - "UN 토의" → 'UN'이니까 국제기구 (O), '토의'니까 민주주의 (X)
 * - "독도 홍보하기" → '독도'니까 영토/역사 (O)
 * 
 * ### Rule 5. Top-N 후보 추천 시스템
 * - 1순위와 2순위 점수 차이가 10% 미만이면 ambiguous: true
 * - 사용자에게 선택지 제공
 * 
 * Scoring:
 * - Entity Keyword Match: +500점 (대상 우선)
 * - Action Keyword Match: +50점 (행위는 낮은 점수)
 * - Critical Keyword Match: +1000점 (즉시 확정)
 * - Semantic Override: +2000점 (최우선)
 * - Subject Mismatch: -9999점 (절대 금지)
 */

import { CurriculumDatabase, getFolderPath } from '../data/curriculumDatabase';

// ============================================
// 🚨 Rule 2: 강력한 의미어 (Semantic Override) - 최우선!
// 이 단어들이 있으면 무조건 사회/역사로 강제 분류
// ============================================
const SEMANTIC_OVERRIDE_WORDS = [
  // 정치/민주주의 (시사)
  '계엄', '쿠데타', '내란', '시위', '혁명', '탄핵', '항쟁',
  '민주주의', '민주화', '민주', '독재', '군부',
  '대통령', '국회', '법원', '헌법', '헌재', '헌법재판소',
  '선거', '투표', '정당', '야당', '여당', '국민의힘', '민주당',
  '광화문', '청와대', '용산', '검찰', '경찰',
  
  // 역사적 사건
  '4.19', '4·19', '5.18', '5·18', '6월항쟁', '12.12', '12·12',
  '광복', '독립운동', '3.1운동', '3·1운동', '임시정부',
  '일제', '식민지', '해방', '분단',
  
  // 북한/통일
  '북한', '김정은', '김정일', '김일성', '평양', '핵무기', '미사일',
  '통일', '남북', '휴전선', 'DMZ', '판문점', '이산가족',
  
  // 국제/외교
  '외교', '정상회담', '대사관', '유엔', 'UN', '안보리',
  
  // 영토
  '독도', '우리땅', '영토', '동해', '일본해'
];

// Semantic Override 시 분류할 폴더
const SEMANTIC_OVERRIDE_FOLDER = 'g6-s1-soc-u1'; // 6-1 사회 > 우리나라의 정치 발전

// ============================================
// ⚖️ Rule 4: Entity(대상) vs Action(행위) 키워드
// Entity가 발견되면 Action의 가중치를 무시
// ============================================

// Entity 키워드 (구체적 대상/고유명사) - 높은 가중치 (+500)
const ENTITY_KEYWORDS = {
  // 국제기구/세계
  'UN': 'g6-s2-soc-u2-sub2',
  '유엔': 'g6-s2-soc-u2-sub2',
  '국제기구': 'g6-s2-soc-u2-sub2',
  '안보리': 'g6-s2-soc-u2-sub2',
  'WHO': 'g6-s2-soc-u2-sub2',
  'UNESCO': 'g6-s2-soc-u2-sub2',
  'UNICEF': 'g6-s2-soc-u2-sub2',
  'NGO': 'g6-s2-soc-u2-sub2',
  '적십자': 'g6-s2-soc-u2-sub2',
  '난민': 'g6-s2-soc-u2-sub2',
  '지구촌': 'g6-s2-soc-u2-sub2',
  
  // 영토/역사
  '독도': 'g6-s2-soc-u2-sub1',
  '동해': 'g6-s2-soc-u2-sub1',
  '영토': 'g6-s2-soc-u2-sub1',
  '우리땅': 'g6-s2-soc-u2-sub1',
  
  // 북한/통일
  '북한': 'g6-s2-soc-u2-sub1',
  '통일': 'g6-s2-soc-u2-sub1',
  '남북': 'g6-s2-soc-u2-sub1',
  '김정은': 'g6-s2-soc-u2-sub1',
  '평양': 'g6-s2-soc-u2-sub1',
  '휴전선': 'g6-s2-soc-u2-sub1',
  'DMZ': 'g6-s2-soc-u2-sub1',
  '이산가족': 'g6-s2-soc-u2-sub1',
  
  // 나라 이름
  '중국': 'g6-s2-soc-u1-sub3',
  '일본': 'g6-s2-soc-u1-sub3',
  '러시아': 'g6-s2-soc-u1-sub3',
  '미국': 'g6-s2-soc-u1-sub3',
  
  // 대륙/지역
  '아시아': 'g6-s2-soc-u1-sub1',
  '유럽': 'g6-s2-soc-u1-sub1',
  '아프리카': 'g6-s2-soc-u1-sub1',
  '아메리카': 'g6-s2-soc-u1-sub1',
  '오세아니아': 'g6-s2-soc-u1-sub1',
  
  // 환경/생태
  '기후변화': 'g6-s2-sci-u4',
  '지구온난화': 'g6-s2-sci-u4',
  '환경오염': 'g6-s2-sci-u2-sub2',
  '생태계': 'g6-s2-sci-u2',
  
  // 우주/천체
  '태양계': 'g6-s2-sci-u1',
  '행성': 'g6-s2-sci-u1',
  '화성': 'g6-s2-sci-u1',
  '목성': 'g6-s2-sci-u1',
  '북극성': 'g6-s2-sci-u1-sub3',
};

// Action 키워드 (행위/활동) - 낮은 가중치 (+50)
// 이 키워드들은 Entity가 있으면 무시됨
const ACTION_KEYWORDS = [
  // 민주주의 활동 (민주주의 단원으로 유도되기 쉬움)
  '토의', '토론', '회의', '투표', '선거',
  '의견', '주장', '발표', '참여', '실천',
  '합의', '결정', '규칙', '약속',
  
  // 일반 학습 활동
  '조사', '탐구', '관찰', '실험', '체험',
  '만들기', '그리기', '쓰기', '읽기',
  '정리', '분류', '비교', '분석',
  '홍보', '캠페인', '발표회', '전시회',
];

// ============================================
// 🔀 Rule 6: 교차 키워드 충돌 감지 (Cross-Keyword Detection)
// 서로 다른 대단원의 키워드가 동시에 발견되면 다중 후보 제안
// ============================================

// 대단원(Unit) 카테고리 매핑 - 키워드 → 카테고리
const KEYWORD_CATEGORY_MAP = {
  // 🏛️ 민주주의/정치 (6-1 사회 > 우리나라의 정치 발전)
  DEMOCRACY: {
    folderId: 'g6-s1-soc-u1',
    name: '우리나라의 정치 발전',
    keywords: ['토의', '토론', '회의', '투표', '선거', '민주', '민주주의', '주민자치', '참여', '의견', '합의', '결정', '규칙', '모의']
  },
  
  // 🌍 국제기구/지구촌 (6-2 사회 > 지구촌의 평화와 발전)
  GLOBAL: {
    folderId: 'g6-s2-soc-u2-sub2',
    name: '지구촌의 평화와 발전',
    keywords: ['UN', '유엔', '국제기구', '국제', 'WHO', 'UNESCO', 'UNICEF', 'NGO', '적십자', '난민', '지구촌', '세계', '평화', '분쟁', '갈등해결']
  },
  
  // 🗺️ 세계 여러 나라 (6-2 사회 > 세계의 여러 나라들)
  WORLD: {
    folderId: 'g6-s2-soc-u1',
    name: '세계의 여러 나라들',
    keywords: ['대륙', '아시아', '유럽', '아프리카', '아메리카', '오세아니아', '세계지도', '지구본', '기후', '문화', '중국', '일본', '러시아']
  },
  
  // 🇰🇷 통일/독도 (6-2 사회 > 한반도의 미래와 통일)
  UNIFICATION: {
    folderId: 'g6-s2-soc-u2-sub1',
    name: '한반도의 미래와 통일',
    keywords: ['독도', '우리땅', '영토', '동해', '통일', '남북', '북한', '김정은', '평양', '휴전선', 'DMZ', '이산가족', '분단']
  },
  
  // 🔬 과학 - 생태계 (6-2 과학 > 생물과 환경)
  ECOLOGY: {
    folderId: 'g6-s2-sci-u2',
    name: '생물과 환경',
    keywords: ['생태계', '먹이사슬', '환경', '환경보호', '멸종', '생물', '동물', '식물']
  },
  
  // 🌡️ 과학 - 기후변화 (6-2 과학 > 기후변화와 우리 생활)
  CLIMATE: {
    folderId: 'g6-s2-sci-u4',
    name: '기후변화와 우리 생활',
    keywords: ['기후변화', '지구온난화', '온실가스', '탄소', '환경오염', '북극곰']
  },
  
  // 🌌 과학 - 우주 (6-2 과학 > 밤하늘 관찰)
  SPACE: {
    folderId: 'g6-s2-sci-u1',
    name: '밤하늘 관찰',
    keywords: ['태양계', '행성', '달', '별', '별자리', '북극성', '우주', '화성', '목성']
  }
};

// 텍스트에서 감지된 카테고리들 반환
const detectCategories = (text) => {
  const lowerText = text.toLowerCase();
  const detectedCategories = [];
  
  for (const [categoryId, category] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    const matchedKeywords = category.keywords.filter(kw => 
      lowerText.includes(kw.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      detectedCategories.push({
        categoryId,
        ...category,
        matchedKeywords,
        score: matchedKeywords.length * 50 // 각 키워드당 50점
      });
    }
  }
  
  // 점수순 정렬
  detectedCategories.sort((a, b) => b.score - a.score);
  
  return detectedCategories;
};

// 충돌 여부 체크 (서로 다른 대단원의 키워드가 동시에 발견됨)
const checkCategoryConflict = (text) => {
  const categories = detectCategories(text);
  
  if (categories.length < 2) {
    return { hasConflict: false, categories };
  }
  
  const first = categories[0];
  const second = categories[1];
  
  // 점수 차이가 20점 이내이거나, 서로 다른 카테고리면 충돌
  const scoreDiff = first.score - second.score;
  const isDifferentCategory = first.categoryId !== second.categoryId;
  
  if (isDifferentCategory && scoreDiff <= 20) {
    return {
      hasConflict: true,
      reason: `'${first.matchedKeywords[0]}(${first.name})'와 '${second.matchedKeywords[0]}(${second.name})' 키워드가 충돌합니다.`,
      categories: categories.slice(0, 3), // 상위 3개까지
      first,
      second
    };
  }
  
  return { hasConflict: false, categories };
};

// ============================================
// 🧬 Rule 7: 단원명 완전 일치 보너스 (Exact Title Match Bonus)
// 입력 텍스트가 단원명과 일치하면 x2.0 가중치
// ============================================

// 텍스트 정규화
const normalizeText = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// 텍스트 유사도 계산 (개선된 버전)
const calculateSimilarity = (text1, text2) => {
  const s1 = normalizeText(text1);
  const s2 = normalizeText(text2);
  
  // 1. 완전 포함 체크 (한쪽이 다른 쪽을 완전히 포함)
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length >= s2.length ? s1 : s2;
    return shorter.length / longer.length;
  }
  
  // 2. 핵심 단어 추출 (조사 제거)
  const extractCoreWords = (str) => {
    return str
      .replace(/을|를|이|가|은|는|의|에|에서|와|과|로|으로|하기|하는/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
  };
  
  const words1 = extractCoreWords(s1);
  const words2 = extractCoreWords(s2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // 3. 단어 매칭 점수 (부분 일치도 허용)
  let matchCount = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w1.includes(w2) || w2.includes(w1) || w1 === w2)) {
      matchCount++;
    }
  });
  
  // 4. 최종 유사도 = 매칭된 단어 / 전체 단어
  const totalWords = Math.max(words1.length, words2.length);
  return matchCount / totalWords;
};

// 단원명 추출 패턴 (예: "6단원", "6.", "6단원 정보와 표현")
const extractUnitInfo = (text) => {
  // "6단원", "제6단원", "6." 등 패턴
  const unitPatterns = [
    /(\d+)\s*단원\s*(.+)/i,
    /제?\s*(\d+)\s*\.\s*(.+)/i,
    /(\d+)\s*과\s*(.+)/i,
  ];
  
  for (const pattern of unitPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        unitNumber: parseInt(match[1]),
        unitTitle: match[2].trim(),
        fullMatch: match[0]
      };
    }
  }
  
  return null;
};

// 단원명 완전 일치 검사 및 보너스 점수 계산
const checkExactTitleMatch = (text) => {
  const unitInfo = extractUnitInfo(text);
  const matches = [];
  const textNorm = normalizeText(text);
  
  console.log(`🔍 단원명 검색 중: "${text.substring(0, 40)}..."`);
  
  // 모든 단원과 비교
  CurriculumDatabase.hierarchy.forEach(folder => {
    if (!folder.name) return;
    
    const folderNameNorm = normalizeText(folder.name);
    
    // 단원 번호가 있는 폴더명인지 체크
    const folderUnitInfo = extractUnitInfo(folder.name);
    
    // 전체 텍스트와 폴더명의 유사도 계산
    const similarity = calculateSimilarity(text, folder.name);
    
    // 직접 포함 체크 (단원명의 핵심 부분이 텍스트에 포함되어 있는지)
    const folderCore = folder.name.replace(/^\d+\.\s*/, '').replace(/을|를|이|가|은|는/g, '');
    const textContainsFolder = textNorm.includes(normalizeText(folderCore));
    const folderContainsText = folderNameNorm.includes(textNorm.substring(0, Math.min(15, textNorm.length)));
    
    // 단원 번호 일치 체크
    const unitNumberMatch = unitInfo && folderUnitInfo && unitInfo.unitNumber === folderUnitInfo.unitNumber;
    
    // 매칭 조건 (더 유연하게)
    const isMatch = 
      similarity >= 0.5 ||  // 50% 이상 유사
      textContainsFolder || // 텍스트가 단원명 핵심 포함
      (unitNumberMatch && similarity >= 0.3) || // 단원번호 일치 + 30% 유사
      (folderContainsText && similarity >= 0.2); // 폴더가 텍스트 포함 + 20% 유사
    
    if (isMatch) {
      // 보너스 계산 (유사도에 따라)
      let bonusMultiplier = 1.0;
      if (textContainsFolder || similarity >= 0.7) {
        bonusMultiplier = 2.0;
      } else if (unitNumberMatch && similarity >= 0.4) {
        bonusMultiplier = 1.8;
      } else if (similarity >= 0.5) {
        bonusMultiplier = 1.5;
      } else {
        bonusMultiplier = 1.2;
      }
      
      matches.push({
        folder,
        similarity,
        unitNumberMatch,
        textContainsFolder,
        folderContainsText,
        bonusMultiplier
      });
    }
  });
  
  // 유사도 순 정렬 (textContainsFolder 우선)
  matches.sort((a, b) => {
    if (a.textContainsFolder && !b.textContainsFolder) return -1;
    if (!a.textContainsFolder && b.textContainsFolder) return 1;
    return b.similarity - a.similarity;
  });
  
  if (matches.length > 0) {
    const best = matches[0];
    console.log(`🧬 [EXACT TITLE MATCH] 발견!`);
    console.log(`   입력: "${text.substring(0, 40)}..."`);
    console.log(`   매칭: "${best.folder.name}"`);
    console.log(`   유사도: ${Math.round(best.similarity * 100)}%, 보너스: x${best.bonusMultiplier}`);
    console.log(`   단원번호 일치: ${best.unitNumberMatch ? 'O' : 'X'}, 직접포함: ${best.textContainsFolder ? 'O' : 'X'}`);
  } else {
    console.log(`🧬 [EXACT TITLE MATCH] 일치하는 단원 없음`);
  }
  
  return matches;
};

// ============================================
// 🧬 Rule 8: 과목별 쿼터제 (Subject Diversity Filter)
// 상위 3개 후보가 모두 같은 과목이 되는 것을 금지
// ============================================

// 폴더 ID에서 과목 추출
const getSubjectFromFolderId = (folderId) => {
  if (!folderId) return null;
  
  // 패턴: g6-s2-soc, g6-s1-kor, g6-s2-sci 등
  const subjectMatch = folderId.match(/-(kor|math|soc|sci|moral|music|art|pe|int|eng)-?/);
  if (subjectMatch) return subjectMatch[1];
  
  // 마지막 과목 코드 추출
  if (folderId.includes('-kor')) return 'kor';
  if (folderId.includes('-math')) return 'math';
  if (folderId.includes('-soc')) return 'soc';
  if (folderId.includes('-sci')) return 'sci';
  if (folderId.includes('-moral')) return 'moral';
  if (folderId.includes('-music')) return 'music';
  if (folderId.includes('-art')) return 'art';
  if (folderId.includes('-pe')) return 'pe';
  
  return null;
};

// 과목 이름 반환
const getSubjectName = (subjectCode) => {
  const names = {
    'kor': '국어',
    'math': '수학',
    'soc': '사회',
    'sci': '과학',
    'moral': '도덕',
    'music': '음악',
    'art': '미술',
    'pe': '체육',
    'int': '통합',
    'eng': '영어'
  };
  return names[subjectCode] || subjectCode;
};

// 과목 다양성 필터 적용
const applySubjectDiversityFilter = (results) => {
  if (results.length <= 1) return results;
  
  const diverseResults = [];
  const usedSubjects = new Set();
  
  // 1순위는 무조건 포함
  if (results[0]) {
    const subject1 = getSubjectFromFolderId(results[0].id);
    diverseResults.push({ ...results[0], subject: subject1 });
    if (subject1) usedSubjects.add(subject1);
  }
  
  // 2순위: 1순위와 다른 과목 중 가장 높은 점수
  for (const result of results.slice(1)) {
    const subject = getSubjectFromFolderId(result.id);
    if (subject && !usedSubjects.has(subject)) {
      diverseResults.push({ ...result, subject });
      usedSubjects.add(subject);
      break;
    }
  }
  
  // 2순위를 못 찾았으면 원래 2순위 사용
  if (diverseResults.length === 1 && results.length > 1) {
    const subject2 = getSubjectFromFolderId(results[1].id);
    diverseResults.push({ ...results[1], subject: subject2 });
    if (subject2) usedSubjects.add(subject2);
  }
  
  // 3순위: 1, 2순위와 다른 과목 중 가장 높은 점수
  for (const result of results.slice(1)) {
    if (diverseResults.length >= 3) break;
    if (diverseResults.some(r => r.id === result.id)) continue;
    
    const subject = getSubjectFromFolderId(result.id);
    if (subject && !usedSubjects.has(subject)) {
      diverseResults.push({ ...result, subject });
      usedSubjects.add(subject);
    }
  }
  
  // 3개 미만이면 원래 결과에서 채우기
  for (const result of results) {
    if (diverseResults.length >= 3) break;
    if (!diverseResults.some(r => r.id === result.id)) {
      diverseResults.push({ ...result, subject: getSubjectFromFolderId(result.id) });
    }
  }
  
  console.log(`🧬 [DIVERSITY FILTER] 적용됨: ${diverseResults.map(r => `[${getSubjectName(r.subject)}] ${r.name}`).join(' | ')}`);
  
  return diverseResults;
};

// Entity가 발견되었는지 체크하고 해당 폴더 반환
const findEntityMatch = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const [entity, folderId] of Object.entries(ENTITY_KEYWORDS)) {
    if (lowerText.includes(entity.toLowerCase())) {
      const folder = CurriculumDatabase.hierarchy.find(f => f.id === folderId);
      if (folder) {
        return {
          found: true,
          entity: entity,
          folderId: folderId,
          folder: folder,
          path: getFolderPath(folderId)
        };
      }
    }
  }
  
  return { found: false };
};

// Action 키워드가 있는지 체크
const hasActionKeyword = (text) => {
  const lowerText = text.toLowerCase();
  return ACTION_KEYWORDS.some(action => lowerText.includes(action));
};

// ============================================
// 🚨 Rule 1: 메타데이터 패턴 (분류에서 제외)
// ============================================
const METADATA_PATTERNS = [
  // 날짜/연도
  /\d{4}년/g,           // 2024년, 2025년
  /\d{1,2}월/g,         // 1월, 12월
  /\d{1,2}\.\d{1,2}/g,  // 12.3, 5.18 (날짜 형식)
  /\d{4}\./g,           // 2025.
  
  // 순서/회차
  /\d+부/g,             // 1부, 2부
  /\d+화/g,             // 1화, 12화
  /Part\s*\d+/gi,       // Part 1, Part2
  /Ep\.?\s*\d+/gi,      // Ep.1, Ep 3
  /시즌\s*\d+/g,        // 시즌 1
  /S\d+E\d+/gi,         // S01E02
  
  // 시간/기간
  /\d+시간/g,           // 6시간
  /\d+분/g,             // 10분, 30분
  /\d+초/g,             // 30초
  /\d+주년/g,           // 1주년, 10주년
  /\d+일/g,             // 3일, 100일
];

// ============================================
// 🚨 핵심 키워드 → 폴더 하드 매핑
// ============================================
const CRITICAL_KEYWORD_MAP = {
  // === 1학년 키워드 ===
  '한글놀이': 'g1-s1-kor-u0',
  '자음자': 'g1-s1-kor-u0',
  '모음자': 'g1-s1-kor-u0',
  '9까지의수': 'g1-s1-math-u1',
  '50까지의수': 'g1-s1-math-u5',
  '태극기': 'g1-s1-int-u6',
  '무궁화': 'g1-s1-int-u6',

  // === 3학년 키워드 ===
  '감각적표현': 'g3-s1-kor-u1',
  '문단쓰기': 'g3-s1-kor-u3',
  '중심문장': 'g3-s1-kor-u3',
  '인물성격': 'g3-s1-kor-u5',
  '사실과의견': 'g3-s1-kor-u6',
  '선분': 'g3-s1-math-u2',
  '직각': 'g3-s1-math-u2',
  '직각삼각형': 'g3-s1-math-u2',
  '직사각형': 'g3-s1-math-u2',
  '정사각형': 'g3-s1-math-u2',
  '물체와물질': 'g3-s2-sci-u1',
  '고체액체기체': 'g3-s2-sci-u1',
  '지구와바다': 'g3-s2-sci-u2',
  '갯벌': 'g3-s2-sci-u2',
  '밀물썰물': 'g3-s2-sci-u2',
  '소리의성질': 'g3-s2-sci-u3',
  '감염병': 'g3-s2-sci-u4',
  '저출산': 'g3-s2-soc-u1',
  '고령화': 'g3-s2-soc-u1',
  '세시풍속': 'g3-s2-soc-u2',
  '교통수단': 'g3-s2-soc-u2',
  '통신수단': 'g3-s2-soc-u2',
  '공감': 'g3-s2-moral-u5',
  '공정': 'g3-s2-moral-u6',
  '생명존중': 'g3-s2-moral-u7',

  // === 4학년 1학기 키워드 ===
  '인물관계': 'g4-s1-kor-u1',
  '이야기흐름': 'g4-s1-kor-u1',
  '토의절차': 'g4-s1-kor-u2',
  '낱말의미관계': 'g4-s1-kor-u3',
  '보고하는글': 'g4-s1-kor-u3',
  '인터넷자료찾기': 'g4-s1-kor-media',
  '다의어': 'g4-s1-kor-u4',
  '중심생각': 'g4-s1-kor-u4',
  '독서감상문': 'g4-s1-kor-u5',
  '큰수': 'g4-s1-math-u1',
  '만': 'g4-s1-math-u1',
  '억': 'g4-s1-math-u1',
  '조': 'g4-s1-math-u1',
  '각도': 'g4-s1-math-u2',
  '예각': 'g4-s1-math-u2',
  '둔각': 'g4-s1-math-u2',
  '각도의합': 'g4-s1-math-u2',
  '각도의차': 'g4-s1-math-u2',
  '평면도형이동': 'g4-s1-math-u4',
  '밀기': 'g4-s1-math-u4',
  '뒤집기': 'g4-s1-math-u4',
  '돌리기': 'g4-s1-math-u4',
  '막대그래프': 'g4-s1-math-u6',
  '지도': 'g4-s1-soc-u1',
  '방위표': 'g4-s1-soc-u1-sub1',
  '축척': 'g4-s1-soc-u1-sub1',
  '등고선': 'g4-s1-soc-u1-sub1',
  '지리정보': 'g4-s1-soc-u1-sub2',
  '국가유산': 'g4-s1-soc-u2',
  '문화유산': 'g4-s1-soc-u2-sub1',
  '경제활동': 'g4-s1-soc-u3',
  '합리적선택': 'g4-s1-soc-u3-sub1',
  '지역간교류': 'g4-s1-soc-u3-sub2',
  '상호의존': 'g4-s1-soc-u3-sub2',
  '자석': 'g4-s1-sci-u1',
  '자석의극': 'g4-s1-sci-u1',
  '나침반': 'g4-s1-sci-u1',
  '물의상태변화': 'g4-s1-sci-u2',
  '증발': 'g4-s1-sci-u2',
  '응결': 'g4-s1-sci-u2',
  '땅의변화': 'g4-s1-sci-u3',
  '화산': 'g4-s1-sci-u3',
  '화성암': 'g4-s1-sci-u3',
  '지진': 'g4-s1-sci-u3',
  '버섯': 'g4-s1-sci-u4',
  '곰팡이': 'g4-s1-sci-u4',
  '세균': 'g4-s1-sci-u4',
  '정직': 'g4-s1-moral-u1',
  '도덕': 'g4-s1-moral-u2',
  '배려': 'g4-s1-moral-u3',

  // === 4학년 2학기 키워드 ===
  '이등변삼각형': 'g4-s2-math-u2',
  '정삼각형': 'g4-s2-math-u2',
  '예각삼각형': 'g4-s2-math-u2',
  '둔각삼각형': 'g4-s2-math-u2',
  '사다리꼴': 'g4-s2-math-u4',
  '평행사변형': 'g4-s2-math-u4',
  '마름모': 'g4-s2-math-u4',
  '꺾은선그래프': 'g4-s2-math-u5',
  '다각형': 'g4-s2-math-u6',
  '정다각형': 'g4-s2-math-u6',
  '밤하늘관찰': 'g4-s2-sci-u1',
  '달의모양': 'g4-s2-sci-u1',
  '생물과환경': 'g4-s2-sci-u2',
  '여러가지기체': 'g4-s2-sci-u3',
  '학교생활속민주주의': 'g4-s2-soc-u1-sub1',
  '주민자치': 'g4-s2-soc-u1-sub2',
  '지역문제': 'g4-s2-soc-u2',
  '디지털사회': 'g4-s2-moral-u5',
  '비무장지대': 'g4-s2-moral-u8',

  // === 5학년 키워드 ===
  '수의범위': 'g5-s2-math-u1',
  '이상이하': 'g5-s2-math-u1',
  '초과미만': 'g5-s2-math-u1',
  '올림버림반올림': 'g5-s2-math-u1',
  '합동': 'g5-s2-math-u3',
  '선대칭': 'g5-s2-math-u3',
  '점대칭': 'g5-s2-math-u3',
  '직육면체': 'g5-s2-math-u5',
  '정육면체': 'g5-s2-math-u5',
  '겨냥도': 'g5-s2-math-u5',
  '전개도': 'g5-s2-math-u5',
  '평균': 'g5-s2-math-u6',
  '가능성': 'g5-s2-math-u6',
  '날씨와우리생활': 'g5-s2-sci-u2',
  '습도': 'g5-s2-sci-u2',
  '저기압고기압': 'g5-s2-sci-u2',
  '물체의운동': 'g5-s2-sci-u3',
  '속력': 'g5-s2-sci-u3',
  '산과염기': 'g5-s2-sci-u4',
  '지시약': 'g5-s2-sci-u4',
  '고조선': 'g5-s2-soc-u1-sub1',
  '삼국': 'g5-s2-soc-u1-sub1',
  '고구려': 'g5-s2-soc-u1-sub1',
  '백제': 'g5-s2-soc-u1-sub1',
  '신라': 'g5-s2-soc-u1-sub1',
  '발해': 'g5-s2-soc-u1-sub1',
  '고려청자': 'g5-s2-soc-u1-sub2',
  '팔만대장경': 'g5-s2-soc-u1-sub2',
  '금속활자': 'g5-s2-soc-u1-sub2',
  '세종대왕': 'g5-s2-soc-u1-sub3',
  '임진왜란': 'g5-s2-soc-u1-sub3',
  '병자호란': 'g5-s2-soc-u1-sub3',
  '실학': 'g5-s2-soc-u2-sub1',
  '동학농민운동': 'g5-s2-soc-u2-sub1',
  '을사늑약': 'g5-s2-soc-u2-sub2',
  '3.1운동': 'g5-s2-soc-u2-sub2',
  '임시정부': 'g5-s2-soc-u2-sub2',
  '독립운동': 'g5-s2-soc-u2-sub2',
  '광복': 'g5-s2-soc-u2-sub3',
  '6.25전쟁': 'g5-s2-soc-u2-sub3',
  '한국전쟁': 'g5-s2-soc-u2-sub3',
  '사이버폭력': 'g5-s2-moral-u4',
  '갈등해결': 'g5-s2-moral-u5',
  '또래조정': 'g5-s2-moral-u5',
  '인권': 'g5-s2-moral-u6',

  // === 6학년 1학기 키워드 ===
  '비유': 'g6-s1-kor-u1',
  '속담': 'g6-s1-kor-u5',
  '추론': 'g6-s1-kor-u6',
  '분수의나눗셈': 'g6-s1-math-u1',
  '각기둥': 'g6-s1-math-u2',
  '각뿔': 'g6-s1-math-u2',
  '소수의나눗셈': 'g6-s1-math-u3',
  '비와비율': 'g6-s1-math-u4',
  '비율': 'g6-s1-math-u4',
  '백분율': 'g6-s1-math-u4',
  '띠그래프': 'g6-s1-math-u5',
  '원그래프': 'g6-s1-math-u5',
  '부피': 'g6-s1-math-u6',
  '겉넓이': 'g6-s1-math-u6',
  '지구와달의운동': 'g6-s1-sci-u1',
  '별자리': 'g6-s1-sci-u1',
  '산소': 'g6-s1-sci-u2',
  '이산화탄소': 'g6-s1-sci-u2',
  '식물의구조와기능': 'g6-s1-sci-u3',
  '광합성': 'g6-s1-sci-u3',
  '볼록렌즈': 'g6-s1-sci-u4',
  '프리즘': 'g6-s1-sci-u4',
  '4.19혁명': 'g6-s1-soc-u1-sub1',
  '5.18민주화운동': 'g6-s1-soc-u1-sub1',
  '6월민주항쟁': 'g6-s1-soc-u1-sub1',
  '계엄': 'g6-s1-soc-u1',
  '쿠데타': 'g6-s1-soc-u1',
  '내란': 'g6-s1-soc-u1',
  '시위': 'g6-s1-soc-u1',
  '혁명': 'g6-s1-soc-u1',
  '탄핵': 'g6-s1-soc-u1',
  '항쟁': 'g6-s1-soc-u1',
  '민주주의': 'g6-s1-soc-u1',
  '민주화': 'g6-s1-soc-u1',
  '국회': 'g6-s1-soc-u1-sub3',
  '행정부': 'g6-s1-soc-u1-sub3',
  '법원': 'g6-s1-soc-u1-sub3',
  '삼권분립': 'g6-s1-soc-u1-sub3',
  '경제성장': 'g6-s1-soc-u2-sub2',
  '무역': 'g6-s1-soc-u2-sub3',
  '수출': 'g6-s1-soc-u2-sub3',
  '수입': 'g6-s1-soc-u2-sub3',
  '자주': 'g6-s1-moral-u1',
  '봉사': 'g6-s1-moral-u2',
  '성찰': 'g6-s1-moral-u3',

  // === 6학년 2학기 키워드 ===
  '관용표현': 'g6-s2-kor-u2',
  '논설문': 'g6-s2-kor-u3',
  '광고비판': 'g6-s2-kor-u6',
  '뉴스': 'g6-s2-kor-u6',
  '고쳐쓰기': 'g6-s2-kor-u7',
  '비례식': 'g6-s2-math-u4',
  '비례배분': 'g6-s2-math-u4',
  '원주율': 'g6-s2-math-u5',
  '원의넓이': 'g6-s2-math-u5',
  '원기둥': 'g6-s2-math-u6',
  '원뿔': 'g6-s2-math-u6',
  '구': 'g6-s2-math-u6',
  '전기의이용': 'g6-s2-sci-u1',
  '전자석': 'g6-s2-sci-u1',
  '계절의변화': 'g6-s2-sci-u2',
  '태양고도': 'g6-s2-sci-u2',
  '연소와소화': 'g6-s2-sci-u3',
  '화재안전': 'g6-s2-sci-u3',
  '우리몸의구조와기능': 'g6-s2-sci-u4',
  '소화기관': 'g6-s2-sci-u4',
  '호흡기관': 'g6-s2-sci-u4',
  '에너지': 'g6-s2-sci-u5',
  '대륙': 'g6-s2-soc-u1-sub1',
  '세계지도': 'g6-s2-soc-u1-sub1',
  '지구본': 'g6-s2-soc-u1-sub1',
  '아시아': 'g6-s2-soc-u1-sub1',
  '유럽': 'g6-s2-soc-u1-sub1',
  '아프리카': 'g6-s2-soc-u1-sub1',
  '아메리카': 'g6-s2-soc-u1-sub1',
  '오세아니아': 'g6-s2-soc-u1-sub1',
  '중국': 'g6-s2-soc-u1-sub3',
  '일본': 'g6-s2-soc-u1-sub3',
  '러시아': 'g6-s2-soc-u1-sub3',
  '미국': 'g6-s2-soc-u1-sub3',
  '독도': 'g6-s2-soc-u2-sub1',
  '우리땅': 'g6-s2-soc-u2-sub1',
  '통일': 'g6-s2-soc-u2-sub1',
  '남북통일': 'g6-s2-soc-u2-sub1',
  '북한': 'g6-s2-soc-u2-sub1',
  '분단': 'g6-s2-soc-u2-sub1',
  '한반도': 'g6-s2-soc-u2-sub1',
  '김정은': 'g6-s2-soc-u2-sub1',
  '평양': 'g6-s2-soc-u2-sub1',
  '휴전선': 'g6-s2-soc-u2-sub1',
  'DMZ': 'g6-s2-soc-u2-sub1',
  '지구촌': 'g6-s2-soc-u2-sub2',
  '유엔': 'g6-s2-soc-u2-sub2',
  'UN': 'g6-s2-soc-u2-sub2',
  'NGO': 'g6-s2-soc-u2-sub2',
  '국제기구': 'g6-s2-soc-u2-sub2',
  '세계평화': 'g6-s2-soc-u2-sub2',
  '난민': 'g6-s2-soc-u2-sub2',
  '지속가능': 'g6-s2-soc-u3',
  '환경문제': 'g6-s2-soc-u3',
  '세계시민': 'g6-s2-soc-u3',
  '공정한생활': 'g6-s2-moral-u4',
  '통일한국': 'g6-s2-moral-u5',
};

// ============================================
// 과목 카테고리 정의
// ============================================

// 텍스트에서 과목 성격 감지
const detectSubjectCategory = (text) => {
  const lowerText = text.toLowerCase();
  
  // 사회/역사 키워드 (최우선 감지) - 확장
  const socialKeywords = [
    '역사', '사회', '독도', '우리땅', '통일', '남북', '북한', '민주주의', '정치', '경제',
    '고조선', '삼국', '고구려', '백제', '신라', '고려', '조선', '일제', '광복', '독립운동',
    '4·19', '5·18', '6월항쟁', '임진왜란', '병자호란', '세종대왕', '이순신',
    '지역', '마을', '도시', '나라', '세계', '대륙', '문화', '전통',
    '김정은', '평양', '핵', '미사일', '남한', '휴전선', 'dmz', '판문점',
    '국회', '대통령', '선거', '투표', '시민', '인권', '평화'
  ];
  
  // 수학 키워드
  const mathKeywords = [
    '수학', '덧셈', '뺄셈', '곱셈', '나눗셈', '분수', '소수', '도형', '삼각형', '사각형',
    '원', '각도', '넓이', '부피', '그래프', '비율', '백분율', '방정식', '함수',
    '수의 범위', '어림', '올림', '버림', '반올림', '계산', '공식', '수식'
  ];
  
  // 과학 키워드
  const scienceKeywords = [
    '과학', '실험', '관찰', '생태계', '생물', '동물', '식물', '날씨', '기후', '기체',
    '전기', '자석', '연소', '소화', '우주', '태양계', '행성', '달', '별', '분자', '원자'
  ];
  
  // 각 카테고리 점수 계산
  let socialScore = 0;
  let mathScore = 0;
  let scienceScore = 0;
  
  socialKeywords.forEach(kw => {
    if (lowerText.includes(kw)) socialScore += 10;
  });
  
  mathKeywords.forEach(kw => {
    if (lowerText.includes(kw)) mathScore += 10;
  });
  
  scienceKeywords.forEach(kw => {
    if (lowerText.includes(kw)) scienceScore += 10;
  });
  
  // 가장 높은 점수의 카테고리 반환
  if (socialScore > mathScore && socialScore > scienceScore) return 'SOCIAL';
  if (mathScore > socialScore && mathScore > scienceScore) return 'MATH';
  if (scienceScore > socialScore && scienceScore > mathScore) return 'SCIENCE';
  
  return null;
};

// 폴더 ID에서 과목 카테고리 추출
const getFolderSubjectCategory = (folderId) => {
  if (!folderId) return null;
  
  if (folderId.includes('-soc')) return 'SOCIAL';
  if (folderId.includes('-math')) return 'MATH';
  if (folderId.includes('-sci')) return 'SCIENCE';
  if (folderId.includes('-kor')) return 'KOREAN';
  if (folderId.includes('-moral')) return 'MORAL';
  if (folderId.includes('-music') || folderId.includes('-art') || folderId.includes('-pe')) return 'ARTS';
  if (folderId.includes('-int')) return 'INTEGRATED';
  
  return null;
};

// 과목 불일치 검사 (Subject Mismatch = 절대 금지)
const isSubjectMismatch = (textCategory, folderCategory) => {
  if (!textCategory || !folderCategory) return false;
  
  // 사회/역사 텍스트 → 수학 폴더 = 절대 금지
  if (textCategory === 'SOCIAL' && folderCategory === 'MATH') return true;
  // 수학 텍스트 → 사회 폴더 = 절대 금지
  if (textCategory === 'MATH' && folderCategory === 'SOCIAL') return true;
  // 과학 텍스트 → 수학 폴더 = 금지
  if (textCategory === 'SCIENCE' && folderCategory === 'MATH') return true;
  // 사회 텍스트 → 과학 폴더 = 금지 (완전 다른 주제)
  if (textCategory === 'SOCIAL' && folderCategory === 'SCIENCE') return true;
  
  return false;
};

// ============================================
// 🚨 Rule 1: 메타데이터 제거 함수
// ============================================
const removeMetadata = (text) => {
  let cleaned = text;
  
  // 모든 메타데이터 패턴 제거
  METADATA_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });
  
  return cleaned;
};

// ============================================
// 🚨 Rule 2: Semantic Override 체크
// 강력한 의미어가 있으면 즉시 사회로 분류
// ============================================
const checkSemanticOverride = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const word of SEMANTIC_OVERRIDE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      const folder = CurriculumDatabase.hierarchy.find(f => f.id === SEMANTIC_OVERRIDE_FOLDER);
      if (folder) {
        console.log(`🚨 Semantic Override 발동! "${word}" 발견 → 수학 분류 차단`);
        return {
          triggered: true,
          triggerWord: word,
          folder: folder,
          folderId: SEMANTIC_OVERRIDE_FOLDER,
          path: getFolderPath(SEMANTIC_OVERRIDE_FOLDER)
        };
      }
    }
  }
  
  return { triggered: false };
};

// ============================================
// 🚨 Rule 3: 숫자 검증 (수학적 숫자 vs 날짜/시간)
// ============================================
const isMathematicalNumber = (text) => {
  // 수학적 연산 키워드가 있는지 확인
  const mathOperationWords = [
    '더하기', '빼기', '곱하기', '나누기', '덧셈', '뺄셈', '곱셈', '나눗셈',
    '계산', '연산', '수식', '방정식', '등식', '부등식',
    '크기비교', '순서', '수의범위', '어림', '올림', '버림', '반올림'
  ];
  
  const lowerText = text.toLowerCase();
  return mathOperationWords.some(word => lowerText.includes(word));
};

// ============================================
// 키워드 추출 (명사형 위주) - 메타데이터 제외
// ============================================
const extractKeywords = (text) => {
  if (!text) return [];
  
  // 먼저 메타데이터 제거
  const cleanedText = removeMetadata(text);
  
  const stopWords = [
    '의', '가', '이', '은', '는', '을', '를', '에', '에서', '와', '과', '도', '로', '으로',
    '하다', '되다', '있다', '없다', '같다', '보다', '만', '수', '것', '등', '및', '또',
    '합니다', '입니다', '습니다', '해요', '어요', '에요', '요', '네요',
    '영상', '동영상', '강의', '수업', '공부', '학습', 'EBS', 'YouTube', '유튜브',
    '이', '그', '저', '이것', '그것', '저것', '무엇', '어떤', '어떻게', '왜', '언제',
    '리뷰', '후기', '정리', '요약', '설명', '소개', '특집', '특별',
    '얼마나', '방법', '이유', '과정', '순서', '대해', '대한', '위한', '통해',
    '모두', '함께', '다양한', '여러', '가지', '정말', '진짜', '너무', '많이', '가장', '제일',
    '지금', '오늘', '내일', '어제', '이번', '저번', '다음', '지난',
    '다시', '계속', '자주', '항상', '매일', '가끔', '보세요', '보러가기', '알아보아요', '살펴보아요',
    '재미있는', '신나는', '즐거운', '쉬운', '간단한', '따라하기', '만들기', '그리기'
  ];
  
  const normalized = cleanedText
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣·]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.includes(word));
  
  return [...new Set(normalized)];
};

// ============================================
// 🚨 핵심 키워드 하드매칭 (Step 1 - 최우선!)
// ============================================
const findCriticalKeywordMatch = (text) => {
  const lowerText = text.toLowerCase();
  
  // 핵심 키워드 순회하며 매칭
  for (const [keyword, folderId] of Object.entries(CRITICAL_KEYWORD_MAP)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      // 찾았다! 해당 폴더 정보 반환
      const folder = CurriculumDatabase.hierarchy.find(f => f.id === folderId);
      if (folder) {
        console.log(`🎯 Critical Keyword Match: "${keyword}" → ${folder.name}`);
        return {
          ...folder,
          score: 1000,
          matchedKeywords: [keyword],
          path: getFolderPath(folder.id),
          confidence: 100,
          matchType: 'CRITICAL_KEYWORD'
        };
      }
    }
  }
  
  return null;
};

// ============================================
// 메인 분류 함수
// ============================================
export const classifyVideo = (videoInfo) => {
  const { title = '', description = '', summary = '' } = videoInfo;
  const fullText = `${title} ${description} ${summary}`;
  
  console.log('\n========================================');
  console.log('🔍 AI 분류 시작');
  console.log('========================================');
  console.log('📝 원본:', fullText.substring(0, 100) + (fullText.length > 100 ? '...' : ''));
  
  // 🚨 Step 0: Semantic Override 체크 (최최우선!)
  // 계엄, 쿠데타 등 강력한 사회/역사 키워드가 있으면 즉시 사회로 분류
  const semanticCheck = checkSemanticOverride(fullText);
  if (semanticCheck.triggered) {
    console.log(`🚨 [SEMANTIC OVERRIDE] "${semanticCheck.triggerWord}" 발견!`);
    console.log(`   → 수학 분류 차단, 사회로 강제 분류`);
    console.log(`   → ${semanticCheck.path}`);
    
    return [{
      ...semanticCheck.folder,
      score: 2000,
      matchedKeywords: [semanticCheck.triggerWord],
      path: semanticCheck.path,
      confidence: 100,
      matchType: 'SEMANTIC_OVERRIDE'
    }];
  }
  
  // 🧬 Step 0.3: 단원명 완전 일치 체크 (Rule 7)
  const exactTitleMatches = checkExactTitleMatch(fullText);
  
  // 단원명이 직접 포함되어 있거나 50% 이상 유사하면 즉시 확정
  if (exactTitleMatches.length > 0 && 
      (exactTitleMatches[0].textContainsFolder || exactTitleMatches[0].similarity >= 0.5)) {
    const bestMatch = exactTitleMatches[0];
    console.log(`🧬 [EXACT TITLE MATCH] 단원명 일치로 확정!`);
    console.log(`   → "${bestMatch.folder.name}" (보너스: x${bestMatch.bonusMultiplier})`);
    
    return [{
      ...bestMatch.folder,
      score: 1800 * bestMatch.bonusMultiplier,
      matchedKeywords: [bestMatch.folder.name],
      path: getFolderPath(bestMatch.folder.id),
      confidence: Math.min(Math.round(bestMatch.similarity * 100) + 20, 100),
      matchType: 'EXACT_TITLE_MATCH',
      similarity: bestMatch.similarity,
      bonusMultiplier: bestMatch.bonusMultiplier,
      subject: getSubjectFromFolderId(bestMatch.folder.id),
      subjectName: getSubjectName(getSubjectFromFolderId(bestMatch.folder.id))
    }];
  }
  
  // ⚖️ Step 0.5: Entity > Action 규칙 체크
  const entityMatch = findEntityMatch(fullText);
  const hasAction = hasActionKeyword(fullText);
  
  if (entityMatch.found) {
    console.log(`⚖️ [ENTITY > ACTION] Entity "${entityMatch.entity}" 발견!`);
    if (hasAction) {
      console.log(`   → Action 키워드도 있지만 Entity가 우선!`);
    }
    console.log(`   → ${entityMatch.path}`);
    
    return [{
      ...entityMatch.folder,
      score: 1500,
      matchedKeywords: [entityMatch.entity],
      path: entityMatch.path,
      confidence: 100,
      matchType: 'ENTITY_OVERRIDE'
    }];
  }
  
  // 🚨 Step 1: 핵심 키워드 하드매칭
  const criticalMatch = findCriticalKeywordMatch(fullText);
  if (criticalMatch) {
    console.log('🎯 [CRITICAL MATCH] 핵심 키워드 확정:', criticalMatch.path);
    return [criticalMatch];
  }
  
  // Step 2: 메타데이터 제거 후 키워드 추출
  const cleanedText = removeMetadata(fullText);
  console.log('🧹 메타데이터 제거 후:', cleanedText.substring(0, 80) + '...');
  
  // Step 3: 텍스트의 과목 성격 감지
  const textCategory = detectSubjectCategory(cleanedText);
  console.log('📚 감지된 과목:', textCategory || '미정');
  
  // Step 4: 키워드 추출
  const keywords = extractKeywords(fullText);
  console.log('🔤 추출된 키워드:', keywords.slice(0, 10).join(', '));
  
  // 🚨 Rule 3: 숫자 검증 - 사회 키워드가 있는데 수학으로 분류하려는지 체크
  const hasSocialContext = textCategory === 'SOCIAL';
  const hasMathOperation = isMathematicalNumber(fullText);
  
  if (hasSocialContext && !hasMathOperation) {
    console.log('⚠️ 사회 맥락 감지됨 - 수학 폴더 완전 차단');
  }
  
  // Step 5: 모든 단원과 매칭 점수 계산
  const results = [];
  
  // 🧬 단원명 일치 보너스 맵 생성
  const titleMatchBonusMap = {};
  exactTitleMatches.forEach(match => {
    titleMatchBonusMap[match.folder.id] = match.bonusMultiplier;
  });
  
  CurriculumDatabase.hierarchy.forEach(folder => {
    // metadata가 있는 단원만 대상
    if (!folder.metadata || !folder.metadata.keywords) return;
    
    const folderKeywords = folder.metadata.keywords;
    const folderCategory = getFolderSubjectCategory(folder.id);
    
    // 🚨 Rule 3: 사회 맥락인데 수학 폴더면 즉시 스킵
    if (hasSocialContext && !hasMathOperation && folderCategory === 'MATH') {
      return; // 이 폴더는 완전히 무시
    }
    
    // 🚨 과목 불일치 시 즉시 스킵 (절대 매칭 금지!)
    if (isSubjectMismatch(textCategory, folderCategory)) {
      return; // 이 폴더는 완전히 무시
    }
    
    let score = 0;
    let matchedKeywords = [];
    let hasEntityInFolder = false;
    
    // Exact Match 검사
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // ⚖️ Entity vs Action 가중치 적용
      const isEntity = Object.keys(ENTITY_KEYWORDS).some(e => e.toLowerCase() === keywordLower);
      const isAction = ACTION_KEYWORDS.some(a => a === keywordLower);
      
      // 폴더 키워드와 정확히 일치
      const exactMatch = folderKeywords.some(fk => 
        fk.toLowerCase() === keywordLower || 
        fk.toLowerCase().includes(keywordLower) ||
        keywordLower.includes(fk.toLowerCase())
      );
      
      if (exactMatch) {
        // Entity는 +500점, Action은 +50점, 일반은 +100점
        if (isEntity) {
          score += 500;
          hasEntityInFolder = true;
        } else if (isAction && !hasEntityInFolder) {
          score += 50; // Action은 Entity가 없을 때만 점수 추가
        } else {
          score += 100;
        }
        matchedKeywords.push(keyword);
      }
      
      // 폴더 이름에 키워드 포함
      if (folder.name.toLowerCase().includes(keywordLower)) {
        if (isEntity) {
          score += 500;
          hasEntityInFolder = true;
        } else if (isAction && !hasEntityInFolder) {
          score += 50;
        } else {
          score += 100;
        }
        if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
      }
      
      // 성취기준에 키워드 포함 (+50점)
      if (folder.metadata.achievementStandards) {
        const inStandards = folder.metadata.achievementStandards.some(s => 
          s.toLowerCase().includes(keywordLower)
        );
        if (inStandards) {
          score += 50;
          if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
        }
      }
    });
    
    // 🧬 Rule 7: 단원명 일치 보너스 적용
    const titleBonus = titleMatchBonusMap[folder.id] || 1.0;
    const finalScore = Math.round(score * titleBonus);
    
    // 점수가 양수인 경우만 결과에 추가
    if (finalScore > 0) {
      results.push({
        ...folder,
        score: finalScore,
        originalScore: score,
        titleBonus: titleBonus,
        matchedKeywords,
        path: getFolderPath(folder.id),
        confidence: Math.min(Math.round(finalScore / 5), 100), // 최대 100%
        hasEntity: hasEntityInFolder,
        subject: getSubjectFromFolderId(folder.id),
        subjectName: getSubjectName(getSubjectFromFolderId(folder.id))
      });
    }
  });
  
  // 점수순 정렬
  results.sort((a, b) => b.score - a.score);
  
  // 🧬 Rule 8: 과목별 쿼터제 적용 (다양성 필터)
  const diverseResults = applySubjectDiversityFilter(results);
  
  console.log('----------------------------------------');
  console.log('📊 원본 결과:', results.slice(0, 3).map(r => `[${r.subjectName}] ${r.name} (${r.score}점)`).join(' | ') || '없음');
  console.log('🧬 다양성 적용:', diverseResults.slice(0, 3).map(r => `[${r.subjectName}] ${r.name} (${r.score}점)`).join(' | ') || '없음');
  console.log('========================================\n');
  
  // 다양성 필터가 적용된 결과 반환 (원본 결과도 포함)
  return diverseResults.map((r, idx) => ({
    ...r,
    diverseRank: idx + 1,
    originalResults: results.slice(0, 5) // 원본 결과도 참조용으로 포함
  }));
};

// ============================================
// 최적 매칭 반환
// ============================================
export const getBestMatch = (videoInfo) => {
  const results = classifyVideo(videoInfo);
  return results.length > 0 ? results[0] : null;
};

// ============================================
// 분류 요약 반환 (충돌 감지 + Top-N 후보 시스템)
// ============================================
export const getClassificationSummary = (videoInfo) => {
  const { title = '', description = '', summary = '' } = videoInfo;
  const fullText = `${title} ${description} ${summary}`;
  
  // 🔀 Step 0: 교차 키워드 충돌 감지
  const conflictCheck = checkCategoryConflict(fullText);
  
  if (conflictCheck.hasConflict) {
    console.log(`🔀 [CONFLICT DETECTED] ${conflictCheck.reason}`);
    
    // 충돌 시 다중 후보 반환
    const candidates = conflictCheck.categories.slice(0, 3).map((cat, idx) => {
      const folder = CurriculumDatabase.hierarchy.find(f => f.id === cat.folderId);
      return {
        rank: idx + 1,
        id: cat.folderId,
        name: folder?.name || cat.name,
        unit_name: cat.name,
        path: getFolderPath(cat.folderId),
        match_reason: `키워드 '${cat.matchedKeywords.join(', ')}' 매칭`,
        matchedKeywords: cat.matchedKeywords,
        score: cat.score,
        categoryId: cat.categoryId,
        isRecommended: idx === 0,
        confidence: Math.min(cat.score, 100)
      };
    });
    
    return {
      // 🔀 새로운 JSON 포맷
      is_ambiguous: true,
      ambiguous: true,
      reason: conflictCheck.reason,
      candidates: candidates,
      
      // 기존 호환성
      hasSuggestion: true,
      topMatch: candidates[0],
      alternativeMatches: candidates.slice(1),
      recommendations: candidates,
      summary: `🔀 충돌: ${conflictCheck.reason}`,
      needsUserChoice: true,
      conflictType: 'CROSS_KEYWORD'
    };
  }
  
  // 충돌 없으면 기존 분류 로직 실행
  const results = classifyVideo(videoInfo);
  
  if (results.length === 0) {
    return {
      is_ambiguous: false,
      ambiguous: false,
      recommendations: [],
      candidates: [],
      summary: '적합한 폴더를 찾지 못했습니다. 직접 폴더를 선택해주세요.',
      hasSuggestion: false
    };
  }
  
  const top = results[0];
  const second = results[1];
  
  // 🎯 Rule 5: Top-N 후보 추천 시스템
  // 1순위와 2순위 점수 차이가 20점 이내이면 ambiguous: true
  let isAmbiguous = false;
  let ambiguousReason = '';
  let candidates = [top];
  
  if (second && top.score > 0) {
    const scoreDiff = top.score - second.score;
    const scoreDiffPercent = scoreDiff / top.score;
    
    // 점수 차이가 20점 이내 또는 10% 미만
    if (scoreDiff <= 20 || scoreDiffPercent < 0.1) {
      isAmbiguous = true;
      ambiguousReason = `1순위(${top.score}점)와 2순위(${second.score}점)의 점수 차이가 ${scoreDiff}점으로 근소합니다.`;
      candidates = [top, second];
      
      // 3순위도 점수 차이가 30점 이내면 포함
      const third = results[2];
      if (third && (top.score - third.score) <= 30) {
        candidates.push(third);
      }
      
      console.log(`🤔 [AMBIGUOUS] ${ambiguousReason}`);
      console.log(`   → 사용자 선택 필요!`);
    }
  }
  
  // 매칭 타입에 따른 라벨
  let matchTypeLabel = '📁 추천';
  if (top.matchType === 'SEMANTIC_OVERRIDE') {
    matchTypeLabel = '🚨 강제확정';
  } else if (top.matchType === 'ENTITY_OVERRIDE') {
    matchTypeLabel = '⚖️ Entity 확정';
  } else if (top.matchType === 'CRITICAL_KEYWORD') {
    matchTypeLabel = '🎯 확정';
  } else if (isAmbiguous) {
    matchTypeLabel = '🤔 선택 필요';
  }
  
  // 후보 포맷팅 (과목 정보 포함)
  const formattedCandidates = candidates.map((c, idx) => ({
    rank: idx + 1,
    id: c.id,
    name: c.name,
    unit_name: c.name,
    path: c.path,
    match_reason: `키워드 '${(c.matchedKeywords || []).join(', ')}' 매칭`,
    matchedKeywords: c.matchedKeywords || [],
    score: c.score,
    isRecommended: idx === 0,
    confidence: c.confidence,
    subject: c.subject || getSubjectFromFolderId(c.id),
    subjectName: c.subjectName || getSubjectName(c.subject || getSubjectFromFolderId(c.id)),
    titleBonus: c.titleBonus,
    ...c
  }));
  
  return {
    // 🔀 새로운 JSON 포맷
    is_ambiguous: isAmbiguous,
    ambiguous: isAmbiguous,
    reason: isAmbiguous ? ambiguousReason : null,
    candidates: formattedCandidates,
    
    // 기존 호환성
    recommendations: results.slice(0, 5),
    summary: `${matchTypeLabel}: ${top.path} (${top.confidence}% 일치, 키워드: ${top.matchedKeywords.join(', ')})`,
    hasSuggestion: true,
    topMatch: top,
    alternativeMatches: results.slice(1, 4),
    isCriticalMatch: top.matchType === 'CRITICAL_KEYWORD' || top.matchType === 'SEMANTIC_OVERRIDE' || top.matchType === 'ENTITY_OVERRIDE',
    isSemanticOverride: top.matchType === 'SEMANTIC_OVERRIDE',
    isEntityOverride: top.matchType === 'ENTITY_OVERRIDE',
    needsUserChoice: isAmbiguous,
    conflictType: isAmbiguous ? 'SCORE_CLOSE' : null
  };
};

// ============================================
// 제목 기반 학습 키워드 프롬프트 생성 (교사 맥락 반영)
// ============================================
export const buildTitleKeywordPrompt = ({
  userGrade = '초등학교 6학년',
  userSubject = '실과',
  fileTitle = '',
} = {}) => {
  return `
당신은 ${userGrade} ${userSubject} 선생님입니다.
아래 파일 제목을 분석하여, 수업 시간에 다룰법한 '학습 핵심 키워드' 3개를 추출하세요.

**분석 대상:** "${fileTitle}"

**추출 규칙:**
1. **교과 연계성:** ${userSubject} 교과서나 성취기준에 나올법한 단어를 우선순위로 둡니다.
2. **품사 제약:** 명사(Noun) 형태만 추출하세요. (형용사, 부사, 동사 금지)
3. **불용어 제외:** '얼마나', '어떻게', '방법', '이유' 같은 일반적인 서술어는 절대 키워드로 잡지 마세요.
4. **구체성:** 포괄적인 단어보다는 구체적인 학습 용어를 선택하세요.

**출력 형식:**
키워드1, 키워드2, 키워드3
`.trim();
};

// ============================================
// 테스트용 함수 (콘솔에서 직접 테스트 가능)
// ============================================
export const testClassification = (text) => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 AI 분류 테스트                                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ 📝 입력:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  // 🔀 Step -1: 교차 키워드 충돌 감지
  const conflictCheck = checkCategoryConflict(text);
  if (conflictCheck.hasConflict) {
    console.log('║ 🔀 [CONFLICT DETECTED] 교차 키워드 충돌!');
    console.log('║    이유:', conflictCheck.reason);
    console.log('║    감지된 카테고리:');
    conflictCheck.categories.forEach((cat, i) => {
      console.log(`║      ${i + 1}. ${cat.name} (키워드: ${cat.matchedKeywords.join(', ')}, ${cat.score}점)`);
    });
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║ 🤔 사용자 선택 필요!');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    return getClassificationSummary({ title: text });
  }
  
  // Step 0: Semantic Override 체크
  const semanticCheck = checkSemanticOverride(text);
  if (semanticCheck.triggered) {
    console.log('║ 🚨 [SEMANTIC OVERRIDE] 강력한 의미어 발견!');
    console.log('║    트리거 단어:', semanticCheck.triggerWord);
    console.log('║    → 수학 분류 차단됨');
    console.log('║    → 분류 결과:', semanticCheck.path);
    console.log('║    → 점수: 2000점 (강제 확정)');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    return { 
      topMatch: { ...semanticCheck.folder, score: 2000, matchedKeywords: [semanticCheck.triggerWord], path: semanticCheck.path }, 
      isSemanticOverride: true,
      is_ambiguous: false
    };
  }
  
  // Step 0.5: Entity > Action 체크
  const entityMatch = findEntityMatch(text);
  const hasAction = hasActionKeyword(text);
  if (entityMatch.found) {
    console.log('║ ⚖️ [ENTITY > ACTION] Entity 우선 적용!');
    console.log('║    Entity:', entityMatch.entity);
    if (hasAction) {
      console.log('║    Action 키워드도 있지만 무시됨');
    }
    console.log('║    → 분류 결과:', entityMatch.path);
    console.log('║    → 점수: 1500점 (Entity 확정)');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    return { 
      topMatch: { ...entityMatch.folder, score: 1500, matchedKeywords: [entityMatch.entity], path: entityMatch.path }, 
      isEntityOverride: true,
      is_ambiguous: false
    };
  }
  
  // Step 1: 핵심 키워드 체크
  const criticalMatch = findCriticalKeywordMatch(text);
  if (criticalMatch) {
    console.log('║ 🎯 [CRITICAL MATCH] 핵심 키워드 발견!');
    console.log('║    키워드:', criticalMatch.matchedKeywords[0]);
    console.log('║    폴더:', criticalMatch.path);
    console.log('║    점수: 1000점 (즉시 확정)');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    return { topMatch: criticalMatch, isCritical: true, is_ambiguous: false };
  }
  
  console.log('║ ℹ️  핵심 키워드 없음 - 일반 분류 진행');
  console.log('║ 📚 감지된 과목:', detectSubjectCategory(text) || '미정');
  console.log('║ 🧹 메타데이터 제거 후:', removeMetadata(text).substring(0, 40) + '...');
  console.log('║ 🔤 추출된 키워드:', extractKeywords(text).slice(0, 8).join(', '));
  
  const result = getClassificationSummary({ title: text });
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  if (result.hasSuggestion) {
    console.log('║ ✅ 분류 결과:');
    console.log('║    폴더:', result.topMatch.path || result.candidates[0]?.path);
    console.log('║    점수:', result.topMatch.score || result.candidates[0]?.score);
    console.log('║    매칭 키워드:', (result.topMatch.matchedKeywords || result.candidates[0]?.matchedKeywords || []).join(', '));
    
    // 🔀 Conflict 또는 Ambiguous 상태 표시
    if (result.is_ambiguous) {
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║ 🔀 [' + (result.conflictType === 'CROSS_KEYWORD' ? 'CONFLICT' : 'AMBIGUOUS') + '] 사용자 선택 필요!');
      if (result.reason) {
        console.log('║    이유:', result.reason);
      }
      console.log('║    후보:');
      result.candidates.forEach((c, i) => {
        console.log(`║      ${i + 1}. ${c.path} (${c.score}점)${i === 0 ? ' ← 추천' : ''}`);
        console.log(`║         → ${c.match_reason}`);
      });
    }
  } else {
    console.log('║ ❌ 적합한 폴더를 찾지 못함');
  }
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  return result;
};

// ============================================
// 디버깅용 함수들
// ============================================
export const getCriticalKeywords = () => CRITICAL_KEYWORD_MAP;
export const getSemanticOverrideWords = () => SEMANTIC_OVERRIDE_WORDS;
export const getEntityKeywords = () => ENTITY_KEYWORDS;
export const getActionKeywords = () => ACTION_KEYWORDS;
export const getCategoryMap = () => KEYWORD_CATEGORY_MAP;

export const testMetadataRemoval = (text) => {
  console.log('원본:', text);
  console.log('제거 후:', removeMetadata(text));
};

// Entity > Action 테스트
export const testEntityAction = (text) => {
  console.log('\n=== Entity vs Action 테스트 ===');
  console.log('입력:', text);
  
  const entityMatch = findEntityMatch(text);
  const hasAction = hasActionKeyword(text);
  
  console.log('Entity 발견:', entityMatch.found ? `"${entityMatch.entity}" → ${entityMatch.path}` : '없음');
  console.log('Action 발견:', hasAction ? 'O' : 'X');
  
  if (entityMatch.found && hasAction) {
    console.log('⚖️ Entity가 Action을 오버라이드!');
  }
  
  return { entityMatch, hasAction };
};

// 🔀 충돌 테스트
export const testConflict = (text) => {
  console.log('\n=== 교차 키워드 충돌 테스트 ===');
  console.log('입력:', text);
  
  const categories = detectCategories(text);
  console.log('감지된 카테고리:', categories.map(c => `${c.name}(${c.matchedKeywords.join(',')})`).join(' | '));
  
  const conflict = checkCategoryConflict(text);
  console.log('충돌 여부:', conflict.hasConflict ? '⚠️ 충돌!' : '✅ 없음');
  
  if (conflict.hasConflict) {
    console.log('충돌 이유:', conflict.reason);
  }
  
  return conflict;
};

// 🧬 단원명 일치 테스트
export const testTitleMatch = (text) => {
  console.log('\n=== 단원명 일치 테스트 ===');
  console.log('입력:', text);
  
  const matches = checkExactTitleMatch(text);
  
  if (matches.length > 0) {
    console.log('✅ 일치하는 단원 발견:');
    matches.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. "${m.folder.name}" (유사도: ${Math.round(m.similarity * 100)}%, 보너스: x${m.bonusMultiplier})`);
    });
  } else {
    console.log('❌ 일치하는 단원 없음');
  }
  
  return matches;
};

// 🧬 다양성 필터 테스트
export const testDiversity = (text) => {
  console.log('\n=== 과목 다양성 테스트 ===');
  console.log('입력:', text);
  
  const result = getClassificationSummary({ title: text });
  
  if (result.candidates && result.candidates.length > 0) {
    console.log('✅ 후보 목록 (다양성 적용):');
    result.candidates.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.subjectName || getSubjectName(c.subject)}] ${c.name || c.path} (${c.score}점)`);
      console.log(`     → ${c.match_reason || c.matchedKeywords?.join(', ')}`);
    });
  }
  
  return result;
};

// ============================================
// 🎓 교육과정 컨텍스트 기반 분류 (Enhanced)
// ============================================

/**
 * 학년/과목별 교육과정 컨텍스트를 가져옵니다.
 * CurriculumDatabase.hierarchy에서 해당 학년/과목의 단원 정보 추출
 */
export const getCurriculumContextForClassification = (grade, subject) => {
  const gradeMap = {
    '1학년': 'g1', 'elementary-1': 'g1', '초1': 'g1', '1': 'g1',
    '2학년': 'g2', 'elementary-2': 'g2', '초2': 'g2', '2': 'g2',
    '3학년': 'g3', 'elementary-3': 'g3', '초3': 'g3', '3': 'g3',
    '4학년': 'g4', 'elementary-4': 'g4', '초4': 'g4', '4': 'g4',
    '5학년': 'g5', 'elementary-5': 'g5', '초5': 'g5', '5': 'g5',
    '6학년': 'g6', 'elementary-6': 'g6', '초6': 'g6', '6': 'g6',
    'elementary-5-6': 'g5',
  };

  const subjectMap = {
    '국어': 'kor', '수학': 'math', '사회': 'soc', '과학': 'sci',
    '도덕': 'moral', '영어': 'eng', '음악': 'music', '미술': 'art',
    '체육': 'pe', '실과': 'prac', '통합': 'int',
  };

  const gradeCode = gradeMap[String(grade).toLowerCase().trim()] || gradeMap[grade];
  const subjectCode = subjectMap[String(subject).toLowerCase().trim()] || subjectMap[subject];

  if (!gradeCode) return null;

  // CurriculumDatabase에서 해당 학년/과목 단원 필터링
  const relevantFolders = CurriculumDatabase.hierarchy.filter(folder => {
    if (!folder.id || folder.type !== 'folder') return false;
    const matchesGrade = folder.id.startsWith(gradeCode + '-');
    const matchesSubject = subjectCode 
      ? folder.id.includes(`-${subjectCode}-`) || folder.id.includes(`-${subjectCode}`)
      : true;
    const hasContent = folder.metadata && (folder.metadata.keywords || folder.metadata.achievementStandards);
    return matchesGrade && matchesSubject && hasContent;
  });

  if (relevantFolders.length === 0) return null;

  const units = relevantFolders.map(f => ({
    id: f.id,
    name: f.name,
    path: getFolderPath(f.id),
    keywords: f.metadata?.keywords || [],
  }));

  const allKeywords = [...new Set(relevantFolders.flatMap(f => f.metadata?.keywords || []))];
  const summary = units.map(u => `• ${u.name}: ${u.keywords.slice(0, 5).join(', ')}`).join('\n');

  return { grade: gradeCode, subject: subjectCode, units, keywords: allKeywords, summary };
};

/**
 * 교육과정 컨텍스트를 포함한 AI 프롬프트 문자열 생성
 */
export const buildClassificationPromptWithContext = (fileName, grade, subject) => {
  const context = getCurriculumContextForClassification(grade, subject);
  
  const gradeNames = { 'g1': '1학년', 'g2': '2학년', 'g3': '3학년', 'g4': '4학년', 'g5': '5학년', 'g6': '6학년' };
  const subjectNames = { 'kor': '국어', 'math': '수학', 'soc': '사회', 'sci': '과학', 'moral': '도덕', 'eng': '영어' };
  
  const gradeName = context ? gradeNames[context.grade] : (grade || '초등학교');
  const subjectName = context ? subjectNames[context.subject] : (subject || '전과목');

  const contextPrompt = context 
    ? `\n\n[참고 자료: ${gradeName} ${subjectName} 교육과정 및 단원 목록]\n${context.summary}\n\n**핵심 키워드:** ${context.keywords.slice(0, 20).join(', ')}\n\n위 [참고 자료]에 있는 단어와 개념을 최우선으로 사용하여 분류하세요.`
    : '';

  return `
당신은 ${gradeName} ${subjectName} 선생님입니다.
다음 파일의 제목을 보고, 적절한 단원이나 주제 키워드를 추출하세요.

**분석할 파일명:** "${fileName}"
${contextPrompt}

**분석 규칙:**
1. 파일명이 [참고 자료]의 단원명이나 성취기준과 관련 있다면, 그 정확한 명칭을 사용하세요.
2. '얼마나', '진짜', '어떻게' 같은 잡다한 수식어는 버리고 '학습 용어'만 남기세요.
3. [참고 자료]에 없는 내용이라도 교과와 관련된 명사라면 추출하세요.

**출력 형식 (JSON):**
{
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "suggestedUnit": "가장 적합한 단원명",
  "confidence": 85,
  "reasoning": "분류 근거 한 줄 설명"
}
`.trim();
};

/**
 * 교육과정 컨텍스트 + 기존 규칙 기반 하이브리드 분류
 * 기존 classifyVideo와 함께 사용
 */
export const classifyWithCurriculumContext = (videoInfo, grade, subject) => {
  // 1. 기존 규칙 기반 분류 실행
  const ruleBasedResults = classifyVideo(videoInfo);
  
  // 2. 교육과정 컨텍스트 가져오기
  const context = getCurriculumContextForClassification(grade, subject);
  
  if (!context || context.keywords.length === 0) {
    // 컨텍스트 없으면 기존 결과 반환
    return {
      results: ruleBasedResults,
      contextUsed: false,
      message: '교육과정 컨텍스트 없음 - 규칙 기반 분류만 사용',
    };
  }

  // 3. 컨텍스트 키워드로 추가 부스트
  const fullText = `${videoInfo.title || ''} ${videoInfo.description || ''} ${videoInfo.summary || ''}`.toLowerCase();
  const contextMatches = context.keywords.filter(kw => fullText.includes(kw.toLowerCase()));

  // 4. 컨텍스트 매칭된 단원에 보너스 점수 부여
  const boostedResults = ruleBasedResults.map(result => {
    const matchingUnit = context.units.find(u => 
      result.id === u.id || 
      result.name?.includes(u.name) ||
      u.keywords.some(kw => result.matchedKeywords?.includes(kw))
    );

    if (matchingUnit) {
      return {
        ...result,
        score: result.score + 200, // 컨텍스트 보너스
        contextBoost: true,
        contextUnit: matchingUnit.name,
      };
    }
    return result;
  });

  // 5. 다시 점수순 정렬
  boostedResults.sort((a, b) => b.score - a.score);

  console.log(`🎓 [CONTEXT BOOST] ${grade} ${subject} 컨텍스트 적용`);
  console.log(`   매칭 키워드: ${contextMatches.slice(0, 5).join(', ')}`);

  return {
    results: boostedResults,
    contextUsed: true,
    contextMatches,
    contextUnits: context.units.length,
    message: `${context.units.length}개 단원 컨텍스트 적용됨`,
  };
};

export default {
  classifyVideo,
  getBestMatch,
  getClassificationSummary,
  testClassification,
  extractKeywords,
  detectSubjectCategory,
  getCriticalKeywords,
  getSemanticOverrideWords,
  getEntityKeywords,
  getActionKeywords,
  getCategoryMap,
  findCriticalKeywordMatch,
  checkSemanticOverride,
  findEntityMatch,
  hasActionKeyword,
  detectCategories,
  checkCategoryConflict,
  checkExactTitleMatch,
  applySubjectDiversityFilter,
  getSubjectFromFolderId,
  getSubjectName,
  removeMetadata,
  testMetadataRemoval,
  testEntityAction,
  testConflict,
  testTitleMatch,
  testDiversity,
  // 새로 추가된 교육과정 컨텍스트 함수들
  getCurriculumContextForClassification,
  buildClassificationPromptWithContext,
  classifyWithCurriculumContext,
};
