import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 과목별 좋아요 영상 저장
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.subject - 과목명 (미술, 체육 등)
 * @param {string} params.videoId - YouTube 영상 ID
 * @param {string} params.videoUrl - YouTube URL
 * @param {string} params.title - 영상 제목
 * @param {string} params.summary - 간단한 요약
 * @param {number} params.duration - 영상 길이 (초)
 * @param {number} params.safetyScore - 안전도 점수
 */
export async function addLikeSubject({
  user,
  subject,
  videoId,
  videoUrl,
  title,
  summary,
  duration,
  safetyScore,
}) {
  if (!user) throw new Error("로그인이 필요합니다");
  if (!subject) throw new Error("과목 정보가 필요합니다");

  const likeData = {
    videoId,
    videoUrl,
    title,
    summary: summary || "",
    duration: duration || 0,
    safetyScore: safetyScore || 0,
    likedAt: Timestamp.now(),
  };

  // 단순화된 경로: likeSubject/{userId}_{subject}
  const docId = `${user.uid}_${subject}`;
  const subjectDocRef = doc(db, "likeSubject", docId);

  try {
    const subjectDoc = await getDoc(subjectDocRef);

    if (!subjectDoc.exists()) {
      // 문서가 없으면 새로 생성
      await setDoc(subjectDocRef, {
        userId: user.uid,
        subject: subject,
        videos: [likeData],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`${subject} 좋아요 문서 생성 완료`);
    } else {
      // 이미 좋아요한 영상인지 확인
      const currentData = subjectDoc.data();
      const videos = currentData.videos || [];
      const exists = videos.some((v) => v.videoId === videoId);

      if (exists) {
        throw new Error("이미 좋아요한 영상입니다");
      }

      // 좋아요 추가
      await updateDoc(subjectDocRef, {
        videos: arrayUnion(likeData),
        updatedAt: Timestamp.now(),
      });
      console.log(`${subject} 좋아요 추가 완료`);
    }
  } catch (error) {
    console.error("좋아요 저장 오류:", error);
    throw error;
  }
}

/**
 * 과목별 좋아요 영상 제거
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.subject - 과목명
 * @param {string} params.videoId - YouTube 영상 ID
 */
export async function removeLikeSubject({ user, subject, videoId }) {
  if (!user) throw new Error("로그인이 필요합니다");

  // 단순화된 경로: likeSubject/{userId}_{subject}
  const docId = `${user.uid}_${subject}`;
  const subjectDocRef = doc(db, "likeSubject", docId);

  try {
    const subjectDoc = await getDoc(subjectDocRef);
    if (!subjectDoc.exists()) {
      throw new Error("좋아요 목록을 찾을 수 없습니다");
    }

    const currentData = subjectDoc.data();
    const videos = currentData.videos || [];
    const filteredVideos = videos.filter((v) => v.videoId !== videoId);

    await updateDoc(subjectDocRef, {
      videos: filteredVideos,
      updatedAt: Timestamp.now(),
    });

    console.log(`${subject} 좋아요 제거 완료`);
  } catch (error) {
    console.error("좋아요 제거 오류:", error);
    throw error;
  }
}

/**
 * 특정 영상이 좋아요되어 있는지 확인
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.subject - 과목명
 * @param {string} params.videoId - YouTube 영상 ID
 * @returns {Promise<boolean>}
 */
export async function isLikedSubject({ user, subject, videoId }) {
  if (!user) return false;

  // 단순화된 경로: likeSubject/{userId}_{subject}
  const docId = `${user.uid}_${subject}`;
  const subjectDocRef = doc(db, "likeSubject", docId);

  try {
    const subjectDoc = await getDoc(subjectDocRef);
    if (!subjectDoc.exists()) return false;

    const currentData = subjectDoc.data();
    const videos = currentData.videos || [];
    return videos.some((v) => v.videoId === videoId);
  } catch (error) {
    console.error("좋아요 확인 오류:", error);
    return false;
  }
}
