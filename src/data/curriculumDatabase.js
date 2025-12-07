/**
 * 초등학교 교육과정 연간 지도 계획 데이터베이스
 * AI 자동 분류를 위한 계층 구조
 *
 * ID 규칙:
 * - 학년: g1, g2, g3, g4, g5, g6
 * - 학기: g1-s1 (1학년 1학기), g1-s2 (1학년 2학기)
 * - 과목: kor(국어), math(수학), soc(사회), sci(과학), moral(도덕), eng(영어), int(통합)
 * - 단원: g1-s1-kor-u1 (1단원), g1-s1-kor-u1-sub1 (소단원)
 */

import { grade1Curriculum } from './curriculum/grade1.js';
import { grade2Curriculum } from './curriculum/grade2.js';
import { grade3Curriculum } from './curriculum/grade3.js';
import { grade4Curriculum } from './curriculum/grade4.js';
import { grade5Curriculum } from './curriculum/grade5.js';
import { grade6Curriculum } from './curriculum/grade6.js';

// 기본 폴더 구조
const baseStructure = [
  // ROOT
  { id: 'root', parentId: null, type: 'folder', name: '찜보따리', protected: true },

  // 학년별 폴더
  { id: 'g1', parentId: 'root', type: 'folder', name: '1학년', protected: true },
  { id: 'g2', parentId: 'root', type: 'folder', name: '2학년', protected: true },
  { id: 'g3', parentId: 'root', type: 'folder', name: '3학년', protected: true },
  { id: 'g4', parentId: 'root', type: 'folder', name: '4학년', protected: true },
  { id: 'g5', parentId: 'root', type: 'folder', name: '5학년', protected: true },
  { id: 'g6', parentId: 'root', type: 'folder', name: '6학년', protected: true },
  { id: 'etc', parentId: 'root', type: 'folder', name: '📦 기타', protected: true },

  // 학기 폴더
  { id: 'g1-s1', parentId: 'g1', type: 'folder', name: '1학기', protected: true },
  { id: 'g1-s2', parentId: 'g1', type: 'folder', name: '2학기', protected: true },
  { id: 'g2-s1', parentId: 'g2', type: 'folder', name: '1학기', protected: true },
  { id: 'g2-s2', parentId: 'g2', type: 'folder', name: '2학기', protected: true },
  { id: 'g3-s1', parentId: 'g3', type: 'folder', name: '1학기', protected: true },
  { id: 'g3-s2', parentId: 'g3', type: 'folder', name: '2학기', protected: true },
  { id: 'g4-s1', parentId: 'g4', type: 'folder', name: '1학기', protected: true },
  { id: 'g4-s2', parentId: 'g4', type: 'folder', name: '2학기', protected: true },
  { id: 'g5-s1', parentId: 'g5', type: 'folder', name: '1학기', protected: true },
  { id: 'g5-s2', parentId: 'g5', type: 'folder', name: '2학기', protected: true },
  { id: 'g6-s1', parentId: 'g6', type: 'folder', name: '1학기', protected: true },
  { id: 'g6-s2', parentId: 'g6', type: 'folder', name: '2학기', protected: true },

  // 기타 폴더
  { id: 'etc-unclassified', parentId: 'etc', type: 'folder', name: '📥 미분류', protected: true },
];

// 모든 커리큘럼 데이터 합치기
export const CurriculumDatabase = {
  hierarchy: [
    ...baseStructure,
    ...grade1Curriculum,
    ...grade2Curriculum,
    ...grade3Curriculum,
    ...grade4Curriculum,
    ...grade5Curriculum,
    ...grade6Curriculum,
  ],
};

// ============================================
// 유틸리티 함수들
// ============================================

export const getFolderById = (folderId) => {
  return CurriculumDatabase.hierarchy.find((f) => f.id === folderId);
};

export const getChildFolders = (parentId) => {
  return CurriculumDatabase.hierarchy.filter((f) => f.parentId === parentId && f.type === 'folder');
};

export const findFoldersByKeywords = (keywords) => {
  const results = [];

  CurriculumDatabase.hierarchy.forEach((folder) => {
    if (folder.metadata?.keywords) {
      const matchCount = keywords.filter((kw) =>
        folder.metadata.keywords.some(
          (fkw) =>
            fkw.toLowerCase().includes(kw.toLowerCase()) ||
            kw.toLowerCase().includes(fkw.toLowerCase()),
        ),
      ).length;

      if (matchCount > 0) {
        results.push({
          folder,
          matchCount,
          matchedKeywords: keywords.filter((kw) =>
            folder.metadata.keywords.some((fkw) => fkw.toLowerCase().includes(kw.toLowerCase())),
          ),
        });
      }
    }
  });

  return results.sort((a, b) => b.matchCount - a.matchCount);
};

export const findFoldersByStandard = (text) => {
  const results = [];

  CurriculumDatabase.hierarchy.forEach((folder) => {
    if (folder.metadata?.achievementStandards) {
      const matched = folder.metadata.achievementStandards.some(
        (std) =>
          text.toLowerCase().includes(std.toLowerCase()) || std.toLowerCase().includes(text.toLowerCase()),
      );

      if (matched) {
        results.push(folder);
      }
    }
  });

  return results;
};

export const getFolderPath = (folderId) => {
  const path = [];
  let currentId = folderId;
  let safety = 0;

  while (currentId && safety < 10) {
    const folder = getFolderById(currentId);
    if (folder) {
      path.unshift(folder.name);
      currentId = folder.parentId;
    } else {
      break;
    }
    safety++;
  }

  return path.join(' > ');
};

export default CurriculumDatabase;
