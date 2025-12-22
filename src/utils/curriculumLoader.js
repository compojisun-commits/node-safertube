/**
 * 교육과정 컨텍스트 로더 (브라우저 호환)
 * 
 * AI 분류 시 학년/과목별 교육과정 데이터를 "컨닝 페이퍼"처럼 제공합니다.
 * Node.js fs 대신 정적 import된 데이터를 활용합니다.
 */

import { CurriculumDatabase, getFolderPath } from '../data/curriculumDatabase';

// 학년 코드 매핑
const GRADE_MAP = {
  '1학년': 'g1', 'elementary-1': 'g1', '초1': 'g1', '1': 'g1',
  '2학년': 'g2', 'elementary-2': 'g2', '초2': 'g2', '2': 'g2',
  '3학년': 'g3', 'elementary-3': 'g3', '초3': 'g3', '3': 'g3',
  '4학년': 'g4', 'elementary-4': 'g4', '초4': 'g4', '4': 'g4',
  '5학년': 'g5', 'elementary-5': 'g5', '초5': 'g5', '5': 'g5',
  '6학년': 'g6', 'elementary-6': 'g6', '초6': 'g6', '6': 'g6',
  // 복합 학년
  'elementary-5-6': 'g5', // 기본값 5학년
  '5-6학년': 'g5',
};

// 과목 코드 매핑
const SUBJECT_MAP = {
  '국어': 'kor', 'korean': 'kor',
  '수학': 'math', 'mathematics': 'math',
  '사회': 'soc', 'social': 'soc',
  '과학': 'sci', 'science': 'sci',
  '도덕': 'moral', 'ethics': 'moral',
  '영어': 'eng', 'english': 'eng',
  '음악': 'music',
  '미술': 'art',
  '체육': 'pe',
  '실과': 'prac', 'practical': 'prac',
  '통합': 'int', 'integrated': 'int',
};

// 학년 코드로 정규화
const normalizeGrade = (grade) => {
  if (!grade) return null;
  const normalized = String(grade).toLowerCase().trim();
  return GRADE_MAP[normalized] || GRADE_MAP[grade] || null;
};

// 과목 코드로 정규화
const normalizeSubject = (subject) => {
  if (!subject) return null;
  const normalized = String(subject).toLowerCase().trim();
  return SUBJECT_MAP[normalized] || SUBJECT_MAP[subject] || null;
};

/**
 * 특정 학년, 과목의 교육과정 컨텍스트를 가져옵니다.
 * @param {string} grade - 학년 (예: '6학년', 'elementary-6', '6')
 * @param {string} subject - 과목 (예: '사회', 'social')
 * @returns {Object|null} - { units: [...], keywords: [...], summary: string }
 */
export function getCurriculumContext(grade, subject) {
  try {
    const gradeCode = normalizeGrade(grade);
    const subjectCode = normalizeSubject(subject);
    
    if (!gradeCode) {
      console.warn(`[curriculumLoader] 알 수 없는 학년: ${grade}`);
      return null;
    }

    // CurriculumDatabase.hierarchy에서 해당 학년/과목의 단원들 필터링
    // ID 패턴: g6-s1-soc-u1 (6학년 1학기 사회 1단원)
    const relevantFolders = CurriculumDatabase.hierarchy.filter(folder => {
      if (!folder.id || folder.type !== 'folder') return false;
      
      // 학년 매칭
      const matchesGrade = folder.id.startsWith(gradeCode + '-');
      
      // 과목 매칭 (있으면 적용, 없으면 전체)
      const matchesSubject = subjectCode 
        ? folder.id.includes(`-${subjectCode}-`) || folder.id.includes(`-${subjectCode}`)
        : true;
      
      // metadata가 있는 단원만 (실제 교육과정 데이터)
      const hasContent = folder.metadata && (folder.metadata.keywords || folder.metadata.achievementStandards);
      
      return matchesGrade && matchesSubject && hasContent;
    });

    if (relevantFolders.length === 0) {
      console.log(`[curriculumLoader] ${grade} ${subject || '전과목'} 교육과정 데이터 없음`);
      return null;
    }

    // 단원 정보 수집
    const units = relevantFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: getFolderPath(folder.id),
      keywords: folder.metadata?.keywords || [],
      standards: folder.metadata?.achievementStandards || [],
    }));

    // 전체 키워드 수집 (중복 제거)
    const allKeywords = [...new Set(
      relevantFolders.flatMap(f => f.metadata?.keywords || [])
    )];

    // AI에게 전달할 요약 문자열 생성
    const summaryParts = units.map(u => 
      `• ${u.name}: ${u.keywords.slice(0, 5).join(', ')}`
    );
    const summary = summaryParts.join('\n').slice(0, 3000); // 토큰 절약

    return {
      grade: gradeCode,
      subject: subjectCode,
      units,
      keywords: allKeywords,
      summary,
      count: units.length,
    };
  } catch (error) {
    console.error('[curriculumLoader] 교육과정 로딩 실패:', error);
    return null;
  }
}

/**
 * 모든 학년의 특정 과목 교육과정을 가져옵니다.
 * @param {string} subject - 과목
 * @returns {Object|null}
 */
export function getAllGradesCurriculumBySubject(subject) {
  const subjectCode = normalizeSubject(subject);
  if (!subjectCode) return null;

  const results = {};
  ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].forEach(gradeCode => {
    const context = getCurriculumContext(gradeCode, subject);
    if (context && context.count > 0) {
      results[gradeCode] = context;
    }
  });

  return Object.keys(results).length > 0 ? results : null;
}

/**
 * AI 프롬프트용 컨텍스트 문자열을 생성합니다.
 * @param {string} grade - 학년
 * @param {string} subject - 과목
 * @returns {string} - 프롬프트에 삽입할 문자열
 */
export function buildCurriculumPrompt(grade, subject) {
  const context = getCurriculumContext(grade, subject);
  
  if (!context || context.count === 0) {
    return '';
  }

  const gradeName = {
    'g1': '1학년', 'g2': '2학년', 'g3': '3학년',
    'g4': '4학년', 'g5': '5학년', 'g6': '6학년',
  }[context.grade] || context.grade;

  const subjectName = {
    'kor': '국어', 'math': '수학', 'soc': '사회', 'sci': '과학',
    'moral': '도덕', 'eng': '영어', 'music': '음악', 'art': '미술',
    'pe': '체육', 'prac': '실과', 'int': '통합',
  }[context.subject] || context.subject || '전과목';

  return `
[참고 자료: ${gradeName} ${subjectName} 교육과정 및 단원 목록]
${context.summary}

**핵심 키워드:** ${context.keywords.slice(0, 20).join(', ')}

위 [참고 자료]에 있는 단원명과 키워드를 최우선으로 사용하여 분류하세요.
`.trim();
}

/**
 * 교육과정 기반 파일 분류 분석 (Gemini API 연동용)
 * @param {string} fileName - 분석할 파일명
 * @param {string} grade - 학년
 * @param {string} subject - 과목
 * @param {Function} geminiCall - Gemini API 호출 함수 (외부 주입)
 * @returns {Promise<Object>}
 */
export async function analyzeFileCategory(fileName, grade, subject, geminiCall) {
  // 1. 교육과정 데이터 가져오기 (컨닝 페이퍼 준비)
  const contextPrompt = buildCurriculumPrompt(grade, subject);

  const gradeName = grade.includes('학년') ? grade : `${grade}학년`;
  const subjectName = subject || '전과목';

  // 2. 프롬프트 구성
  const prompt = `
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

  // 3. Gemini API 호출 (외부 함수 사용)
  if (geminiCall && typeof geminiCall === 'function') {
    try {
      const response = await geminiCall(prompt);
      return {
        success: true,
        result: response,
        contextUsed: !!contextPrompt,
      };
    } catch (error) {
      console.error('[analyzeFileCategory] API 호출 실패:', error);
      return {
        success: false,
        error: error.message,
        contextUsed: !!contextPrompt,
      };
    }
  }

  // geminiCall이 없으면 프롬프트만 반환
  return {
    success: false,
    prompt,
    contextUsed: !!contextPrompt,
    message: 'geminiCall 함수가 제공되지 않았습니다.',
  };
}

// 디버깅용: 특정 학년/과목의 교육과정 출력
export function debugCurriculumContext(grade, subject) {
  const context = getCurriculumContext(grade, subject);
  
  console.log('\n========================================');
  console.log(`📚 교육과정 컨텍스트: ${grade} ${subject || '전과목'}`);
  console.log('========================================');
  
  if (!context) {
    console.log('❌ 데이터 없음');
    return;
  }

  console.log(`📁 단원 수: ${context.count}개`);
  console.log(`🔑 키워드 수: ${context.keywords.length}개`);
  console.log('\n[단원 목록]');
  context.units.forEach(u => {
    console.log(`  • ${u.name}`);
    console.log(`    키워드: ${u.keywords.slice(0, 5).join(', ')}`);
  });
  console.log('\n[프롬프트용 요약]');
  console.log(context.summary);
  console.log('========================================\n');
  
  return context;
}

export default {
  getCurriculumContext,
  getAllGradesCurriculumBySubject,
  buildCurriculumPrompt,
  analyzeFileCategory,
  debugCurriculumContext,
};


