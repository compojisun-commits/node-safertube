# SaferTube

YouTube 영상을 AI로 분석하여 안전하게 시청할 수 있도록 도와주는 서비스입니다.

## 주요 기능

- 🤖 AI 기반 영상 내용 요약
- ⚠️ 부적절한 콘텐츠 탐지 및 시간 표시
- 📌 주요 장면 타임라인 자동 생성
- 📊 안전도 점수 (0-100)

## 기술 스택

- **Frontend**: React + Vite
- **Backend**: Firebase Cloud Functions
- **Database**: Firestore
- **AI**: Google Gemini API
- **Hosting**: Firebase Hosting

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
cd functions && npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Firebase CLI 로그인:

```bash
firebase login
firebase use --add  # 프로젝트 선택
```

### 3. 환경 변수 설정

#### Frontend (.env)
```bash
cp .env.example .env
```

`.env` 파일에 Firebase 설정 입력:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Backend (functions/.env)
```bash
cd functions
cp .env.example .env
```

`functions/.env` 파일에 API 키 입력:
```
GEMINI_API_KEY=your_gemini_api_key
```

**Gemini API 키 발급**: https://makersuite.google.com/app/apikey

**참고**: YouTube 자막은 `youtube-transcript` 라이브러리로 가져오므로 YouTube API 키는 불필요합니다.

### 4. Firestore 규칙 배포

```bash
firebase deploy --only firestore:rules
```

### 5. 개발 서버 실행

#### Frontend
```bash
npm run dev
```

#### Functions (로컬 에뮬레이터)
```bash
cd functions
npm run serve
```

### 6. 프로덕션 배포

```bash
# 빌드
npm run build

# 전체 배포 (hosting + functions)
firebase deploy
```

## 아키텍처

```
사용자 입력 (YouTube URL)
    ↓
Firestore에 문서 생성 (analysisRequests)
    ↓
Cloud Function 자동 트리거 (onDocumentCreated)
    ↓
Gemini API로 영상 분석
    ↓
분석 결과를 Firestore 문서에 업데이트
    ↓
React에서 실시간 리스닝 (onSnapshot)
    ↓
결과 화면에 표시
```

## 보안

- API 키는 Cloud Functions에서만 사용 (클라이언트에 노출되지 않음)
- Firestore Security Rules로 데이터 접근 제어
- 환경 변수는 `.env` 파일로 관리 (git에 커밋되지 않음)

## 개선 계획

- [x] 실제 YouTube 자막 API 연동 (youtube-transcript 사용)
- [ ] 사용자 인증 추가
- [ ] 분석 결과 캐싱 (중복 요청 방지)
- [ ] 더 정교한 필터링 알고리즘
- [ ] 크롬 확장 프로그램 버전
- [ ] 북마클릿 추가

## 라이선스

MIT
