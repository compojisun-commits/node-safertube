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

// ============================================
// 폴더 자동 생성을 위한 헬퍼 함수들
// ============================================

/**
 * 과목 코드 매핑 (curriculum -> folderGenerator)
 */
const SUBJECT_CODE_MAP = {
  korean: 'kor',
  math: 'math',
  social: 'soc',
  science: 'sci',
  moral: 'moral',
  practical: 'prac',
  music: 'music',
  art: 'art',
  pe: 'pe',
  english: 'eng',
  integrated: 'int' // 1-2학년 통합교과
};

/**
 * 역방향 과목 코드 매핑 (folderGenerator -> curriculum)
 */
const REVERSE_SUBJECT_CODE_MAP = {
  kor: 'korean',
  math: 'math',
  soc: 'social',
  sci: 'science',
  moral: 'moral',
  prac: 'practical',
  music: 'music',
  art: 'art',
  pe: 'pe',
  eng: 'english',
  int: 'integrated' // 1-2학년 통합교과
};

/**
 * 특정 학년/학기/과목의 단원 목록 가져오기
 * @param {number} grade - 학년 (1-6)
 * @param {number} semester - 학기 (1, 2)
 * @param {string} subjectCode - 과목 코드 (kor, math, soc, sci, etc.)
 * @returns {Array<{id: string, name: string, metadata: object}>} 단원 목록
 */
export const getUnitsForSubject = (grade, semester, subjectCode) => {
  // 과목 폴더 ID 패턴: g{학년}-s{학기}-{과목코드}
  const subjectFolderId = `g${grade}-s${semester}-${subjectCode}`;
  
  // 해당 과목 폴더를 부모로 가지는 모든 폴더 (단원들)
  const units = CurriculumDatabase.hierarchy.filter(item => 
    item.parentId === subjectFolderId && 
    item.type === 'folder' &&
    item.id.includes('-u') // 단원 폴더만 (g4-s1-kor-u1 형태)
  );
  
  // ID 기준으로 정렬 (u0, u1, u2...)
  return units.sort((a, b) => {
    const aNum = parseInt(a.id.split('-u').pop()) || 0;
    const bNum = parseInt(b.id.split('-u').pop()) || 0;
    return aNum - bNum;
  });
};

/**
 * 특정 학년/학기의 모든 과목 폴더 가져오기
 * @param {number} grade - 학년 (1-6)
 * @param {number} semester - 학기 (1, 2)
 * @returns {Array<{id: string, name: string, subjectCode: string, metadata: object}>} 과목 폴더 목록
 */
export const getSubjectsForSemester = (grade, semester) => {
  const semesterFolderId = `g${grade}-s${semester}`;
  
  const subjects = CurriculumDatabase.hierarchy.filter(item =>
    item.parentId === semesterFolderId &&
    item.type === 'folder' &&
    item.metadata?.subject
  );
  
  return subjects.map(subject => ({
    ...subject,
    subjectCode: SUBJECT_CODE_MAP[subject.metadata.subject] || subject.metadata.subject
  }));
};

/**
 * 모든 학년의 curriculum 데이터를 folderGenerator가 사용하기 좋은 형태로 변환
 * @returns {Object} { subjectCode: { grade: { semester: [단원명 배열] } } }
 */
export const getCurriculumBySemester = () => {
  const result = {};
  
  // 모든 hierarchy 항목을 순회
  CurriculumDatabase.hierarchy.forEach(item => {
    // 단원 폴더만 처리 (g4-s1-kor-u1 형태)
    if (!item.id.includes('-u') || item.type !== 'folder') return;
    
    // ID 파싱: g4-s1-kor-u1 -> grade=4, semester=1, subject=kor, unit=1
    const match = item.id.match(/^g(\d)-s(\d)-(\w+)-u(\d+)$/);
    if (!match) return;
    
    const [, gradeStr, semesterStr, subjectCode, unitNum] = match;
    const grade = parseInt(gradeStr);
    const semester = parseInt(semesterStr);
    
    // 결과 객체 초기화
    if (!result[subjectCode]) result[subjectCode] = {};
    if (!result[subjectCode][grade]) result[subjectCode][grade] = {};
    if (!result[subjectCode][grade][semester]) result[subjectCode][grade][semester] = [];
    
    // 단원명에서 번호 제거 (ex: "1. 생각과 느낌 나누기" -> "생각과 느낌 나누기")
    // 하지만 원본 이름을 유지하는 것이 더 좋을 수 있음
    result[subjectCode][grade][semester].push({
      unitNumber: parseInt(unitNum),
      name: item.name,
      id: item.id,
      metadata: item.metadata
    });
  });
  
  // 각 과목/학년/학기별로 단원 번호순 정렬
  Object.keys(result).forEach(subject => {
    Object.keys(result[subject]).forEach(grade => {
      Object.keys(result[subject][grade]).forEach(semester => {
        result[subject][grade][semester].sort((a, b) => a.unitNumber - b.unitNumber);
      });
    });
  });
  
  return result;
};

/**
 * 특정 학년에서 사용 가능한 과목 목록 반환
 * @param {number} grade - 학년 (1-6)
 * @returns {string[]} 과목 코드 배열
 */
export const getAvailableSubjects = (grade) => {
  const availableSubjects = new Set();
  
  CurriculumDatabase.hierarchy.forEach(item => {
    // 과목 폴더 패턴: g{학년}-s{학기}-{과목코드}
    const match = item.id.match(/^g(\d)-s\d-(\w+)$/);
    if (match && item.metadata?.subject) {
      const itemGrade = parseInt(match[1]);
      if (itemGrade === grade) {
        const subjectCode = SUBJECT_CODE_MAP[item.metadata.subject] || match[2];
        availableSubjects.add(subjectCode);
      }
    }
  });
  
  return Array.from(availableSubjects);
};

export default CurriculumDatabase;
