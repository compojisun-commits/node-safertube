/**
 * 사용자 맞춤 폴더 자동 생성 유틸리티
 * 온보딩 완료 시 선택한 학년/과목에 맞는 폴더 트리 생성
 * 
 * ⚠️ 2022 개정 교육과정 데이터는 curriculumDatabase.js에서 가져옴
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUnitsForSubject, getAvailableSubjects } from '../data/curriculumDatabase';

// 과목 정보
const SUBJECT_INFO = {
  kor: { name: '국어', color: '#ef4444' },
  math: { name: '수학', color: '#3b82f6' },
  soc: { name: '사회', color: '#f59e0b' },
  sci: { name: '과학', color: '#10b981' },
  moral: { name: '도덕', color: '#8b5cf6' },
  prac: { name: '실과', color: '#06b6d4' },
  music: { name: '음악', color: '#ec4899' },
  art: { name: '미술', color: '#f97316' },
  pe: { name: '체육', color: '#22c55e' },
  eng: { name: '영어', color: '#6366f1' },
  int: { name: '통합교과', color: '#14b8a6' }, // 1-2학년용 (바른생활/슬기로운생활/즐거운생활)
};

/**
 * 고유 ID 생성
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 사용자 맞춤 폴더 생성
 * 기존 jjimVideos 구조에 맞춰 folders 배열에 추가
 * @param {string} userId - Firebase user ID
 * @param {number[]} grades - 담당 학년 배열
 * @param {string[]} subjects - 담당 과목 ID 배열
 * @param {string} hierarchy - 폴더 계층 구조 ('grade-semester-subject', 'grade-subject-semester', 'grade-subject')
 */
export async function generateUserFolders(userId, grades, subjects, hierarchy = 'grade-semester-subject') {
  console.log('📁 폴더 생성 시작:', { userId, grades, subjects, hierarchy });

  // jjimVideos/{userId} 문서 참조
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  
  try {
    // 1. 기존 문서 가져오기
    const jjimDoc = await getDoc(jjimDocRef);
    const existingFolders = jjimDoc.exists() ? (jjimDoc.data().folders || []) : [];
    const existingFolderIds = new Set(existingFolders.map(f => f.id));
    
    // 2. 새로 추가할 폴더들
    const newFolders = [];
    let folderCount = 0;
    const now = Timestamp.now();

    // 3. 계층 구조에 따라 폴더 생성
    for (const grade of grades) {
      const gradeId = `g${grade}`;
      
      // 학년 폴더가 없으면 추가
      if (!existingFolderIds.has(gradeId)) {
        newFolders.push({
          id: gradeId,
          name: `${grade}학년`,
          parentId: null,
          type: 'folder',
          protected: true,
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(gradeId);
        folderCount++;
      }

      // 계층 구조별 폴더 생성
      if (hierarchy === 'grade-semester-subject') {
        // 학년 > 학기 > 과목 > 단원
        folderCount += createGradeSemesterSubjectFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      } else if (hierarchy === 'grade-subject-semester') {
        // 학년 > 과목 > 학기 > 단원
        folderCount += createGradeSubjectSemesterFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      } else {
        // 학년 > 과목 > 단원 (학기 없음)
        folderCount += createGradeSubjectFolders(
          grade, gradeId, subjects, newFolders, existingFolderIds, now
        );
      }
    }

    // 6. 기타 폴더 생성
    if (!existingFolderIds.has('etc')) {
      newFolders.push({
        id: 'etc',
        name: '📦 기타',
        parentId: null,
        type: 'folder',
        protected: true,
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add('etc');
      folderCount++;
    }

    // 미분류 폴더
    if (!existingFolderIds.has('unclassified')) {
      newFolders.push({
        id: 'unclassified',
        name: '📥 미분류',
        parentId: 'etc',
        type: 'folder',
        protected: true,
        createdAt: now,
        updatedAt: now
      });
      folderCount++;
    }

    // 7. 문서 업데이트
    if (newFolders.length > 0) {
      const allFolders = [...existingFolders, ...newFolders];
      
      if (jjimDoc.exists()) {
        await setDoc(jjimDocRef, {
          folders: allFolders,
          updatedAt: now
        }, { merge: true });
      } else {
        await setDoc(jjimDocRef, {
          folders: allFolders,
          videos: [],
          add_lists: [],
          createdAt: now,
          updatedAt: now
        });
      }
      
      console.log(`✅ 폴더 생성 완료! 새로 추가된 폴더: ${newFolders.length}개`);
    } else {
      console.log('ℹ️ 추가할 새 폴더 없음 (이미 존재)');
    }

    return folderCount;
  } catch (error) {
    console.error('❌ 폴더 생성 오류:', error);
    throw error;
  }
}

/**
 * 학년 > 학기 > 과목 > 단원 구조로 폴더 생성
 * ✨ 2022 개정 교육과정 데이터 사용
 */
function createGradeSemesterSubjectFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;
  const semesters = [1, 2];

  for (const semester of semesters) {
    const semesterId = `${gradeId}-s${semester}`;
    
    // 학기 폴더 생성
    if (!existingFolderIds.has(semesterId)) {
      newFolders.push({
        id: semesterId,
        name: `${semester}학기`,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        metadata: { grade, semester },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(semesterId);
      count++;
    }

    // 과목 폴더 생성
    for (const subjectId of subjects) {
      const subjectInfo = SUBJECT_INFO[subjectId];
      if (!subjectInfo) continue;

      // curriculumDatabase에서 해당 학년/학기/과목의 단원 가져오기
      const curriculumUnits = getUnitsForSubject(grade, semester, subjectId);
      
      // 해당 학년에 해당 과목이 없으면 스킵 (사회/과학은 3학년부터, 실과는 5학년부터)
      if (curriculumUnits.length === 0) {
        if (['soc', 'sci'].includes(subjectId) && grade < 3) continue;
        if (subjectId === 'prac' && grade < 5) continue;
      }

      const subjectFolderId = `${semesterId}-${subjectId}`;
      
      if (!existingFolderIds.has(subjectFolderId)) {
        newFolders.push({
          id: subjectFolderId,
          name: subjectInfo.name,
          parentId: semesterId,
          type: 'folder',
          protected: true,
          color: subjectInfo.color,
          metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name },
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(subjectFolderId);
        count++;
      }

      // 단원 폴더 생성 (curriculumDatabase의 상세 데이터 사용)
      if (curriculumUnits && curriculumUnits.length > 0) {
        for (const unit of curriculumUnits) {
          // 원본 ID 사용 (g4-s1-kor-u1 형태)
          const unitFolderId = unit.id;

          if (!existingFolderIds.has(unitFolderId)) {
            newFolders.push({
              id: unitFolderId,
              name: unit.name, // 원본 단원명 그대로 사용 (예: "1. 생각과 느낌을 나누어요")
              parentId: subjectFolderId,
              type: 'folder',
              protected: false,
              metadata: { 
                grade, 
                semester, 
                subject: subjectId, 
                subjectName: subjectInfo.name, 
                ...unit.metadata // 원본 키워드 등 포함
              },
              createdAt: now,
              updatedAt: now
            });
            existingFolderIds.add(unitFolderId);
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * 학년 > 과목 > 학기 > 단원 구조로 폴더 생성
 * ✨ 2022 개정 교육과정 데이터 사용
 */
function createGradeSubjectSemesterFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;

  for (const subjectId of subjects) {
    const subjectInfo = SUBJECT_INFO[subjectId];
    if (!subjectInfo) continue;

    // 해당 학년에 해당 과목이 있는지 확인 (1학기 또는 2학기에 단원이 있는지)
    const hasUnits = getUnitsForSubject(grade, 1, subjectId).length > 0 || 
                     getUnitsForSubject(grade, 2, subjectId).length > 0;
    
    if (!hasUnits) {
      if (['soc', 'sci'].includes(subjectId) && grade < 3) continue;
      if (subjectId === 'prac' && grade < 5) continue;
    }

    const subjectFolderId = `${gradeId}-${subjectId}`;
    
    // 과목 폴더 생성
    if (!existingFolderIds.has(subjectFolderId)) {
      newFolders.push({
        id: subjectFolderId,
        name: subjectInfo.name,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        color: subjectInfo.color,
        metadata: { grade, subject: subjectId, subjectName: subjectInfo.name },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(subjectFolderId);
      count++;
    }

    // 학기별 폴더 생성
    for (const semester of [1, 2]) {
      const semesterId = `${subjectFolderId}-s${semester}`;
      const curriculumUnits = getUnitsForSubject(grade, semester, subjectId);
      
      if (!existingFolderIds.has(semesterId)) {
        newFolders.push({
          id: semesterId,
          name: `${semester}학기`,
          parentId: subjectFolderId,
          type: 'folder',
          protected: true,
          metadata: { grade, semester, subject: subjectId, subjectName: subjectInfo.name },
          createdAt: now,
          updatedAt: now
        });
        existingFolderIds.add(semesterId);
        count++;
      }

      // 단원 폴더 생성 (curriculumDatabase의 상세 데이터 사용)
      if (curriculumUnits && curriculumUnits.length > 0) {
        for (const unit of curriculumUnits) {
          // 이 구조에서는 학기가 과목 아래이므로 ID 재구성 필요
          const unitFolderId = `${semesterId}-u${unit.id.split('-u').pop()}`;

          if (!existingFolderIds.has(unitFolderId)) {
            newFolders.push({
              id: unitFolderId,
              name: unit.name,
              parentId: semesterId,
              type: 'folder',
              protected: false,
              metadata: { 
                grade, 
                semester, 
                subject: subjectId, 
                subjectName: subjectInfo.name, 
                ...unit.metadata
              },
              createdAt: now,
              updatedAt: now
            });
            existingFolderIds.add(unitFolderId);
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * 학년 > 과목 > 단원 구조로 폴더 생성 (학기 없음)
 * ✨ 2022 개정 교육과정 데이터 사용 - 양 학기 단원을 합침
 */
function createGradeSubjectFolders(grade, gradeId, subjects, newFolders, existingFolderIds, now) {
  let count = 0;

  for (const subjectId of subjects) {
    const subjectInfo = SUBJECT_INFO[subjectId];
    if (!subjectInfo) continue;

    // 1학기 + 2학기 단원 합치기
    const units1 = getUnitsForSubject(grade, 1, subjectId);
    const units2 = getUnitsForSubject(grade, 2, subjectId);
    const allUnits = [...units1, ...units2];
    
    if (allUnits.length === 0) {
      if (['soc', 'sci'].includes(subjectId) && grade < 3) continue;
      if (subjectId === 'prac' && grade < 5) continue;
    }

    const subjectFolderId = `${gradeId}-${subjectId}`;
    
    // 과목 폴더 생성
    if (!existingFolderIds.has(subjectFolderId)) {
      newFolders.push({
        id: subjectFolderId,
        name: subjectInfo.name,
        parentId: gradeId,
        type: 'folder',
        protected: true,
        color: subjectInfo.color,
        metadata: { grade, subject: subjectId, subjectName: subjectInfo.name },
        createdAt: now,
        updatedAt: now
      });
      existingFolderIds.add(subjectFolderId);
      count++;
    }

    // 단원 폴더 생성 (모든 학기 단원 합침, 순번 재부여)
    if (allUnits && allUnits.length > 0) {
      for (let i = 0; i < allUnits.length; i++) {
        const unit = allUnits[i];
        const unitFolderId = `${subjectFolderId}-u${i + 1}`;

        if (!existingFolderIds.has(unitFolderId)) {
          newFolders.push({
            id: unitFolderId,
            name: unit.name, // 원본 단원명 유지
            parentId: subjectFolderId,
            type: 'folder',
            protected: false,
            metadata: { 
              grade, 
              subject: subjectId, 
              subjectName: subjectInfo.name, 
              ...unit.metadata
            },
            createdAt: now,
            updatedAt: now
          });
          existingFolderIds.add(unitFolderId);
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * 사용자의 기존 폴더 가져오기
 */
export async function getUserFolders(userId) {
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  const jjimDoc = await getDoc(jjimDocRef);
  
  if (jjimDoc.exists()) {
    return jjimDoc.data().folders || [];
  }
  return [];
}

/**
 * 폴더 존재 여부 확인
 */
export async function hasFolders(userId) {
  const jjimDocRef = doc(db, 'jjimVideos', userId);
  const jjimDoc = await getDoc(jjimDocRef);
  
  if (jjimDoc.exists()) {
    const folders = jjimDoc.data().folders || [];
    return folders.length > 0;
  }
  return false;
}

