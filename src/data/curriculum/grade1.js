/**
 * 1학년 교육과정 데이터
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade1Curriculum = [
  // ==========================================
  // 1학년 1학기
  // ==========================================
  
  // 국어
  { id: 'g1-s1-kor', parentId: 'g1-s1', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '한글', '읽기', '쓰기', '말하기'] }
  },
  { id: 'g1-s1-kor-u1', parentId: 'g1-s1-kor', type: 'folder', name: '1. 학교는 즐거워',
    metadata: { keywords: ['학교', '즐거움', '친구', '선생님', '입학'] }
  },
  { id: 'g1-s1-kor-u2', parentId: 'g1-s1-kor', type: 'folder', name: '2. 재미있게 ㄱㄴㄷ',
    metadata: { keywords: ['자음', 'ㄱㄴㄷ', '한글', '글자', '자음자'] }
  },
  { id: 'g1-s1-kor-u3', parentId: 'g1-s1-kor', type: 'folder', name: '3. 다 함께 아야어여',
    metadata: { keywords: ['모음', '아야어여', '한글', '모음자', '글자'] }
  },
  { id: 'g1-s1-kor-u4', parentId: 'g1-s1-kor', type: 'folder', name: '4. 글자를 만들어요',
    metadata: { keywords: ['글자', '만들기', '자음', '모음', '조합'] }
  },
  { id: 'g1-s1-kor-u5', parentId: 'g1-s1-kor', type: 'folder', name: '5. 기분 좋게 인사해요',
    metadata: { keywords: ['인사', '예절', '기분', '안녕', '감사'] }
  },
  { id: 'g1-s1-kor-u6', parentId: 'g1-s1-kor', type: 'folder', name: '6. 받침이 있는 글자',
    metadata: { keywords: ['받침', '글자', '종성', '한글', '읽기'] }
  },
  { id: 'g1-s1-kor-u7', parentId: 'g1-s1-kor', type: 'folder', name: '7. 생각을 나타내요',
    metadata: { keywords: ['생각', '표현', '말하기', '느낌', '의견'] }
  },
  { id: 'g1-s1-kor-u8', parentId: 'g1-s1-kor', type: 'folder', name: '8. 소리 내어 읽어요',
    metadata: { keywords: ['읽기', '소리', '낭독', '발음', '글읽기'] }
  },
  { id: 'g1-s1-kor-u9', parentId: 'g1-s1-kor', type: 'folder', name: '9. 그림일기를 써요',
    metadata: { keywords: ['그림일기', '일기', '글쓰기', '하루', '기록'] }
  },

  // 수학
  { id: 'g1-s1-math', parentId: 'g1-s1', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '숫자', '계산', '연산'] }
  },
  { id: 'g1-s1-math-u1', parentId: 'g1-s1-math', type: 'folder', name: '1. 9까지의 수',
    metadata: { keywords: ['수', '숫자', '1부터9', '세기', '개수'] }
  },
  { id: 'g1-s1-math-u2', parentId: 'g1-s1-math', type: 'folder', name: '2. 여러 가지 모양',
    metadata: { keywords: ['모양', '도형', '세모', '네모', '동그라미'] }
  },
  { id: 'g1-s1-math-u3', parentId: 'g1-s1-math', type: 'folder', name: '3. 덧셈과 뺄셈',
    metadata: { keywords: ['덧셈', '뺄셈', '더하기', '빼기', '계산'] }
  },
  { id: 'g1-s1-math-u4', parentId: 'g1-s1-math', type: 'folder', name: '4. 비교하기',
    metadata: { keywords: ['비교', '크기', '길이', '무게', '넓이'] }
  },
  { id: 'g1-s1-math-u5', parentId: 'g1-s1-math', type: 'folder', name: '5. 50까지의 수',
    metadata: { keywords: ['수', '숫자', '50까지', '십의자리', '세기'] }
  },

  // 통합교과
  { id: 'g1-s1-int', parentId: 'g1-s1', type: 'folder', name: '통합교과',
    metadata: { subject: 'integrated', keywords: ['통합', '바른생활', '슬기로운생활', '즐거운생활'] }
  },
  { id: 'g1-s1-int-u1', parentId: 'g1-s1-int', type: 'folder', name: '1. 학교 (우리 학교)',
    metadata: { keywords: ['학교', '우리학교', '교실', '운동장', '급식실'] }
  },
  { id: 'g1-s1-int-u2', parentId: 'g1-s1-int', type: 'folder', name: '2. 봄 (봄바람)',
    metadata: { keywords: ['봄', '봄바람', '꽃', '새싹', '따뜻함'] }
  },
  { id: 'g1-s1-int-u3', parentId: 'g1-s1-int', type: 'folder', name: '3. 가족 (우리 가족)',
    metadata: { keywords: ['가족', '우리가족', '엄마', '아빠', '형제'] }
  },
  { id: 'g1-s1-int-u4', parentId: 'g1-s1-int', type: 'folder', name: '4. 여름 (여름 방학)',
    metadata: { keywords: ['여름', '방학', '더위', '물놀이', '휴가'] }
  },

  // ==========================================
  // 1학년 2학기
  // ==========================================
  
  // 국어
  { id: 'g1-s2-kor', parentId: 'g1-s2', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g1-s2-kor-u1', parentId: 'g1-s2-kor', type: 'folder', name: '1. 책이랑 친해져요',
    metadata: { keywords: ['책', '독서', '읽기', '그림책', '도서관'] }
  },
  { id: 'g1-s2-kor-u2', parentId: 'g1-s2-kor', type: 'folder', name: '2. 소리와 모양을 흉내 내요',
    metadata: { keywords: ['의성어', '의태어', '흉내말', '소리', '모양'] }
  },
  { id: 'g1-s2-kor-u3', parentId: 'g1-s2-kor', type: 'folder', name: '3. 문장으로 표현해요',
    metadata: { keywords: ['문장', '표현', '글쓰기', '주어', '서술어'] }
  },
  { id: 'g1-s2-kor-u4', parentId: 'g1-s2-kor', type: 'folder', name: '4. 바른 자세로 말해요',
    metadata: { keywords: ['말하기', '자세', '바른말', '예절', '태도'] }
  },
  { id: 'g1-s2-kor-u5', parentId: 'g1-s2-kor', type: 'folder', name: '5. 알맞은 목소리로 읽어요',
    metadata: { keywords: ['읽기', '목소리', '발음', '낭독', '크기'] }
  },
  { id: 'g1-s2-kor-u6', parentId: 'g1-s2-kor', type: 'folder', name: '6. 고운 말을 해요',
    metadata: { keywords: ['고운말', '바른말', '언어예절', '존댓말', '인사'] }
  },
  { id: 'g1-s2-kor-u7', parentId: 'g1-s2-kor', type: 'folder', name: '7. 무엇이 중요할까요',
    metadata: { keywords: ['중요', '핵심', '내용', '요약', '정리'] }
  },
  { id: 'g1-s2-kor-u8', parentId: 'g1-s2-kor', type: 'folder', name: '8. 띄어 읽어요',
    metadata: { keywords: ['띄어읽기', '띄어쓰기', '문장', '읽기', '끊어읽기'] }
  },
  { id: 'g1-s2-kor-u9', parentId: 'g1-s2-kor', type: 'folder', name: '9. 겪은 일을 글로 써요',
    metadata: { keywords: ['글쓰기', '경험', '일기', '생활문', '이야기'] }
  },

  // 수학
  { id: 'g1-s2-math', parentId: 'g1-s2', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '숫자', '계산', '연산'] }
  },
  { id: 'g1-s2-math-u1', parentId: 'g1-s2-math', type: 'folder', name: '1. 100까지의 수',
    metadata: { keywords: ['수', '100까지', '백', '자릿값', '세기'] }
  },
  { id: 'g1-s2-math-u2', parentId: 'g1-s2-math', type: 'folder', name: '2. 덧셈과 뺄셈(1)',
    metadata: { keywords: ['덧셈', '뺄셈', '더하기', '빼기', '받아올림'] }
  },
  { id: 'g1-s2-math-u3', parentId: 'g1-s2-math', type: 'folder', name: '3. 여러 가지 모양',
    metadata: { keywords: ['모양', '도형', '입체', '상자', '공'] }
  },
  { id: 'g1-s2-math-u4', parentId: 'g1-s2-math', type: 'folder', name: '4. 덧셈과 뺄셈(2)',
    metadata: { keywords: ['덧셈', '뺄셈', '받아내림', '계산', '연산'] }
  },
  { id: 'g1-s2-math-u5', parentId: 'g1-s2-math', type: 'folder', name: '5. 시계 보기와 규칙 찾기',
    metadata: { keywords: ['시계', '시간', '규칙', '패턴', '몇시'] }
  },
  { id: 'g1-s2-math-u6', parentId: 'g1-s2-math', type: 'folder', name: '6. 덧셈과 뺄셈(3)',
    metadata: { keywords: ['덧셈', '뺄셈', '세자리', '계산', '문제해결'] }
  },

  // 통합교과
  { id: 'g1-s2-int', parentId: 'g1-s2', type: 'folder', name: '통합교과',
    metadata: { subject: 'integrated', keywords: ['통합', '바른생활', '슬기로운생활', '즐거운생활'] }
  },
  { id: 'g1-s2-int-u1', parentId: 'g1-s2-int', type: 'folder', name: '1. 가을 (가을 놀이)',
    metadata: { keywords: ['가을', '놀이', '낙엽', '단풍', '추석'] }
  },
  { id: 'g1-s2-int-u2', parentId: 'g1-s2-int', type: 'folder', name: '2. 나라 (우리나라)',
    metadata: { keywords: ['나라', '우리나라', '대한민국', '태극기', '무궁화'] }
  },
  { id: 'g1-s2-int-u3', parentId: 'g1-s2-int', type: 'folder', name: '3. 겨울 (겨울 방학)',
    metadata: { keywords: ['겨울', '방학', '눈', '크리스마스', '새해'] }
  },
];
