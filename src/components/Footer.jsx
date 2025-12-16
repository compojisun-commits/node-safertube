import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Footer({ onNavigate }) {
  const { user } = useAuth();

  const handleAccountDeletion = async () => {
    if (!user) {
      await Swal.fire({
        title: "로그인 필요",
        text: "탈퇴는 로그인 후 이용 가능합니다.",
        icon: "info",
        confirmButtonColor: "#dc3232",
      });
      return;
    }

    const result = await Swal.fire({
      title: "탈퇴 요청 메일을 보낼까요?",
      html: `
        <div style="text-align: left; line-height: 1.8;">
          <p>• 최대한 빠른 기간 안에 확인 후 데이터가 모두 삭제됩니다.</p>
          <p>• 모든 데이터 삭제 후에 이메일을 보내드립니다.</p>
          <p style="margin-top: 15px; color: #dc3545; font-weight: bold;">⚠️ 삭제되는 데이터:</p>
          <ul style="margin: 10px 0;">
            <li>계정 정보 (이메일, 이름)</li>
            <li>분석 기록 (모든 영상 분석 내역)</li>
            <li>추천 기록 (모든 수업 추천 내역)</li>
            <li>찜보따리 (저장한 영상 및 폴더)</li>
          </ul>
          <p style="color: #dc3545; font-weight: bold;">이 작업은 되돌릴 수 없습니다.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "탈퇴",
      cancelButtonText: "취소",
      width: "600px",
    });

    if (result.isConfirmed) {
      try {
        await addDoc(collection(db, "accountDeletionRequests"), {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || "",
          requestedAt: Timestamp.now(),
          status: "pending",
          processedAt: null,
        });

        await Swal.fire({
          title: "탈퇴 요청 완료",
          html: `
            <p>탈퇴 요청이 접수되었습니다.</p>
            <p>최대한 빠른 시일 내에 처리하여</p>
            <p><strong>${user.email}</strong>로 완료 이메일을 보내드립니다.</p>
          `,
          icon: "success",
          confirmButtonColor: "#dc3232",
        });
      } catch (error) {
        console.error("탈퇴 요청 오류:", error);
        await Swal.fire({
          title: "오류",
          text: "탈퇴 요청 중 오류가 발생했습니다. 다시 시도해주세요.",
          icon: "error",
          confirmButtonColor: "#dc3232",
        });
      }
    }
  };

  return (
    <footer className="app-footer-container">
      <div className="footer-links">
        <button onClick={() => onNavigate("terms")} className="footer-link">
          이용약관
        </button>
        <span className="footer-divider">|</span>
        <button onClick={() => onNavigate("privacy")} className="footer-link">
          개인정보 처리방침
        </button>
        <span className="footer-divider">|</span>
        <button
          onClick={handleAccountDeletion}
          className="footer-link footer-link-red"
        >
          탈퇴요청
        </button>
      </div>

      <div className="footer-info">
        <p>
          <strong>튜브링</strong> - 교실에서 안전하게 YouTube를 활용하세요
        </p>
        <p>AI 기반 YouTube 콘텐츠 안전 분석 서비스 (by. 퀴리쌤, 말랑한거봉)</p>
        <p>© 2025 튜브링. All rights reserved.</p>
      </div>
    </footer>
  );
}
