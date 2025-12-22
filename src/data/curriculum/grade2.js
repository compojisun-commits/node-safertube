/**
 * 2학년 교육과정 데이터
 * AI 자동 분류를 위한 단원별 키워드 포함
 */

export const grade2Curriculum = [
  // ==========================================
  // 2학년 1학기
  // ==========================================
  
  // 국어
  { id: 'g2-s1-kor', parentId: 'g2-s1', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g2-s1-kor-u1', parentId: 'g2-s1-kor', type: 'folder', name: '1. 시를 즐겨요',
    metadata: { keywords: ['시', '동시', '운율', '감상', '낭송'] }
  },
  { id: 'g2-s1-kor-u2', parentId: 'g2-s1-kor', type: 'folder', name: '2. 자신 있게 말해요',
    metadata: { keywords: ['말하기', '자신감', '발표', '또박또박', '큰소리'] }
  },
  { id: 'g2-s1-kor-u3', parentId: 'g2-s1-kor', type: 'folder', name: '3. 마음을 나누어요',
    metadata: { keywords: ['마음', '감정', '공감', '나눔', '소통'] }
  },
  { id: 'g2-s1-kor-u4', parentId: 'g2-s1-kor', type: 'folder', name: '4. 말놀이를 해요',
    metadata: { keywords: ['말놀이', '끝말잇기', '수수께끼', '언어유희', '재미'] }
  },
  { id: 'g2-s1-kor-u5', parentId: 'g2-s1-kor', type: 'folder', name: '5. 낱말을 바르게 써요',
    metadata: { keywords: ['낱말', '맞춤법', '바른글씨', '띄어쓰기', '받아쓰기'] }
  },
  { id: 'g2-s1-kor-u6', parentId: 'g2-s1-kor', type: 'folder', name: '6. 차례대로 말해요',
    metadata: { keywords: ['순서', '차례', '설명', '절차', '단계'] }
  },
  { id: 'g2-s1-kor-u7', parentId: 'g2-s1-kor', type: 'folder', name: '7. 친구들에게 알려요',
    metadata: { keywords: ['알림', '전달', '정보', '공유', '소개'] }
  },
  { id: 'g2-s1-kor-u8', parentId: 'g2-s1-kor', type: 'folder', name: '8. 마음을 짐작해요',
    metadata: { keywords: ['마음', '짐작', '추론', '감정', '이해'] }
  },
  { id: 'g2-s1-kor-u9', parentId: 'g2-s1-kor', type: 'folder', name: '9. 생각을 생생하게 나타내요',
    metadata: { keywords: ['표현', '생생', '묘사', '글쓰기', '구체적'] }
  },
  { id: 'g2-s1-kor-u10', parentId: 'g2-s1-kor', type: 'folder', name: '10. 다른 사람을 생각해요',
    metadata: { keywords: ['배려', '존중', '타인', '예절', '공감'] }
  },

  // 수학
  { id: 'g2-s1-math', parentId: 'g2-s1', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '숫자', '계산', '연산'] }
  },
  { id: 'g2-s1-math-u1', parentId: 'g2-s1-math', type: 'folder', name: '1. 세 자리 수',
    metadata: { keywords: ['세자리수', '백', '자릿값', '읽기', '쓰기'] }
  },
  { id: 'g2-s1-math-u2', parentId: 'g2-s1-math', type: 'folder', name: '2. 여러 가지 도형',
    metadata: { keywords: ['도형', '삼각형', '사각형', '원', '꼭짓점'] }
  },
  { id: 'g2-s1-math-u3', parentId: 'g2-s1-math', type: 'folder', name: '3. 덧셈과 뺄셈',
    metadata: { keywords: ['덧셈', '뺄셈', '받아올림', '받아내림', '계산'] }
  },
  { id: 'g2-s1-math-u4', parentId: 'g2-s1-math', type: 'folder', name: '4. 길이 재기',
    metadata: { keywords: ['길이', '센티미터', 'cm', '자', '측정'] }
  },
  { id: 'g2-s1-math-u5', parentId: 'g2-s1-math', type: 'folder', name: '5. 분류하기',
    metadata: { keywords: ['분류', '기준', '종류', '나누기', '그룹'] }
  },
  { id: 'g2-s1-math-u6', parentId: 'g2-s1-math', type: 'folder', name: '6. 곱셈',
    metadata: { keywords: ['곱셈', '곱하기', '배', '묶음', '구구단'] }
  },

  // 통합교과
  { id: 'g2-s1-int', parentId: 'g2-s1', type: 'folder', name: '통합교과',
    metadata: { subject: 'integrated', keywords: ['통합', '바른생활', '슬기로운생활', '즐거운생활'] }
  },
  { id: 'g2-s1-int-u1', parentId: 'g2-s1-int', type: 'folder', name: '1. 알쏭달쏭 나',
    metadata: { keywords: ['나', '자아', '성장', '꿈', '소개'] }
  },
  { id: 'g2-s1-int-u2', parentId: 'g2-s1-int', type: 'folder', name: '2. 봄 (봄이 오면)',
    metadata: { keywords: ['봄', '꽃', '새싹', '봄날씨', '동물'] }
  },
  { id: 'g2-s1-int-u3', parentId: 'g2-s1-int', type: 'folder', name: '3. 가족 (다양한 가족)',
    metadata: { keywords: ['가족', '다양한가족', '사랑', '화목', '역할'] }
  },
  { id: 'g2-s1-int-u4', parentId: 'g2-s1-int', type: 'folder', name: '4. 여름 (여름 세상)',
    metadata: { keywords: ['여름', '더위', '물놀이', '여름과일', '휴가'] }
  },

  // ==========================================
  // 2학년 2학기
  // ==========================================
  
  // 국어
  { id: 'g2-s2-kor', parentId: 'g2-s2', type: 'folder', name: '국어',
    metadata: { subject: 'korean', keywords: ['국어', '읽기', '쓰기', '말하기', '듣기'] }
  },
  { id: 'g2-s2-kor-u1', parentId: 'g2-s2-kor', type: 'folder', name: '1. 장면을 떠올리며',
    metadata: { keywords: ['장면', '상상', '읽기', '그림', '이야기'] }
  },
  { id: 'g2-s2-kor-u2', parentId: 'g2-s2-kor', type: 'folder', name: '2. 인상 깊었던 일을 써요',
    metadata: { keywords: ['인상', '경험', '일기', '글쓰기', '기억'] }
  },
  { id: 'g2-s2-kor-u3', parentId: 'g2-s2-kor', type: 'folder', name: '3. 말의 재미를 찾아서',
    metadata: { keywords: ['말', '재미', '말놀이', '비유', '표현'] }
  },
  { id: 'g2-s2-kor-u4', parentId: 'g2-s2-kor', type: 'folder', name: '4. 인물을 소개해요',
    metadata: { keywords: ['인물', '소개', '특징', '성격', '설명'] }
  },
  { id: 'g2-s2-kor-u5', parentId: 'g2-s2-kor', type: 'folder', name: '5. 간직하고 싶은 노래',
    metadata: { keywords: ['노래', '동요', '가사', '음악', '감상'] }
  },
  { id: 'g2-s2-kor-u6', parentId: 'g2-s2-kor', type: 'folder', name: '6. 자세하게 소개해요',
    metadata: { keywords: ['소개', '자세하게', '설명', '묘사', '특징'] }
  },
  { id: 'g2-s2-kor-u7', parentId: 'g2-s2-kor', type: 'folder', name: '7. 일이 일어난 차례를 살펴요',
    metadata: { keywords: ['순서', '차례', '이야기', '전개', '흐름'] }
  },
  { id: 'g2-s2-kor-u8', parentId: 'g2-s2-kor', type: 'folder', name: '8. 바르게 말해요',
    metadata: { keywords: ['바른말', '높임말', '존댓말', '예절', '언어'] }
  },
  { id: 'g2-s2-kor-u9', parentId: 'g2-s2-kor', type: 'folder', name: '9. 주요 내용을 확인해요',
    metadata: { keywords: ['주요내용', '핵심', '요약', '정리', '파악'] }
  },
  { id: 'g2-s2-kor-u10', parentId: 'g2-s2-kor', type: 'folder', name: '10. 칭찬하는 말을 주고받아요',
    metadata: { keywords: ['칭찬', '격려', '긍정', '말하기', '소통'] }
  },

  // 수학
  { id: 'g2-s2-math', parentId: 'g2-s2', type: 'folder', name: '수학',
    metadata: { subject: 'math', keywords: ['수학', '숫자', '계산', '연산'] }
  },
  { id: 'g2-s2-math-u1', parentId: 'g2-s2-math', type: 'folder', name: '1. 네 자리 수',
    metadata: { keywords: ['네자리수', '천', '자릿값', '큰수', '읽기'] }
  },
  { id: 'g2-s2-math-u2', parentId: 'g2-s2-math', type: 'folder', name: '2. 곱셈구구',
    metadata: { keywords: ['곱셈구구', '구구단', '외우기', '곱하기', '단'] }
  },
  { id: 'g2-s2-math-u3', parentId: 'g2-s2-math', type: 'folder', name: '3. 길이 재기',
    metadata: { keywords: ['길이', '미터', 'm', '측정', '어림'] }
  },
  { id: 'g2-s2-math-u4', parentId: 'g2-s2-math', type: 'folder', name: '4. 시각과 시간',
    metadata: { keywords: ['시각', '시간', '시계', '분', '몇시몇분'] }
  },
  { id: 'g2-s2-math-u5', parentId: 'g2-s2-math', type: 'folder', name: '5. 표와 그래프',
    metadata: { keywords: ['표', '그래프', '자료', '정리', '막대그래프'] }
  },
  { id: 'g2-s2-math-u6', parentId: 'g2-s2-math', type: 'folder', name: '6. 규칙 찾기',
    metadata: { keywords: ['규칙', '패턴', '찾기', '반복', '수배열'] }
  },

  // 통합교과
  { id: 'g2-s2-int', parentId: 'g2-s2', type: 'folder', name: '통합교과',
    metadata: { subject: 'integrated', keywords: ['통합', '바른생활', '슬기로운생활', '즐거운생활'] }
  },
  { id: 'g2-s2-int-u1', parentId: 'g2-s2-int', type: 'folder', name: '1. 가을 (가을 숲)',
    metadata: { keywords: ['가을', '숲', '단풍', '낙엽', '열매'] }
  },
  { id: 'g2-s2-int-u2', parentId: 'g2-s2-int', type: 'folder', name: '2. 마을 (우리 마을)',
    metadata: { keywords: ['마을', '이웃', '공공기관', '가게', '시장'] }
  },
  { id: 'g2-s2-int-u3', parentId: 'g2-s2-int', type: 'folder', name: '3. 겨울 (두근두근 겨울)',
    metadata: { keywords: ['겨울', '눈', '추위', '크리스마스', '설날'] }
  },
];


