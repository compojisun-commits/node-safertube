/**
 * 6학년 교육과정 데이터
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade6Curriculum = [
  // ==========================================
  // 6학년 1학기
  // ==========================================
  
  // 수학
  { id: 'g6-s1-math', parentId: 'g6-s1', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g6-s1-math-u1', parentId: 'g6-s1-math', type: 'folder', name: '1. 분수의 나눗셈',
    metadata: { keywords: ['분수', '나눗셈', '나누기', '역수', '분모분자'] }
  },
  { id: 'g6-s1-math-u2', parentId: 'g6-s1-math', type: 'folder', name: '2. 각기둥과 각뿔',
    metadata: { keywords: ['각기둥', '각뿔', '삼각기둥', '사각기둥', '전개도', '입체도형'] }
  },
  { id: 'g6-s1-math-u3', parentId: 'g6-s1-math', type: 'folder', name: '3. 소수의 나눗셈',
    metadata: { keywords: ['소수', '나눗셈', '나누기', '소수점', '몫'] }
  },
  { id: 'g6-s1-math-u4', parentId: 'g6-s1-math', type: 'folder', name: '4. 비와 비율',
    metadata: { keywords: ['비', '비율', '비교', '백분율', '퍼센트', '%'] }
  },
  { id: 'g6-s1-math-u5', parentId: 'g6-s1-math', type: 'folder', name: '5. 여러 가지 그래프',
    metadata: { keywords: ['그래프', '띠그래프', '원그래프', '통계', '자료'] }
  },
  { id: 'g6-s1-math-u6', parentId: 'g6-s1-math', type: 'folder', name: '6. 직육면체의 부피와 겉넓이',
    metadata: { keywords: ['직육면체', '부피', '겉넓이', '세제곱', '표면적'] }
  },

  // 국어
  { id: 'g6-s1-kor', parentId: 'g6-s1', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g6-s1-kor-u1', parentId: 'g6-s1-kor', type: 'folder', name: '1. 비유하는 표현',
    metadata: { keywords: ['비유', '표현', '직유', '은유', '비유법'] }
  },
  { id: 'g6-s1-kor-u2', parentId: 'g6-s1-kor', type: 'folder', name: '2. 이야기를 간추려요',
    metadata: { keywords: ['이야기', '간추리기', '요약', '줄거리', '핵심'] }
  },
  { id: 'g6-s1-kor-u3', parentId: 'g6-s1-kor', type: 'folder', name: '3. 짜임새 있게 구성해요',
    metadata: { keywords: ['짜임새', '구성', '글쓰기', '구조', '개요'] }
  },
  { id: 'g6-s1-kor-u4', parentId: 'g6-s1-kor', type: 'folder', name: '4. 주장을 뒷받침해요',
    metadata: { keywords: ['주장', '뒷받침', '근거', '논설문', '설득'] }
  },
  { id: 'g6-s1-kor-u5', parentId: 'g6-s1-kor', type: 'folder', name: '5. 속담을 활용해요',
    metadata: { keywords: ['속담', '활용', '관용어', '표현', '의미'] }
  },
  { id: 'g6-s1-kor-u6', parentId: 'g6-s1-kor', type: 'folder', name: '6. 내용을 추론해요',
    metadata: { keywords: ['추론', '내용', '생략', '짐작', '유추'] }
  },
  { id: 'g6-s1-kor-u7', parentId: 'g6-s1-kor', type: 'folder', name: '7. 우리말을 가꾸어요',
    metadata: { keywords: ['우리말', '한글', '올바른말', '언어순화', '맞춤법'] }
  },
  { id: 'g6-s1-kor-u8', parentId: 'g6-s1-kor', type: 'folder', name: '8. 인물의 삶을 찾아서',
    metadata: { keywords: ['인물', '삶', '전기문', '위인', '인물탐구'] }
  },
  { id: 'g6-s1-kor-u9', parentId: 'g6-s1-kor', type: 'folder', name: '9. 마음을 나누는 글을 써요',
    metadata: { keywords: ['마음', '글쓰기', '감사', '위로', '편지'] }
  },

  // 사회
  { id: 'g6-s1-soc', parentId: 'g6-s1', type: 'folder', name: '사회',
    metadata: { subject: 'social', keywords: ['사회', '정치', '경제', '민주주의'] }
  },
  { id: 'g6-s1-soc-u1', parentId: 'g6-s1-soc', type: 'folder', name: '1. 우리나라의 정치 발전',
    metadata: { keywords: ['정치', '민주주의', '선거', '국회', '정부', '법원', '4.19', '5.18', '6월항쟁', '비상계엄'] }
  },
  { id: 'g6-s1-soc-u2', parentId: 'g6-s1-soc', type: 'folder', name: '2. 우리나라의 경제 발전',
    metadata: { keywords: ['경제', '발전', '산업화', '경제성장', '무역', '수출입'] }
  },

  // 과학
  { id: 'g6-s1-sci', parentId: 'g6-s1', type: 'folder', name: '과학',
    metadata: { subject: 'science', keywords: ['과학', '실험', '탐구', '자연'] }
  },
  { id: 'g6-s1-sci-u1', parentId: 'g6-s1-sci', type: 'folder', name: '1. 과학자처럼 탐구해 볼까요',
    metadata: { keywords: ['탐구', '과학자', '실험', '관찰', '변인'] }
  },
  { id: 'g6-s1-sci-u2', parentId: 'g6-s1-sci', type: 'folder', name: '2. 지구와 달의 운동',
    metadata: { keywords: ['지구', '달', '운동', '자전', '공전', '계절', '달의위상'] }
  },
  { id: 'g6-s1-sci-u3', parentId: 'g6-s1-sci', type: 'folder', name: '3. 여러 가지 기체',
    metadata: { keywords: ['기체', '산소', '이산화탄소', '질소', '공기'] }
  },
  { id: 'g6-s1-sci-u4', parentId: 'g6-s1-sci', type: 'folder', name: '4. 식물의 구조와 기능',
    metadata: { keywords: ['식물', '구조', '기능', '뿌리', '줄기', '잎', '광합성', '증산작용'] }
  },
  { id: 'g6-s1-sci-u5', parentId: 'g6-s1-sci', type: 'folder', name: '5. 빛과 렌즈',
    metadata: { keywords: ['빛', '렌즈', '볼록렌즈', '오목렌즈', '굴절', '초점'] }
  },

  // 영어
  { id: 'g6-s1-eng', parentId: 'g6-s1', type: 'folder', name: '영어',
    metadata: { subject: 'english', keywords: ['영어', 'English', '듣기', '말하기', '읽기', '쓰기'] }
  },
  { id: 'g6-s1-eng-u1', parentId: 'g6-s1-eng', type: 'folder', name: "1. I'm in the Sixth Grade",
    metadata: { keywords: ['학년', 'grade', '자기소개', 'introduction'] }
  },
  { id: 'g6-s1-eng-u2', parentId: 'g6-s1-eng', type: 'folder', name: '2. What Do You Do on Weekends?',
    metadata: { keywords: ['주말', 'weekend', '취미', 'hobby', '활동'] }
  },
  { id: 'g6-s1-eng-u3', parentId: 'g6-s1-eng', type: 'folder', name: '3. Why Are You Happy?',
    metadata: { keywords: ['감정', 'emotion', 'happy', 'sad', '이유', 'why'] }
  },
  { id: 'g6-s1-eng-u4', parentId: 'g6-s1-eng', type: 'folder', name: '4. Where Is the Post Office?',
    metadata: { keywords: ['위치', 'location', '길찾기', 'direction', '장소'] }
  },
  { id: 'g6-s1-eng-u5', parentId: 'g6-s1-eng', type: 'folder', name: '5. May I Drink Some Juice?',
    metadata: { keywords: ['허락', 'permission', 'may', '요청', 'request'] }
  },
  { id: 'g6-s1-eng-u6', parentId: 'g6-s1-eng', type: 'folder', name: '6. When Is Your Birthday?',
    metadata: { keywords: ['생일', 'birthday', '날짜', 'date', '월'] }
  },

  // 도덕
  { id: 'g6-s1-moral', parentId: 'g6-s1', type: 'folder', name: '도덕',
    metadata: { subject: 'moral', keywords: ['도덕', '윤리', '가치', '인성'] }
  },
  { id: 'g6-s1-moral-u1', parentId: 'g6-s1-moral', type: 'folder', name: '1. 내 삶의 주인은 나',
    metadata: { keywords: ['자아', '주체', '자율', '책임', '선택'] }
  },
  { id: 'g6-s1-moral-u2', parentId: 'g6-s1-moral', type: 'folder', name: '2. 우리가 만드는 도덕적인 세상',
    metadata: { keywords: ['도덕', '세상', '공동체', '정의', '공정'] }
  },
  { id: 'g6-s1-moral-u3', parentId: 'g6-s1-moral', type: 'folder', name: '3. 나를 돌아보는 생활',
    metadata: { keywords: ['성찰', '반성', '자기성찰', '생활태도'] }
  },
  { id: 'g6-s1-moral-u4', parentId: 'g6-s1-moral', type: 'folder', name: '4. 공정한 생활',
    metadata: { keywords: ['공정', '정의', '평등', '규칙', '차별'] }
  },
  { id: 'g6-s1-moral-u5', parentId: 'g6-s1-moral', type: 'folder', name: '5. 함께 지키는 평화',
    metadata: { keywords: ['평화', '비폭력', '갈등해결', '화해', '협력'] }
  },
  { id: 'g6-s1-moral-u6', parentId: 'g6-s1-moral', type: 'folder', name: '6. 함께 살아가는 지구촌',
    metadata: { keywords: ['지구촌', '세계시민', '다문화', '환경', '지속가능'] }
  },

  // 실과
  { id: 'g6-s1-prac', parentId: 'g6-s1', type: 'folder', name: '실과',
    metadata: { subject: 'practical', keywords: ['실과', '가정', '기술', '생활'] }
  },
  { id: 'g6-s1-prac-u1', parentId: 'g6-s1-prac', type: 'folder', name: '1. 일과 직업의 세계',
    metadata: { keywords: ['직업', '일', '진로', '적성', '미래직업'] }
  },
  { id: 'g6-s1-prac-u2', parentId: 'g6-s1-prac', type: 'folder', name: '2. 생활 자원 관리',
    metadata: { keywords: ['자원', '관리', '시간', '돈', '용돈', '저축'] }
  },
  { id: 'g6-s1-prac-u3', parentId: 'g6-s1-prac', type: 'folder', name: '3. 안전하고 맛있는 식생활',
    metadata: { keywords: ['식생활', '안전', '요리', '조리', '식품안전'] }
  },
  { id: 'g6-s1-prac-u4', parentId: 'g6-s1-prac', type: 'folder', name: '4. 생활 속 소프트웨어',
    metadata: { keywords: ['소프트웨어', 'SW', '코딩', '프로그래밍', '알고리즘'] }
  },
  { id: 'g6-s1-prac-u5', parentId: 'g6-s1-prac', type: 'folder', name: '5. 발명과 로봇',
    metadata: { keywords: ['발명', '로봇', '창의', '아이디어', '기술'] }
  },

  // ==========================================
  // 6학년 2학기
  // ==========================================
  
  // 수학
  { id: 'g6-s2-math', parentId: 'g6-s2', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '계산', '연산', '문제해결'] }
  },
  { id: 'g6-s2-math-u1', parentId: 'g6-s2-math', type: 'folder', name: '1. 분수의 나눗셈',
    metadata: { keywords: ['분수', '나눗셈', '나누기', '역수'] }
  },
  { id: 'g6-s2-math-u2', parentId: 'g6-s2-math', type: 'folder', name: '2. 소수의 나눗셈',
    metadata: { keywords: ['소수', '나눗셈', '나누기', '소수점'] }
  },
  { id: 'g6-s2-math-u3', parentId: 'g6-s2-math', type: 'folder', name: '3. 공간과 입체',
    metadata: { keywords: ['공간', '입체', '쌓기나무', '입체도형', '공간감각'] }
  },
  { id: 'g6-s2-math-u4', parentId: 'g6-s2-math', type: 'folder', name: '4. 비례식과 비례배분',
    metadata: { keywords: ['비례식', '비례배분', '비', '비율', '비례'] }
  },
  { id: 'g6-s2-math-u5', parentId: 'g6-s2-math', type: 'folder', name: '5. 원의 넓이',
    metadata: { keywords: ['원', '넓이', '원주', '지름', '반지름', '파이'] }
  },
  { id: 'g6-s2-math-u6', parentId: 'g6-s2-math', type: 'folder', name: '6. 원기둥, 원뿔, 구',
    metadata: { keywords: ['원기둥', '원뿔', '구', '입체도형', '전개도'] }
  },

  // 국어
  { id: 'g6-s2-kor', parentId: 'g6-s2', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g6-s2-kor-u1', parentId: 'g6-s2-kor', type: 'folder', name: '1. 작품 속 인물과 나',
    metadata: { keywords: ['인물', '작품', '감정이입', '등장인물', '나'] }
  },
  { id: 'g6-s2-kor-u2', parentId: 'g6-s2-kor', type: 'folder', name: '2. 관용 표현을 활용해요',
    metadata: { keywords: ['관용', '표현', '관용어', '숙어', '활용'] }
  },
  { id: 'g6-s2-kor-u3', parentId: 'g6-s2-kor', type: 'folder', name: '3. 타당한 근거로 글을 써요',
    metadata: { keywords: ['근거', '타당', '논설문', '주장', '글쓰기'] }
  },
  { id: 'g6-s2-kor-u4', parentId: 'g6-s2-kor', type: 'folder', name: '4. 효과적으로 발표해요',
    metadata: { keywords: ['발표', '효과적', '말하기', '자료', '프레젠테이션'] }
  },
  { id: 'g6-s2-kor-u5', parentId: 'g6-s2-kor', type: 'folder', name: '5. 글에 담긴 생각과 비교해요',
    metadata: { keywords: ['비교', '생각', '관점', '비판적읽기', '분석'] }
  },
  { id: 'g6-s2-kor-u6', parentId: 'g6-s2-kor', type: 'folder', name: '6. 정보와 표현 판단하기',
    metadata: { keywords: ['정보', '표현', '판단', '미디어리터러시', '뉴스'] }
  },
  { id: 'g6-s2-kor-u7', parentId: 'g6-s2-kor', type: 'folder', name: '7. 우리말을 가꾸어요',
    metadata: { keywords: ['우리말', '한글', '바른말', '언어순화'] }
  },
  { id: 'g6-s2-kor-u8', parentId: 'g6-s2-kor', type: 'folder', name: '8. 작품으로 경험해요',
    metadata: { keywords: ['작품', '경험', '문학', '감상', '독서'] }
  },
  { id: 'g6-s2-kor-u9', parentId: 'g6-s2-kor', type: 'folder', name: '9. 마음을 나누는 글을 써요',
    metadata: { keywords: ['마음', '나눔', '글쓰기', '감사', '편지'] }
  },

  // 사회
  { id: 'g6-s2-soc', parentId: 'g6-s2', type: 'folder', name: '사회',
    metadata: { subject: 'social', keywords: ['사회', '세계', '통일', '지구촌'] }
  },
  { id: 'g6-s2-soc-u1', parentId: 'g6-s2-soc', type: 'folder', name: '1. 세계의 여러 나라들',
    metadata: { keywords: ['세계', '나라', '문화', '지리', '대륙', '국가'] }
  },
  { id: 'g6-s2-soc-u2', parentId: 'g6-s2-soc', type: 'folder', name: '2. 통일 한국의 미래와 지구촌의 평화',
    metadata: { keywords: ['통일', '한국', '북한', '지구촌', '평화', '분단'] }
  },

  // 과학
  { id: 'g6-s2-sci', parentId: 'g6-s2', type: 'folder', name: '과학',
    metadata: { subject: 'science', keywords: ['과학', '실험', '탐구', '자연'] }
  },
  { id: 'g6-s2-sci-u1', parentId: 'g6-s2-sci', type: 'folder', name: '1. 재미있는 나의 탐구',
    metadata: { keywords: ['탐구', '실험', '자유탐구', '보고서'] }
  },
  { id: 'g6-s2-sci-u2', parentId: 'g6-s2-sci', type: 'folder', name: '2. 전기의 이용',
    metadata: { keywords: ['전기', '전류', '전압', '회로', '저항', '전구'] }
  },
  { id: 'g6-s2-sci-u3', parentId: 'g6-s2-sci', type: 'folder', name: '3. 계절의 변화',
    metadata: { keywords: ['계절', '변화', '자전축', '기울기', '남중고도', '낮길이'] }
  },
  { id: 'g6-s2-sci-u4', parentId: 'g6-s2-sci', type: 'folder', name: '4. 연소와 소화',
    metadata: { keywords: ['연소', '소화', '불', '산소', '소화기', '화재'] }
  },
  { id: 'g6-s2-sci-u5', parentId: 'g6-s2-sci', type: 'folder', name: '5. 우리 몸의 구조와 기능',
    metadata: { keywords: ['몸', '구조', '기능', '소화', '호흡', '순환', '배설', '뼈', '근육'] }
  },
  { id: 'g6-s2-sci-u6', parentId: 'g6-s2-sci', type: 'folder', name: '6. 에너지와 생활',
    metadata: { keywords: ['에너지', '생활', '전환', '절약', '신재생에너지'] }
  },

  // 영어
  { id: 'g6-s2-eng', parentId: 'g6-s2', type: 'folder', name: '영어',
    metadata: { subject: 'english', keywords: ['영어', 'English', '듣기', '말하기', '읽기', '쓰기'] }
  },
  { id: 'g6-s2-eng-u7', parentId: 'g6-s2-eng', type: 'folder', name: "7. I'll Go to the Park",
    metadata: { keywords: ['미래', 'will', '계획', 'plan', '공원'] }
  },
  { id: 'g6-s2-eng-u8', parentId: 'g6-s2-eng', type: 'folder', name: "8. I'm Stronger Than You",
    metadata: { keywords: ['비교', 'comparison', '비교급', 'stronger', 'than'] }
  },
  { id: 'g6-s2-eng-u9', parentId: 'g6-s2-eng', type: 'folder', name: '9. What Do You Think?',
    metadata: { keywords: ['의견', 'opinion', 'think', '생각'] }
  },
  { id: 'g6-s2-eng-u10', parentId: 'g6-s2-eng', type: 'folder', name: '10. How Can I Get to the Museum?',
    metadata: { keywords: ['길찾기', 'direction', '교통', '장소', 'museum'] }
  },
  { id: 'g6-s2-eng-u11', parentId: 'g6-s2-eng', type: 'folder', name: '11. I Want to Be a Pilot',
    metadata: { keywords: ['꿈', 'dream', '직업', 'job', 'pilot', '미래'] }
  },
];
