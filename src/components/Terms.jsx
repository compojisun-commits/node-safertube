export default function Terms({ onBack }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '900px',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      marginBottom: '100px'
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← 돌아가기
        </button>
      )}

      <h1 style={{ color: '#ff0000', marginBottom: '20px' }}>이용약관</h1>

      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p><strong>튜브링</strong> 서비스 이용약관에 오신 것을 환영합니다.<br/>
        본 약관은 튜브링(이하 "서비스")의 이용과 관련하여 이용자와 서비스 제공자 간의 권리, 의무 및 책임사항을 규정합니다.</p>

        <p><strong>최종 수정일:</strong> 2025년 10월 28일<br/>
        <strong>시행일:</strong> 2025년 10월 28일</p>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #eee' }} />

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제1조 (목적)</h2>
        <p>본 약관은 튜브링이 제공하는 YouTube 영상 안전성 분석 서비스(이하 "서비스")의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제2조 (용어의 정의)</h2>
        <ol>
          <li><strong>"서비스"</strong>란 튜브링이 제공하는 YouTube 영상 안전성 분석, 영상 추천 등 모든 관련 서비스를 의미합니다.</li>
          <li><strong>"이용자"</strong>란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
          <li><strong>"회원"</strong>란 서비스에 로그인하여 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
          <li><strong>"비회원"</strong>란 로그인하지 않고 서비스를 이용하는 자를 말합니다.</li>
          <li><strong>"콘텐츠"</strong>란 서비스 내에서 이용자가 분석을 요청한 YouTube 영상 및 분석 결과를 의미합니다.</li>
        </ol>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제4조 (서비스의 제공)</h2>
        <p>튜브링은 다음과 같은 서비스를 제공합니다:</p>
        <ul>
          <li>YouTube 영상 안전성 분석 (학년별 맞춤 분석)</li>
          <li>부적절한 콘텐츠 탐지 및 타임스탬프 표시</li>
          <li>영상 전체 흐름 요약 (긴 영상 지원)</li>
          <li>교육용 영상 추천 (주제별 검색)</li>
          <li>체육/미술 수업 영상 추천 (도구 및 교사 개입 수준 기반)</li>
          <li>영상 검색 필터 (40분 이상, 최신순, 조회수순)</li>
          <li>분석 결과 이메일 발송 (선택 시)</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제6조 (이용 제한)</h2>
        <p><strong>일일 분석 한도:</strong></p>
        <ul>
          <li>로그인 회원: 하루 10회 (영상 분석 + 영상 추천)</li>
          <li>비로그인 사용자: 하루 3회 (영상 분석 + 영상 추천)</li>
          <li>한도는 매일 자정(KST)에 초기화됩니다.</li>
          <li>체육/미술 추천도 영상 추천 한도에 포함됩니다.</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제9조 (AI 분석 결과의 한계)</h2>
        <p>튜브링은 Google Gemini AI를 활용하여 영상을 분석합니다.</p>
        <p><strong>AI 분석의 한계:</strong></p>
        <ul>
          <li>AI 분석 결과는 참고용이며, 100% 정확성을 보장하지 않습니다.</li>
          <li>문맥, 교육적 맥락 등에 따라 판단이 달라질 수 있습니다.</li>
          <li>최종 사용 여부는 이용자(교사, 학부모 등)가 직접 판단해야 합니다.</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>제10조 (면책 조항)</h2>
        <p>튜브링은 현재 무료 서비스로 제공되며, 서비스 이용으로 인한 일체의 손해에 대해 책임지지 않습니다.</p>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #eee' }} />

        <p><strong>본 약관은 2025년 10월 28일부터 시행됩니다.</strong></p>
        <p>튜브링 서비스를 이용해주셔서 감사합니다.</p>
      </div>
    </div>
  );
}
