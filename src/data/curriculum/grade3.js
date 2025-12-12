/**
 * 3학년 교육과정 데이터
 * 2022 개정 교육과정 기반
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade3Curriculum = [
  // ==========================================
  // 3학년 1학기
  // ==========================================
  
  // 국어 (2022 개정 국정 교과서)
  { id: 'g3-s1-kor', parentId: 'g3-s1', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g3-s1-kor-u0', parentId: 'g3-s1-kor', type: 'folder', name: '0. 독서 단원 (책은 내 친구)',
    metadata: { keywords: ['독서', '책', '읽기', '친구', '도서'] }
  },
  { id: 'g3-s1-kor-u1', parentId: 'g3-s1-kor', type: 'folder', name: '1. 재미가 톡톡톡 (시와 경험)',
    metadata: { keywords: ['시', '경험', '재미', '동시', '표현'] }
  },
  { id: 'g3-s1-kor-u2', parentId: 'g3-s1-kor', type: 'folder', name: '2. 문단과 문단 (문단의 짜임)',
    metadata: { keywords: ['문단', '짜임', '구조', '중심문장', '뒷받침문장'] }
  },
  { id: 'g3-s1-kor-u3', parentId: 'g3-s1-kor', type: 'folder', name: '3. 알맞은 높임 표현',
    metadata: { keywords: ['높임말', '존댓말', '예절', '높임표현', '경어'] }
  },
  { id: 'g3-s1-kor-u4', parentId: 'g3-s1-kor', type: 'folder', name: '4. 감동을 나타내요',
    metadata: { keywords: ['감동', '표현', '느낌', '감상', '글쓰기'] }
  },
  { id: 'g3-s1-kor-u5', parentId: 'g3-s1-kor', type: 'folder', name: '5. 주고받는 마음',
    metadata: { keywords: ['대화', '소통', '마음', '감정', '공감'] }
  },
  { id: 'g3-s1-kor-u6', parentId: 'g3-s1-kor', type: 'folder', name: '6. 일이 일어난 까닭',
    metadata: { keywords: ['원인', '결과', '까닭', '이유', '인과관계'] }
  },
  { id: 'g3-s1-kor-u7', parentId: 'g3-s1-kor', type: 'folder', name: '7. 반갑다, 국어사전',
    metadata: { keywords: ['국어사전', '사전', '낱말', '찾기', '뜻'] }
  },
  { id: 'g3-s1-kor-u8', parentId: 'g3-s1-kor', type: 'folder', name: '8. 의견이 있어요',
    metadata: { keywords: ['의견', '주장', '생각', '근거', '토의'] }
  },
  { id: 'g3-s1-kor-u9', parentId: 'g3-s1-kor', type: 'folder', name: '9. 어떤 내용일까',
    metadata: { keywords: ['예측', '내용', '추론', '짐작', '읽기'] }
  },
  { id: 'g3-s1-kor-u10', parentId: 'g3-s1-kor', type: 'folder', name: '10. 문학의 향기',
    metadata: { keywords: ['문학', '향기', '감상', '이야기', '동화'] }
  },

  // 수학 (2022 개정)
  { id: 'g3-s1-math', parentId: 'g3-s1', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g3-s1-math-u1', parentId: 'g3-s1-math', type: 'folder', name: '1. 덧셈과 뺄셈 (세 자리 수)',
    metadata: { keywords: ['덧셈', '뺄셈', '세자리수', '받아올림', '받아내림'] }
  },
  { id: 'g3-s1-math-u2', parentId: 'g3-s1-math', type: 'folder', name: '2. 평면도형 (선분, 직선, 직각)',
    metadata: { keywords: ['평면도형', '선분', '직선', '직각', '반직선'] }
  },
  { id: 'g3-s1-math-u3', parentId: 'g3-s1-math', type: 'folder', name: '3. 나눗셈',
    metadata: { keywords: ['나눗셈', '나누기', '몫', '나머지', '등분'] }
  },
  { id: 'g3-s1-math-u4', parentId: 'g3-s1-math', type: 'folder', name: '4. 곱셈',
    metadata: { keywords: ['곱셈', '곱하기', '올림', '두자리곱셈', '세자리곱셈'] }
  },
  { id: 'g3-s1-math-u5', parentId: 'g3-s1-math', type: 'folder', name: '5. 길이와 시간 (mm, km, 초)',
    metadata: { keywords: ['길이', '시간', 'mm', 'km', '초', '밀리미터', '킬로미터'] }
  },
  { id: 'g3-s1-math-u6', parentId: 'g3-s1-math', type: 'folder', name: '6. 분수와 소수',
    metadata: { keywords: ['분수', '소수', '분모', '분자', '소수점'] }
  },

  // ==========================================
  // 3학년 2학기
  // ==========================================
  
  // 국어 (2022 개정 국정 교과서)
  { id: 'g3-s2-kor', parentId: 'g3-s2', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g3-s2-kor-u0', parentId: 'g3-s2-kor', type: 'folder', name: '0. 독서 단원 (책을 읽고 생각을 넓혀요)',
    metadata: { keywords: ['독서', '책', '생각', '넓히기', '독후활동'] }
  },
  { id: 'g3-s2-kor-u1', parentId: 'g3-s2-kor', type: 'folder', name: '1. 경험과 관련지으며 이해해요',
    metadata: { keywords: ['경험', '이해', '연결', '배경지식', '관련'] }
  },
  { id: 'g3-s2-kor-u2', parentId: 'g3-s2-kor', type: 'folder', name: '2. 유창하게 발표해요',
    metadata: { keywords: ['발표', '유창', '말하기', '자신감', '청중'] }
  },
  { id: 'g3-s2-kor-u3', parentId: 'g3-s2-kor', type: 'folder', name: '3. 알맞은 낱말을 사용해요',
    metadata: { keywords: ['낱말', '어휘', '선택', '문맥', '적절'] }
  },
  { id: 'g3-s2-kor-u4', parentId: 'g3-s2-kor', type: 'folder', name: '4. 글의 짜임을 알아요',
    metadata: { keywords: ['글', '짜임', '구조', '처음', '중간', '끝'] }
  },
  { id: 'g3-s2-kor-u5', parentId: 'g3-s2-kor', type: 'folder', name: '5. 바르게 대화해요',
    metadata: { keywords: ['대화', '소통', '예절', '듣기', '말하기'] }
  },
  { id: 'g3-s2-kor-u6', parentId: 'g3-s2-kor', type: 'folder', name: '6. 마음을 담아 글을 써요',
    metadata: { keywords: ['글쓰기', '마음', '편지', '감정', '진심'] }
  },
  { id: 'g3-s2-kor-u7', parentId: 'g3-s2-kor', type: 'folder', name: '7. 글을 읽고 소개해요',
    metadata: { keywords: ['읽기', '소개', '요약', '추천', '책소개'] }
  },
  { id: 'g3-s2-kor-u8', parentId: 'g3-s2-kor', type: 'folder', name: '8. 글의 흐름을 생각해요',
    metadata: { keywords: ['흐름', '전개', '순서', '연결', '문맥'] }
  },
  { id: 'g3-s2-kor-u9', parentId: 'g3-s2-kor', type: 'folder', name: '9. 작품 속 인물이 되어',
    metadata: { keywords: ['인물', '역할극', '등장인물', '감정이입', '연극'] }
  },

  // 수학 (2022 개정)
  { id: 'g3-s2-math', parentId: 'g3-s2', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g3-s2-math-u1', parentId: 'g3-s2-math', type: 'folder', name: '1. 곱셈 (두 자리 수 × 두 자리 수)',
    metadata: { keywords: ['곱셈', '두자리곱셈', '올림', '곱하기', '암산'] }
  },
  { id: 'g3-s2-math-u2', parentId: 'g3-s2-math', type: 'folder', name: '2. 나눗셈 (세 자리 수 ÷ 한 자리 수)',
    metadata: { keywords: ['나눗셈', '세자리수', '몫', '나머지', '검산'] }
  },
  { id: 'g3-s2-math-u3', parentId: 'g3-s2-math', type: 'folder', name: '3. 원 (중심, 반지름, 지름)',
    metadata: { keywords: ['원', '중심', '반지름', '지름', '컴퍼스'] }
  },
  { id: 'g3-s2-math-u4', parentId: 'g3-s2-math', type: 'folder', name: '4. 분수 (가분수, 대분수)',
    metadata: { keywords: ['분수', '가분수', '대분수', '진분수', '분모분자'] }
  },
  { id: 'g3-s2-math-u5', parentId: 'g3-s2-math', type: 'folder', name: '5. 들이와 무게 (L, mL, kg)',
    metadata: { keywords: ['들이', '무게', '리터', 'L', 'mL', 'kg', 'g', '측정'] }
  },
  { id: 'g3-s2-math-u6', parentId: 'g3-s2-math', type: 'folder', name: '6. 자료의 정리 (표와 그림그래프)',
    metadata: { keywords: ['자료', '표', '그림그래프', '정리', '통계'] }
  },
];
