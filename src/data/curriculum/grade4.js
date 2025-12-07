/**
 * 4학년 교육과정 데이터
 * 2022 개정 교육과정 기반
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade4Curriculum = [
  // ==========================================
  // 4학년 1학기
  // ==========================================
  
  // 국어 (2022 개정 국정 교과서)
  { id: 'g4-s1-kor', parentId: 'g4-s1', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g4-s1-kor-u0', parentId: 'g4-s1-kor', type: 'folder', name: '0. 독서 단원 (책과 함께 넓은 세상으로)',
    metadata: { keywords: ['독서', '책', '세상', '넓히기', '독후활동'] }
  },
  { id: 'g4-s1-kor-u1', parentId: 'g4-s1-kor', type: 'folder', name: '1. 생각과 느낌을 나누어요',
    metadata: { keywords: ['생각', '느낌', '공유', '토론', '나누기'] }
  },
  { id: 'g4-s1-kor-u2', parentId: 'g4-s1-kor', type: 'folder', name: '2. 내용을 간추려요',
    metadata: { keywords: ['요약', '간추리기', '핵심', '정리', '중심내용'] }
  },
  { id: 'g4-s1-kor-u3', parentId: 'g4-s1-kor', type: 'folder', name: '3. 느낌을 살려 말해요',
    metadata: { keywords: ['느낌', '표현', '말하기', '감정', '발표'] }
  },
  { id: 'g4-s1-kor-u4', parentId: 'g4-s1-kor', type: 'folder', name: '4. 일에 대한 의견을 써요',
    metadata: { keywords: ['의견', '글쓰기', '주장', '근거', '논설문'] }
  },
  { id: 'g4-s1-kor-u5', parentId: 'g4-s1-kor', type: 'folder', name: '5. 내가 만든 이야기',
    metadata: { keywords: ['이야기', '창작', '상상', '동화', '글짓기'] }
  },
  { id: 'g4-s1-kor-u6', parentId: 'g4-s1-kor', type: 'folder', name: '6. 회의를 해요',
    metadata: { keywords: ['회의', '토의', '의견', '진행', '결정'] }
  },
  { id: 'g4-s1-kor-u7', parentId: 'g4-s1-kor', type: 'folder', name: '7. 사전은 내 친구',
    metadata: { keywords: ['사전', '국어사전', '낱말', '뜻', '찾기'] }
  },
  { id: 'g4-s1-kor-u8', parentId: 'g4-s1-kor', type: 'folder', name: '8. 이런 제안 어때요',
    metadata: { keywords: ['제안', '건의', '의견', '설득', '제안문'] }
  },
  { id: 'g4-s1-kor-u9', parentId: 'g4-s1-kor', type: 'folder', name: '9. 자랑스러운 한글',
    metadata: { keywords: ['한글', '세종대왕', '훈민정음', '한글날', '자음모음'] }
  },

  // 사회 (2022 개정)
  { id: 'g4-s1-soc', parentId: 'g4-s1', type: 'folder', name: '사회',
    metadata: { subject: 'social', keywords: ['사회', '지역', '공동체', '시민'] }
  },
  { id: 'g4-s1-soc-u1', parentId: 'g4-s1-soc', type: 'folder', name: '1. 지역의 위치와 특성 (지도, 방위)',
    metadata: { keywords: ['지역', '위치', '지도', '방위', '동서남북', '축척', '기호'] }
  },
  { id: 'g4-s1-soc-u2', parentId: 'g4-s1-soc', type: 'folder', name: '2. 우리가 알아보는 지역의 역사 (문화유산)',
    metadata: { keywords: ['지역역사', '문화유산', '유적', '박물관', '전통', '조상'] }
  },
  { id: 'g4-s1-soc-u3', parentId: 'g4-s1-soc', type: 'folder', name: '3. 지역의 공공 기관과 주민 참여',
    metadata: { keywords: ['공공기관', '주민참여', '시청', '구청', '민원', '자치'] }
  },

  // ==========================================
  // 4학년 2학기
  // ==========================================
  
  // 국어 (2022 개정 국정 교과서)
  { id: 'g4-s2-kor', parentId: 'g4-s2', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g4-s2-kor-u0', parentId: 'g4-s2-kor', type: 'folder', name: '0. 독서 단원 (책을 읽으며 생각의 힘을 키워요)',
    metadata: { keywords: ['독서', '책', '생각', '사고력', '독후활동'] }
  },
  { id: 'g4-s2-kor-u1', parentId: 'g4-s2-kor', type: 'folder', name: '1. 이어질 장면을 생각해요',
    metadata: { keywords: ['예측', '장면', '상상', '전개', '이야기'] }
  },
  { id: 'g4-s2-kor-u2', parentId: 'g4-s2-kor', type: 'folder', name: '2. 마음을 전하는 글을 써요',
    metadata: { keywords: ['마음', '편지', '글쓰기', '감사', '감정'] }
  },
  { id: 'g4-s2-kor-u3', parentId: 'g4-s2-kor', type: 'folder', name: '3. 바르고 공손하게',
    metadata: { keywords: ['예절', '공손', '높임말', '존댓말', '언어예절'] }
  },
  { id: 'g4-s2-kor-u4', parentId: 'g4-s2-kor', type: 'folder', name: '4. 이야기 속 세상',
    metadata: { keywords: ['이야기', '동화', '세상', '상상', '문학'] }
  },
  { id: 'g4-s2-kor-u5', parentId: 'g4-s2-kor', type: 'folder', name: '5. 의견이 드러나게 글을 써요',
    metadata: { keywords: ['의견', '글쓰기', '주장', '논설문', '근거'] }
  },
  { id: 'g4-s2-kor-u6', parentId: 'g4-s2-kor', type: 'folder', name: '6. 본받고 싶은 인물을 찾아봐요',
    metadata: { keywords: ['인물', '위인', '본받기', '전기문', '존경'] }
  },
  { id: 'g4-s2-kor-u7', parentId: 'g4-s2-kor', type: 'folder', name: '7. 독서 감상문을 써요',
    metadata: { keywords: ['독서감상문', '독후감', '책', '감상', '글쓰기'] }
  },
  { id: 'g4-s2-kor-u8', parentId: 'g4-s2-kor', type: 'folder', name: '8. 생각하며 읽어요',
    metadata: { keywords: ['읽기', '생각', '비판', '분석', '사고'] }
  },

  // 과학 (2022 개정)
  { id: 'g4-s2-sci', parentId: 'g4-s2', type: 'folder', name: '과학',
    metadata: { subject: 'science', keywords: ['과학', '실험', '탐구', '자연'] }
  },
  { id: 'g4-s2-sci-u1', parentId: 'g4-s2-sci', type: 'folder', name: '1. 식물의 생활 (서식지별 특징)',
    metadata: { keywords: ['식물', '서식지', '환경', '적응', '뿌리', '잎', '줄기'] }
  },
  { id: 'g4-s2-sci-u2', parentId: 'g4-s2-sci', type: 'folder', name: '2. 물의 상태 변화 (얼음, 물, 수증기)',
    metadata: { keywords: ['물', '상태변화', '얼음', '수증기', '증발', '응결', '끓음'] }
  },
  { id: 'g4-s2-sci-u3', parentId: 'g4-s2-sci', type: 'folder', name: '3. 그림자와 거울',
    metadata: { keywords: ['그림자', '거울', '빛', '반사', '직진', '거울상'] }
  },
  { id: 'g4-s2-sci-u4', parentId: 'g4-s2-sci', type: 'folder', name: '4. 화산과 지진',
    metadata: { keywords: ['화산', '지진', '마그마', '용암', '지각', '대피', '지진대'] }
  },
  { id: 'g4-s2-sci-u5', parentId: 'g4-s2-sci', type: 'folder', name: '5. 물의 여행 (물 순환)',
    metadata: { keywords: ['물순환', '증발', '응결', '강수', '구름', '비', '눈'] }
  },
];
