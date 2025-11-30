export default function Privacy({ onBack }) {
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

      <h1 style={{ color: '#ff0000', marginBottom: '20px' }}>개인정보 처리방침</h1>

      <div style={{ lineHeight: '1.8', color: '#333' }}>
        <p><strong>튜브링</strong> (이하 "서비스")는 이용자의 개인정보를 소중히 다루며, 개인정보 보호법 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법규를 준수합니다.</p>

        <p><strong>최종 수정일:</strong> 2025년 10월 28일<br/>
        <strong>시행일:</strong> 2025년 10월 28일</p>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #eee' }} />

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>1. 수집하는 개인정보 항목</h2>

        <h3 style={{ marginTop: '20px' }}>1.1 회원가입 및 로그인 시 수집 정보</h3>
        <ul>
          <li><strong>Google 로그인:</strong> 이메일 주소, 이름, 프로필 사진</li>
          <li><strong>수집 방법:</strong> Google OAuth 2.0을 통한 로그인</li>
        </ul>

        <h3 style={{ marginTop: '20px' }}>1.2 서비스 이용 과정에서 자동 수집되는 정보</h3>
        <ul>
          <li>분석 요청 기록 (YouTube URL, 선택한 학년 정보)</li>
          <li>영상 추천 요청 기록 (수업 주제, 목표, 검색 필터)</li>
          <li>체육/미술 수업 요청 기록 (활동 유형, 사용 가능한 도구, 교사 개입 정도)</li>
          <li>서비스 이용 기록 (분석 횟수, 크레딧 사용량)</li>
          <li>이메일 알림 수신 여부 및 이메일 주소 (선택 시)</li>
          <li>비로그인 사용자: 익명 식별자 (anonymousId)</li>
          <li>약관 동의 기록 (동의 시간, 동의 버전)</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>2. 개인정보의 수집 및 이용 목적</h2>

        <h3 style={{ marginTop: '20px' }}>2.1 회원 관리</h3>
        <ul>
          <li>회원제 서비스 이용에 따른 본인 식별 및 인증</li>
          <li>회원자격 유지 및 관리</li>
          <li>서비스 부정이용 방지</li>
        </ul>

        <h3 style={{ marginTop: '20px' }}>2.2 서비스 제공</h3>
        <ul>
          <li>YouTube 영상 안전성 분석 및 결과 제공</li>
          <li>학년별 맞춤 분석 제공</li>
          <li>영상 전체 흐름 요약 제공</li>
          <li>교육용 영상 추천 서비스 (주제별, 필터 적용)</li>
          <li>체육/미술 수업 영상 추천 서비스</li>
          <li>분석 결과 이메일 발송 (선택 시)</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>3. 개인정보의 보유 및 이용 기간</h2>
        <ul>
          <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (탈퇴 후 즉시 삭제)</li>
          <li><strong>분석 기록:</strong> 로그인 사용자 - 회원 탈퇴 시까지 / 비로그인 사용자 - 최초 생성일로부터 30일</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>4. 개인정보의 제3자 제공</h2>
        <p>튜브링은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
        <p><strong>외부 서비스 이용:</strong></p>
        <ul>
          <li><strong>Google Firebase:</strong> 사용자 인증, 데이터 저장, 서버리스 함수 실행</li>
          <li><strong>Google Gemini API:</strong> AI 기반 영상 분석</li>
          <li><strong>Gmail SMTP:</strong> 분석 결과 이메일 발송 (선택 시)</li>
        </ul>

        <h2 style={{ color: '#ff0000', marginTop: '30px' }}>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>개인정보 정정 요구</li>
          <li>개인정보 삭제 요구</li>
          <li>회원 탈퇴 (동의 철회)</li>
        </ul>

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #eee' }} />

        <p><strong>본 방침은 2025년 10월 28일부터 시행됩니다.</strong></p>
      </div>
    </div>
  );
}
