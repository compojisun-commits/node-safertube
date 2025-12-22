import { collection, addDoc, getDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 풀어 보따리(sharedVideos)에 영상 공유
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoUrl
 * @param {string} params.videoId
 * @param {object} params.analysis - 분석 결과 전체
 * @param {string} [params.title]
 * @param {string} [params.grade]
 * @param {string} [params.subject]
 * @param {string} [params.semester]
 */
export async function shareToBoard({
  user,
  videoUrl,
  videoId,
  analysis,
  title,
  grade,
  subject,
  semester,
}) {
  if (!user) throw new Error("로그인이 필요합니다");
  // 사용자 프로필 정보
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};
  await addDoc(collection(db, "sharedVideos"), {
    videoId,
    videoUrl,
    title: title || "",
    description: analysis.summary || "",
    tags: [],
    teacherNote: "",
    grade: grade || "",
    subject: subject || "",
    semester: semester || "",
    authorId: user.uid,
    authorName: userData?.profile?.displayName || user.displayName || "",
    likes: 0,
    likedBy: [],
    createdAt: Timestamp.now(),
  });
}
