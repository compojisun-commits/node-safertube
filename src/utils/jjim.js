import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 문서 크기를 대략적으로 계산 (bytes)
 * Firestore의 실제 크기 계산 방식을 근사
 */
function estimateDocumentSize(data) {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * 고유 ID 생성
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 찜 보따리(jjimVideos)에 영상 저장
 * 새로운 데이터 구조: userUid 문서에 videos 배열로 관리
 * 문서 크기가 0.8MB 이상이면 새 문서(userUid_1, userUid_2, ...)를 생성
 *
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoUrl
 * @param {string} params.videoId
 * @param {object} params.analysis - 분석 결과 전체
 * @param {string} [params.title] - 영상 제목
 * @param {string} [params.folderId] - 폴더 ID (null이면 루트)
 * @param {string} [params.memo] - 사용자 메모
 * @param {Array<string>} [params.tags] - 태그 배열
 */
export async function addToJjim({ user, videoUrl, videoId, analysis, title, folderId = null, memo = "", tags = [] }) {
  if (!user) throw new Error("로그인이 필요합니다");

  const MAX_SIZE = 800000; // 0.8MB in bytes (여유를 위해 실제보다 약간 작게)
  const videoData = {
    id: generateId(),
    videoId,
    videoUrl,
    title: title || "",
    analysis,
    folderId,
    memo,
    tags,
    isManualAdd: false,
    createdAt: Timestamp.now(),
  };

  // 메인 문서 ID
  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    // 1. 메인 문서 확인
    const mainDoc = await getDoc(mainDocRef);

    if (!mainDoc.exists()) {
      // 메인 문서가 없으면 새로 생성
      await setDoc(mainDocRef, {
        folders: [], // 폴더 배열 초기화
        videos: [videoData],
        add_lists: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log("메인 문서 생성 완료");
      return;
    }

    // 2. 메인 문서가 있으면 크기 확인
    const currentData = mainDoc.data();
    const currentVideos = currentData.videos || [];
    const currentAddLists = currentData.add_lists || [];

    // 새 영상을 추가한 후의 데이터
    const newVideos = [...currentVideos, videoData];
    const testData = {
      videos: newVideos,
      add_lists: currentAddLists,
      createdAt: currentData.createdAt,
      updatedAt: Timestamp.now(),
    };

    const estimatedSize = estimateDocumentSize(testData);
    console.log(`예상 문서 크기: ${estimatedSize} bytes (${(estimatedSize / 1024 / 1024).toFixed(2)} MB)`);

    if (estimatedSize < MAX_SIZE) {
      // 3. 크기가 괜찮으면 메인 문서에 추가
      await updateDoc(mainDocRef, {
        videos: arrayUnion(videoData),
        updatedAt: Timestamp.now(),
      });
      console.log("메인 문서에 영상 추가 완료");
    } else {
      // 4. 크기가 초과하면 새 문서 생성
      const nextListNum = currentAddLists.length > 0
        ? Math.max(...currentAddLists) + 1
        : 1;

      const newDocId = `${user.uid}_${nextListNum}`;
      const newDocRef = doc(db, "jjimVideos", newDocId);

      // 새 문서 생성
      await setDoc(newDocRef, {
        videos: [videoData],
        add_lists: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 메인 문서의 add_lists 업데이트
      await updateDoc(mainDocRef, {
        add_lists: arrayUnion(nextListNum),
        updatedAt: Timestamp.now(),
      });

      console.log(`새 문서 생성 완료: ${newDocId}`);
    }
  } catch (error) {
    console.error("찜하기 오류:", error);
    throw error;
  }
}

/**
 * 특정 영상 삭제
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoId - 삭제할 영상 ID
 */
export async function removeFromJjim({ user, videoId }) {
  if (!user) throw new Error("로그인이 필요합니다");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);
    if (!mainDoc.exists()) {
      throw new Error("찜 목록을 찾을 수 없습니다");
    }

    const currentData = mainDoc.data();
    const currentVideos = currentData.videos || [];
    const currentAddLists = currentData.add_lists || [];

    // 메인 문서에서 해당 영상 찾기
    const filteredVideos = currentVideos.filter(v => v.videoId !== videoId);

    if (filteredVideos.length < currentVideos.length) {
      // 메인 문서에서 찾았으면 삭제
      await updateDoc(mainDocRef, {
        videos: filteredVideos,
        updatedAt: Timestamp.now(),
      });
      console.log("메인 문서에서 영상 삭제 완료");
      return;
    }

    // 메인 문서에 없으면 추가 문서들 확인
    for (const listNum of currentAddLists) {
      const addDocId = `${user.uid}_${listNum}`;
      const addDocRef = doc(db, "jjimVideos", addDocId);
      const addDoc = await getDoc(addDocRef);

      if (addDoc.exists()) {
        const addData = addDoc.data();
        const addVideos = addData.videos || [];
        const filteredAddVideos = addVideos.filter(v => v.videoId !== videoId);

        if (filteredAddVideos.length < addVideos.length) {
          await updateDoc(addDocRef, {
            videos: filteredAddVideos,
            updatedAt: Timestamp.now(),
          });
          console.log(`추가 문서(${addDocId})에서 영상 삭제 완료`);
          return;
        }
      }
    }

    throw new Error("삭제할 영상을 찾을 수 없습니다");
  } catch (error) {
    console.error("영상 삭제 오류:", error);
    throw error;
  }
}

/**
 * 링크를 직접 추가 (분석 없이)
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoUrl - URL (YouTube 또는 일반 URL)
 * @param {string} params.title - 제목
 * @param {string} [params.memo] - 메모
 * @param {string} [params.folderId] - 폴더 ID
 * @param {Array<string>} [params.tags] - 태그 배열
 * @param {string} [params.linkType] - 링크 타입 ('youtube' | 'generic')
 * @param {string} [params.thumbnail] - 썸네일 URL
 */
export async function addLinkDirectly({ user, videoUrl, title, memo = "", folderId = null, tags = [], linkType = "youtube", thumbnail = "", videoId: providedVideoId = null, status = null }) {
  if (!user) throw new Error("로그인이 필요합니다");
  if (!videoUrl) throw new Error("URL은 필수입니다");

  // YouTube URL에서 videoId 추출 (YouTube 타입인 경우만)
  let videoId = providedVideoId;
  if (!videoId && (linkType === 'youtube' || videoUrl.includes('youtube') || videoUrl.includes('youtu.be'))) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }
  }

  // 제목 Fallback: 비어있으면 URL 또는 기본값 사용
  let finalTitle = title;
  if (!finalTitle || finalTitle.trim() === '') {
    if (videoId) {
      finalTitle = 'YouTube 영상';
    } else if (videoUrl.includes('twitter') || videoUrl.includes('x.com')) {
      finalTitle = 'X(Twitter) 게시물';
    } else if (videoUrl.includes('blog.naver')) {
      finalTitle = '네이버 블로그';
    } else {
      finalTitle = videoUrl.length > 50 ? videoUrl.substring(0, 50) + '...' : videoUrl;
    }
  }

  // YouTube인 경우 썸네일 자동 생성
  let finalThumbnail = thumbnail;
  if (!finalThumbnail && videoId) {
    finalThumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  // 일반 URL인 경우 파비콘 사용
  if (!finalThumbnail && linkType === 'generic') {
    try {
      const urlObj = new URL(videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`);
      finalThumbnail = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
    } catch {
      finalThumbnail = '';
    }
  }

  const MAX_SIZE = 800000;
  const videoData = {
    id: generateId(),
    videoId,
    videoUrl,
    title: finalTitle, // Fallback 적용된 제목 사용
    memo,
    folderId,
    tags,
    linkType, // 링크 타입 추가
    thumbnail: finalThumbnail, // 썸네일 URL 추가
    status: status, // 🆕 칸반 보드 섹션 상태
    isManualAdd: true, // 직접 추가된 영상 표시
    analysis: null,
    createdAt: Timestamp.now(),
  };

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);

    if (!mainDoc.exists()) {
      await setDoc(mainDocRef, {
        folders: [],
        videos: [videoData],
        add_lists: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log("메인 문서 생성 완료 (링크 직접 추가)");
      return;
    }

    const currentData = mainDoc.data();
    const currentVideos = currentData.videos || [];
    const currentAddLists = currentData.add_lists || [];

    const newVideos = [...currentVideos, videoData];
    const testData = {
      folders: currentData.folders || [],
      videos: newVideos,
      add_lists: currentAddLists,
      createdAt: currentData.createdAt,
      updatedAt: Timestamp.now(),
    };

    const estimatedSize = estimateDocumentSize(testData);

    if (estimatedSize < MAX_SIZE) {
      await updateDoc(mainDocRef, {
        videos: arrayUnion(videoData),
        updatedAt: Timestamp.now(),
      });
      console.log("링크 직접 추가 완료");
    } else {
      const nextListNum = currentAddLists.length > 0
        ? Math.max(...currentAddLists) + 1
        : 1;

      const newDocId = `${user.uid}_${nextListNum}`;
      const newDocRef = doc(db, "jjimVideos", newDocId);

      await setDoc(newDocRef, {
        folders: [],
        videos: [videoData],
        add_lists: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await updateDoc(mainDocRef, {
        add_lists: arrayUnion(nextListNum),
        updatedAt: Timestamp.now(),
      });

      console.log(`새 문서에 링크 추가 완료: ${newDocId}`);
    }
  } catch (error) {
    console.error("링크 직접 추가 오류:", error);
    throw error;
  }
}

/**
 * 폴더 생성
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.name - 폴더 이름
 * @param {string|null} [params.parentId] - 부모 폴더 ID (null이면 루트)
 * @param {string} [params.color] - 폴더 색상
 */
export async function createFolder({ user, name, parentId = null, color = "blue" }) {
  if (!user) throw new Error("로그인이 필요합니다");
  if (!name || !name.trim()) throw new Error("폴더 이름을 입력해주세요");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);

    const newFolder = {
      id: generateId(),
      name: name.trim(),
      parentId, // 부모 폴더 ID 추가
      color,
      createdAt: Timestamp.now(),
    };

    if (!mainDoc.exists()) {
      await setDoc(mainDocRef, {
        folders: [newFolder],
        videos: [],
        add_lists: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(mainDocRef, {
        folders: arrayUnion(newFolder),
        updatedAt: Timestamp.now(),
      });
    }

    console.log("폴더 생성 완료:", newFolder);
    return newFolder;
  } catch (error) {
    console.error("폴더 생성 오류:", error);
    throw error;
  }
}

/**
 * 폴더 이름 변경
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.folderId - 폴더 ID
 * @param {string} params.newName - 새 이름
 */
export async function renameFolder({ user, folderId, newName }) {
  if (!user) throw new Error("로그인이 필요합니다");
  if (!newName || !newName.trim()) throw new Error("폴더 이름을 입력해주세요");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);
    if (!mainDoc.exists()) throw new Error("문서를 찾을 수 없습니다");

    const currentData = mainDoc.data();
    const folders = currentData.folders || [];

    const updatedFolders = folders.map(folder =>
      folder.id === folderId
        ? { ...folder, name: newName.trim() }
        : folder
    );

    await updateDoc(mainDocRef, {
      folders: updatedFolders,
      updatedAt: Timestamp.now(),
    });

    console.log("폴더 이름 변경 완료");
  } catch (error) {
    console.error("폴더 이름 변경 오류:", error);
    throw error;
  }
}

/**
 * 폴더 삭제
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.folderId - 폴더 ID
 * @param {boolean} [params.moveToRoot] - true면 폴더 내 영상을 루트로 이동, false면 영상도 삭제
 */
export async function deleteFolder({ user, folderId, moveToRoot = true }) {
  if (!user) throw new Error("로그인이 필요합니다");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);
    if (!mainDoc.exists()) throw new Error("문서를 찾을 수 없습니다");

    const currentData = mainDoc.data();
    const folders = currentData.folders || [];
    const videos = currentData.videos || [];

    // 폴더 제거
    const updatedFolders = folders.filter(folder => folder.id !== folderId);

    // 영상 처리
    const updatedVideos = moveToRoot
      ? videos.map(video =>
          video.folderId === folderId
            ? { ...video, folderId: null }
            : video
        )
      : videos.filter(video => video.folderId !== folderId);

    await updateDoc(mainDocRef, {
      folders: updatedFolders,
      videos: updatedVideos,
      updatedAt: Timestamp.now(),
    });

    console.log("폴더 삭제 완료");
  } catch (error) {
    console.error("폴더 삭제 오류:", error);
    throw error;
  }
}

/**
 * 영상을 폴더로 이동
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoId - 영상 ID
 * @param {string|null} params.folderId - 대상 폴더 ID (null이면 루트로 이동)
 */
export async function moveVideoToFolder({ user, videoId, folderId }) {
  if (!user) throw new Error("로그인이 필요합니다");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);
    if (!mainDoc.exists()) throw new Error("문서를 찾을 수 없습니다");

    const currentData = mainDoc.data();
    const videos = currentData.videos || [];

    const updatedVideos = videos.map(video =>
      video.id === videoId
        ? { ...video, folderId }
        : video
    );

    await updateDoc(mainDocRef, {
      videos: updatedVideos,
      updatedAt: Timestamp.now(),
    });

    console.log("영상 이동 완료");
  } catch (error) {
    console.error("영상 이동 오류:", error);
    throw error;
  }
}

/**
 * 영상 삭제 (내부 ID 기반)
 * @param {object} params
 * @param {object} params.user - firebase user
 * @param {string} params.videoId - 영상의 내부 ID
 */
export async function deleteVideo({ user, videoId }) {
  if (!user) throw new Error("로그인이 필요합니다");

  const mainDocId = user.uid;
  const mainDocRef = doc(db, "jjimVideos", mainDocId);

  try {
    const mainDoc = await getDoc(mainDocRef);
    if (!mainDoc.exists()) {
      throw new Error("찜 목록을 찾을 수 없습니다");
    }

    const currentData = mainDoc.data();
    const currentVideos = currentData.videos || [];
    const currentAddLists = currentData.add_lists || [];

    // 메인 문서에서 해당 영상 찾기 (내부 id로 필터링)
    const filteredVideos = currentVideos.filter(v => v.id !== videoId);

    if (filteredVideos.length < currentVideos.length) {
      // 메인 문서에서 찾았으면 삭제
      await updateDoc(mainDocRef, {
        videos: filteredVideos,
        updatedAt: Timestamp.now(),
      });
      console.log("메인 문서에서 영상 삭제 완료");
      return;
    }

    // 메인 문서에 없으면 추가 문서들 확인
    for (const listNum of currentAddLists) {
      const addDocId = `${user.uid}_${listNum}`;
      const addDocRef = doc(db, "jjimVideos", addDocId);
      const addDoc = await getDoc(addDocRef);

      if (addDoc.exists()) {
        const addData = addDoc.data();
        const addVideos = addData.videos || [];
        const filteredAddVideos = addVideos.filter(v => v.id !== videoId);

        if (filteredAddVideos.length < addVideos.length) {
          await updateDoc(addDocRef, {
            videos: filteredAddVideos,
            updatedAt: Timestamp.now(),
          });
          console.log(`추가 문서(${addDocId})에서 영상 삭제 완료`);
          return;
        }
      }
    }

    throw new Error("삭제할 영상을 찾을 수 없습니다");
  } catch (error) {
    console.error("영상 삭제 오류:", error);
    throw error;
  }
}
