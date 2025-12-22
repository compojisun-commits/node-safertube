/**
 * 5학년 교육과정 데이터
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade5Curriculum = [
  // ==========================================
  // 5학년 1학기
  // ==========================================
  
  // 수학
  { id: 'g5-s1-math', parentId: 'g5-s1', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g5-s1-math-u1', parentId: 'g5-s1-math', type: 'folder', name: '1. 자연수의 혼합 계산',
    metadata: { keywords: ['혼합계산', '자연수', '괄호', '순서', '사칙연산'] }
  },
  { id: 'g5-s1-math-u2', parentId: 'g5-s1-math', type: 'folder', name: '2. 약수와 배수',
    metadata: { keywords: ['약수', '배수', '공약수', '공배수', '최대공약수', '최소공배수'] }
  },
  { id: 'g5-s1-math-u3', parentId: 'g5-s1-math', type: 'folder', name: '3. 규칙과 대응',
    metadata: { keywords: ['규칙', '대응', '관계', '패턴', '비례'] }
  },
  { id: 'g5-s1-math-u4', parentId: 'g5-s1-math', type: 'folder', name: '4. 약분과 통분',
    metadata: { keywords: ['약분', '통분', '분수', '분모', '기약분수'] }
  },
  { id: 'g5-s1-math-u5', parentId: 'g5-s1-math', type: 'folder', name: '5. 분수의 덧셈과 뺄셈',
    metadata: { keywords: ['분수', '덧셈', '뺄셈', '통분', '이분모'] }
  },
  { id: 'g5-s1-math-u6', parentId: 'g5-s1-math', type: 'folder', name: '6. 다각형의 둘레와 넓이',
    metadata: { keywords: ['다각형', '둘레', '넓이', '사각형', '삼각형', '면적'] }
  },

  // 사회
  { id: 'g5-s1-soc', parentId: 'g5-s1', type: 'folder', name: '사회',
    metadata: { subject: 'social', keywords: ['사회', '국토', '인권', '정의'] }
  },
  { id: 'g5-s1-soc-u1', parentId: 'g5-s1-soc', type: 'folder', name: '1. 국토와 우리 생활',
    metadata: { keywords: ['국토', '한반도', '영토', '기후', '지형', '산맥', '강'] }
  },
  { id: 'g5-s1-soc-u2', parentId: 'g5-s1-soc', type: 'folder', name: '2. 인권 존중과 정의로운 사회',
    metadata: { keywords: ['인권', '정의', '존중', '평등', '차별', '권리', '헌법'] }
  },

  // 과학
  { id: 'g5-s1-sci', parentId: 'g5-s1', type: 'folder', name: '과학',
    metadata: { subject: 'science', keywords: ['과학', '실험', '탐구', '자연'] }
  },
  { id: 'g5-s1-sci-u1', parentId: 'g5-s1-sci', type: 'folder', name: '1. 과학자의 탐구',
    metadata: { keywords: ['탐구', '과학자', '실험', '관찰', '가설', '결론'] }
  },
  { id: 'g5-s1-sci-u2', parentId: 'g5-s1-sci', type: 'folder', name: '2. 온도와 열',
    metadata: { keywords: ['온도', '열', '온도계', '열전달', '전도', '대류', '복사'] }
  },
  { id: 'g5-s1-sci-u3', parentId: 'g5-s1-sci', type: 'folder', name: '3. 태양계와 별',
    metadata: { keywords: ['태양계', '별', '행성', '지구', '달', '태양', '우주', '별자리'] }
  },
  { id: 'g5-s1-sci-u4', parentId: 'g5-s1-sci', type: 'folder', name: '4. 용해와 용액',
    metadata: { keywords: ['용해', '용액', '녹이기', '용질', '용매', '농도'] }
  },
  { id: 'g5-s1-sci-u5', parentId: 'g5-s1-sci', type: 'folder', name: '5. 다양한 생물과 우리 생활',
    metadata: { keywords: ['생물', '세균', '곰팡이', '바이러스', '미생물', '발효'] }
  },

  // 실과
  { id: 'g5-s1-prac', parentId: 'g5-s1', type: 'folder', name: '실과',
    metadata: { subject: 'practical', keywords: ['실과', '가정', '기술', '생활'] }
  },
  { id: 'g5-s1-prac-u1', parentId: 'g5-s1-prac', type: 'folder', name: '1. 나의 성장과 발달',
    metadata: { keywords: ['성장', '발달', '사춘기', '신체', '정서', '변화'] }
  },
  { id: 'g5-s1-prac-u2', parentId: 'g5-s1-prac', type: 'folder', name: '2. 균형 잡힌 식생활',
    metadata: { keywords: ['식생활', '영양소', '균형', '식단', '건강', '음식'] }
  },
  { id: 'g5-s1-prac-u3', parentId: 'g5-s1-prac', type: 'folder', name: '3. 옷 입기와 관리하기',
    metadata: { keywords: ['옷', '의복', '관리', '세탁', '정리', '계절옷'] }
  },
  { id: 'g5-s1-prac-u4', parentId: 'g5-s1-prac', type: 'folder', name: '4. 생활 속의 동식물 이용',
    metadata: { keywords: ['동물', '식물', '이용', '사육', '재배', '생활'] }
  },
  { id: 'g5-s1-prac-u5', parentId: 'g5-s1-prac', type: 'folder', name: '5. 수송 기술과 안전',
    metadata: { keywords: ['수송', '기술', '안전', '교통', '자동차', '비행기'] }
  },

  // ==========================================
  // 5학년 2학기
  // ==========================================
  
  // 수학
  { id: 'g5-s2-math', parentId: 'g5-s2', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g5-s2-math-u1', parentId: 'g5-s2-math', type: 'folder', name: '1. 수의 범위와 어림하기',
    metadata: { keywords: ['수의범위', '어림', '반올림', '올림', '버림', '이상이하'] }
  },
  { id: 'g5-s2-math-u2', parentId: 'g5-s2-math', type: 'folder', name: '2. 분수의 곱셈',
    metadata: { keywords: ['분수', '곱셈', '곱하기', '진분수', '대분수'] }
  },
  { id: 'g5-s2-math-u3', parentId: 'g5-s2-math', type: 'folder', name: '3. 합동과 대칭',
    metadata: { keywords: ['합동', '대칭', '도형', '선대칭', '점대칭', '대칭축'] }
  },
  { id: 'g5-s2-math-u4', parentId: 'g5-s2-math', type: 'folder', name: '4. 소수의 곱셈',
    metadata: { keywords: ['소수', '곱셈', '곱하기', '소수점', '자릿수'] }
  },
  { id: 'g5-s2-math-u5', parentId: 'g5-s2-math', type: 'folder', name: '5. 직육면체',
    metadata: { keywords: ['직육면체', '정육면체', '면', '모서리', '꼭짓점', '전개도'] }
  },
  { id: 'g5-s2-math-u6', parentId: 'g5-s2-math', type: 'folder', name: '6. 평균과 가능성',
    metadata: { keywords: ['평균', '가능성', '확률', '통계', '자료'] }
  },

  // 사회
  { id: 'g5-s2-soc', parentId: 'g5-s2', type: 'folder', name: '사회',
    metadata: { subject: 'social', keywords: ['사회', '역사', '한국사'] }
  },
  { id: 'g5-s2-soc-u1', parentId: 'g5-s2-soc', type: 'folder', name: '1. 옛사람들의 삶과 문화 (고조선~고려)',
    metadata: { keywords: ['고조선', '삼국시대', '통일신라', '발해', '고려', '역사', '문화유산'] }
  },
  { id: 'g5-s2-soc-u2', parentId: 'g5-s2-soc', type: 'folder', name: '2. 사회의 새로운 변화와 오늘날의 우리 (조선~현대)',
    metadata: { keywords: ['조선', '일제강점기', '광복', '6.25', '현대사', '민주화'] }
  },

  // 과학
  { id: 'g5-s2-sci', parentId: 'g5-s2', type: 'folder', name: '과학',
    metadata: { subject: 'science', keywords: ['과학', '실험', '탐구', '자연'] }
  },
  { id: 'g5-s2-sci-u1', parentId: 'g5-s2-sci', type: 'folder', name: '1. 재미있는 나의 탐구',
    metadata: { keywords: ['탐구', '실험', '관찰', '자유탐구', '보고서'] }
  },
  { id: 'g5-s2-sci-u2', parentId: 'g5-s2-sci', type: 'folder', name: '2. 생물과 환경',
    metadata: { keywords: ['생물', '환경', '생태계', '먹이사슬', '적응', '서식지'] }
  },
  { id: 'g5-s2-sci-u3', parentId: 'g5-s2-sci', type: 'folder', name: '3. 날씨와 우리 생활',
    metadata: { keywords: ['날씨', '기상', '기온', '습도', '기압', '구름', '비'] }
  },
  { id: 'g5-s2-sci-u4', parentId: 'g5-s2-sci', type: 'folder', name: '4. 물체의 운동',
    metadata: { keywords: ['운동', '속력', '속도', '거리', '시간', '이동'] }
  },
  { id: 'g5-s2-sci-u5', parentId: 'g5-s2-sci', type: 'folder', name: '5. 산과 염기',
    metadata: { keywords: ['산', '염기', '산성', '염기성', '중화', '지시약', 'pH'] }
  },
];
