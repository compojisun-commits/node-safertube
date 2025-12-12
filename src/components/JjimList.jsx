import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import {
  addLinkDirectly,
  createFolder,
  renameFolder,
  deleteFolder,
  moveVideoToFolder,
  deleteVideo
} from '../utils/jjim';
import { classifyVideo, getClassificationSummary } from '../utils/aiClassifier';
import { smartClassify, smartClassifyHybrid, extractNounKeywords } from '../utils/smartClassifier';
import { analyzeVideo } from '../utils/videoAnalysis';
import AnalysisResult from './AnalysisResult';
import { extractVideoId } from '../utils/transcript';
import { ensureMetadata, buildDynamicTree } from '../utils/jjimMetadata';
import CascadingPathSelector from './CascadingPathSelector';
import KanbanBoard from './KanbanBoard';
import '../styles/cascading-path.css';
import '../styles/auto-organize-v2.css';
import '../styles/kanban.css';

// ==========================================
// [아이콘 컴포넌트들]
// ==========================================
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconFolder = ({ className = "" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFolderOpen = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="M2 10l20 0"/>
  </svg>
);

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconKanban = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="16" y="4" width="4" height="14" rx="1"/>
  </svg>
);

const IconWand = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconMove = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="m9 14 3-3 3 3"/><path d="M12 11v6"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconShieldCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconShieldAlert = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconLoader = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconFolderPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

const IconFileVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><polygon points="10 13 10 17 14 15 10 13"/>
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconSparkles = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

// ==========================================
// [안전 배지 컴포넌트]
// ==========================================
const SafetyBadge = ({ score }) => {
  if (score >= 95) {
    return (
      <div className="jjim-safety-badge safe">
        <IconShieldCheck /> 안전
      </div>
    );
  }
  if (score >= 70) {
    return (
      <div className="jjim-safety-badge caution">
        <IconAlertTriangle /> 주의
      </div>
    );
  }
  return (
    <div className="jjim-safety-badge danger">
      <IconShieldAlert /> 위험
    </div>
  );
};

// ==========================================
// [체크박스 컴포넌트]
// ==========================================
const Checkbox = ({ checked, onChange }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`jjim-checkbox ${checked ? 'checked' : ''}`}
  >
    {checked && <IconCheck />}
  </div>
);

// ==========================================
// [AI 자동 정리 모달 - 브레드크럼 스타일]
// ==========================================
export const AutoOrganizeModal = ({ videos, folders, onClose, onApply, user, scanTargets = null }) => {
  const [status, setStatus] = useState('scanning');
  const [proposals, setProposals] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null); // 펼쳐진 아이템 인덱스
  
  // 폴더 ID로 전체 경로 가져오기 (배열로)
  const getPathArray = (folderId) => {
    if (!folderId) return [{ id: 'root', name: '내 찜보따리', parentId: null }];
    
    const path = [];
    let currentId = folderId;
    let safe = 0;
    
    while (currentId && safe < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else break;
      safe++;
    }
    
    path.unshift({ id: 'root', name: '내 찜보따리', parentId: null });
    return path;
  };
  
  // 경로 문자열로 변환
  const getFullPath = (folderId) => {
    return getPathArray(folderId).map(f => f.name).join(' > ');
  };

  // 🆕 AI 추천 경로에서 상위 폴더 ID와 새 폴더 이름 추출
  const matchPathToFolders = (pathString) => {
    if (!pathString) return { parentId: null, newFolderName: '새 폴더' };
    
    const pathSegments = pathString
      .split('/')
      .filter(p => p && p !== '내 찜보따리' && p !== '찜보따리')
      .map(p => p.trim());
    
    if (pathSegments.length === 0) return { parentId: null, newFolderName: '새 폴더' };
    
    let currentParentId = null;
    let lastMatchedIndex = -1;
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i].toLowerCase();
      const children = currentParentId === null
        ? folders.filter(f => !f.parentId || f.parentId === 'root')
        : folders.filter(f => f.parentId === currentParentId);
      
      const matchedFolder = children.find(f => 
        f.name.toLowerCase() === segment ||
        f.name.toLowerCase().includes(segment) ||
        segment.includes(f.name.toLowerCase())
      );
      
      if (matchedFolder) {
        currentParentId = matchedFolder.id;
        lastMatchedIndex = i;
      } else {
        break;
      }
    }
    
    // 매칭되지 않은 나머지 경로 (새 폴더 이름)
    const unmatchedSegments = pathSegments.slice(lastMatchedIndex + 1);
    const newFolderName = unmatchedSegments.length > 0 
      ? unmatchedSegments[unmatchedSegments.length - 1] 
      : pathSegments[pathSegments.length - 1];
    
    return {
      parentId: currentParentId,
      newFolderName: newFolderName || '새 폴더',
      fullMatch: unmatchedSegments.length === 0 && lastMatchedIndex === pathSegments.length - 1,
    };
  };

  useEffect(() => {
    const scan = async () => {
      const targetVideos = (scanTargets && scanTargets.length > 0)
        ? scanTargets
        : videos.filter(v => !v.folderId);
      const moves = [];
      
      // 🤖 AI 분류 사용 (비동기 처리)
      for (const video of targetVideos) {
        const videoInfo = {
          title: video.title || '',
          description: video.memo || '',
          tags: video.tags || []
        };
        
        console.log('🔍 하이브리드 분류 중:', video.title);
        
        // 🎯 AI + 규칙 하이브리드 분류 (AI 우선)
        let smartResult;
        try {
          smartResult = await smartClassifyHybrid(videoInfo, folders, {
            grade: '6학년', // TODO: 사용자 설정에서 가져오기
            subject: '',
            useAi: true,
          });
        } catch (error) {
          console.warn('분류 실패, 규칙 기반으로 폴백:', error);
          smartResult = smartClassify(videoInfo, folders);
        }
        
        const topRec = smartResult.recommendations?.[0];
        
        if (!topRec) {
          const fallbackKeywords = extractNounKeywords(video.title || '미분류', 3);
          moves.push({
            type: 'create',
            videoId: video.id,
            videoTitle: video.title,
            targetId: 'new_folder',
            targetName: fallbackKeywords[0] || '기타 자료',
            newFolderParentId: null,
            confidence: 0,
            matchedKeywords: fallbackKeywords,
            isAmbiguous: true,
            checked: true,
            recommendations: [],
          });
          continue;
        }

        // 🆕 AI 추천 경로를 기존 폴더와 매칭
        const pathMatch = matchPathToFolders(topRec.path);
        const isExisting = pathMatch.fullMatch || (!topRec.isNewFolder && topRec.folderId);
        
        // 기존 폴더와 완전 매칭되면 해당 폴더로 이동
        let targetId = 'new_folder';
        let targetName = pathMatch.newFolderName;
        let newFolderParentId = pathMatch.parentId;
        
        if (isExisting && pathMatch.parentId) {
          targetId = pathMatch.parentId;
          targetName = folders.find(f => f.id === pathMatch.parentId)?.name || targetName;
          newFolderParentId = null;
        } else if (topRec.folderId) {
          targetId = topRec.folderId;
          targetName = topRec.folderName || targetName;
          newFolderParentId = null;
        }
        
        console.log('📁 경로 매칭 결과:', {
          추천경로: topRec.path,
          매칭된상위폴더: pathMatch.parentId,
          새폴더이름: pathMatch.newFolderName,
          완전매칭: pathMatch.fullMatch,
        });
        
        moves.push({
          type: isExisting ? 'move' : 'create',
          videoId: video.id,
          videoTitle: video.title,
          targetId: targetId,
          targetName: targetName,
          newFolderParentId: newFolderParentId, // 🆕 상위 폴더 ID 자동 설정
          confidence: smartResult.confidenceScore,
          curriculumPath: topRec.path,
          matchedKeywords: smartResult.matchingKeywords,
          reason: topRec.reason,
          isCriticalMatch: topRec.score >= 50,
          isSemanticOverride: false,
          isEntityOverride: false,
          isAmbiguous: smartResult.confidenceScore < 50,
          isAiClassified: smartResult.isAiClassified || false,
          candidates: (smartResult.recommendations || []).map((rec, idx) => ({
            name: rec.folderName || rec.path?.split('/').pop() || '폴더',
            path: rec.path,
            score: rec.score,
            matchedKeywords: rec.keywords,
            reason: rec.reason,
            isNewFolder: rec.isNewFolder,
            rank: idx + 1,
            folderId: rec.folderId,
          })),
          checked: true,
          recommendations: smartResult.recommendations,
        });
      }
      
      if (moves.length === 0) {
        setStatus('empty');
      } else {
        setProposals(moves);
        setStatus('proposal');
      }
    };
    scan();
  }, [videos, folders, scanTargets]);

  const handleToggle = (index) => {
    const newProposals = [...proposals];
    newProposals[index].checked = !newProposals[index].checked;
    setProposals(newProposals);
  };

  // 폴더 선택 변경 (CascadingPathSelector에서 호출)
  const handleFolderSelect = (index, folderId) => {
    const newProposals = [...proposals];
    if (folderId === null || folderId === 'root') {
      newProposals[index].type = 'create';
      newProposals[index].targetId = 'new_folder';
      newProposals[index].newFolderParentId = null;
    } else {
      newProposals[index].type = 'move';
      newProposals[index].targetId = folderId;
      const folder = folders.find(f => f.id === folderId);
      newProposals[index].targetName = folder?.name || '알 수 없음';
    }
    setProposals(newProposals);
  };

  // 새 폴더 생성
  const handleCreateFolder = async (index, name, parentId) => {
    const newProposals = [...proposals];
    newProposals[index].type = 'create';
    newProposals[index].targetId = 'new_folder';
    newProposals[index].targetName = name;
    newProposals[index].newFolderParentId = parentId;
    setProposals(newProposals);
  };

  // 새 폴더 이름 변경
  const handleChangeNewFolderName = (index, name) => {
    const newProposals = [...proposals];
    newProposals[index].targetName = name;
    setProposals(newProposals);
  };

  // 후보 선택 (v3.0: isNewFolder 플래그 활용)
  const handleSelectCandidate = (proposalIdx, candidate) => {
    const newProposals = [...proposals];
    
    if (candidate.isNewFolder) {
      // 새 폴더 생성
      newProposals[proposalIdx].type = 'create';
      newProposals[proposalIdx].targetId = 'new_folder';
      newProposals[proposalIdx].targetName = candidate.name || candidate.path?.split('/').pop() || '새 폴더';
      newProposals[proposalIdx].curriculumPath = candidate.path;
    } else {
      // 기존 폴더 사용
      const existingFolder = folders.find(f => 
        f.name.toLowerCase() === (candidate.name?.toLowerCase() || '') ||
        f.id === candidate.folderId
      );
      
      if (existingFolder) {
        newProposals[proposalIdx].type = 'move';
        newProposals[proposalIdx].targetId = existingFolder.id;
        newProposals[proposalIdx].targetName = existingFolder.name;
      } else {
        // 폴더를 못 찾으면 새로 생성
        newProposals[proposalIdx].type = 'create';
        newProposals[proposalIdx].targetId = 'new_folder';
        newProposals[proposalIdx].targetName = candidate.name || '새 폴더';
        newProposals[proposalIdx].curriculumPath = candidate.path;
      }
    }
    
    // 선택된 후보의 키워드와 이유로 업데이트
    if (candidate.matchedKeywords) {
      newProposals[proposalIdx].matchedKeywords = candidate.matchedKeywords;
    }
    if (candidate.reason) {
      newProposals[proposalIdx].reason = candidate.reason;
    }
    
    newProposals[proposalIdx].isAmbiguous = false;
    setProposals(newProposals);
  };

  // 매칭 타입에 따른 배지 렌더링
  const renderMatchBadge = (move) => {
    // 🤖 AI 분류 배지 (최우선)
    if (move.isAiClassified) {
      return <span className="aom-badge ai-classified">🤖 AI 분류</span>;
    }
    if (move.isSemanticOverride) {
      return <span className="aom-badge semantic">🚨 강제확정</span>;
    }
    if (move.isEntityOverride) {
      return <span className="aom-badge entity">⚖️ Entity 확정</span>;
    }
    if (move.isCriticalMatch) {
      return <span className="aom-badge critical">🎯 확정</span>;
    }
    if (move.isAmbiguous) {
      return <span className="aom-badge ambiguous">🤔 선택 필요</span>;
    }
    if (move.confidence) {
      const level = move.confidence >= 80 ? 'high' : move.confidence >= 50 ? 'medium' : 'low';
      return <span className={`aom-badge confidence ${level}`}>{move.confidence}%</span>;
    }
    return null;
  };

  return (
    <div className="jjim-modal-overlay">
      <div className="jjim-auto-organize-modal wide">
        {/* 헤더 */}
        <div className="jjim-aom-header">
          <div className="jjim-aom-title">
            <IconWand /> AI 자동 정리
          </div>
          <button onClick={onClose} className="jjim-close-btn">
            <IconX />
          </button>
        </div>
        <p className="jjim-aom-desc">
          AI가 추천한 경로를 확인하고, 원하는 대로 수정하세요.
          <br />
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>각 항목을 클릭하면 경로를 변경할 수 있습니다.</span>
        </p>
        
        {/* 컨텐츠 */}
        <div className="jjim-aom-content">
          {status === 'scanning' ? (
            <div className="jjim-aom-scanning">
              <IconLoader />
              <p>🎓 교육과정 데이터베이스 기반 분석 중...</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                영상 제목과 태그를 학년/과목/단원과 매칭합니다
              </p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="jjim-aom-empty">
              <IconFolderOpen />
              <p>정리할 영상이 없습니다.</p>
            </div>
          ) : (
            <div className="jjim-aom-list-v2">
              {proposals.map((move, idx) => (
                <div 
                  key={idx} 
                  className={`aom-item-v2 ${move.checked ? 'checked' : ''} ${expandedIdx === idx ? 'expanded' : ''}`}
                >
                  {/* 상단: 체크박스 + 영상 제목 + 배지 */}
                  <div className="aom-item-header" onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
                    <div className="aom-item-left">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={move.checked} onChange={() => handleToggle(idx)} />
                      </div>
                      <div className="aom-video-info">
                        <IconFileVideo />
                        <span className="aom-video-title">{move.videoTitle}</span>
                      </div>
                    </div>
                    <div className="aom-item-right">
                      {renderMatchBadge(move)}
                      <span className="aom-expand-icon">
                        {expandedIdx === idx ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 중단: 브레드크럼 경로 표시 */}
                  <div className="aom-path-display">
                    <span className="aom-arrow">→</span>
                    <div className="aom-path-breadcrumb">
                      {move.type === 'create' ? (
                        <>
                          {getPathArray(move.newFolderParentId).map((p, i, arr) => (
                            <span key={p.id} className="aom-crumb">
                              {p.name}
                              {i < arr.length - 1 && <span className="aom-sep">›</span>}
                            </span>
                          ))}
                          <span className="aom-sep">›</span>
                          <span className="aom-crumb new">
                            <IconFolderPlus />
                            {move.targetName}
                          </span>
                        </>
                      ) : (
                        getPathArray(move.targetId).map((p, i, arr) => (
                          <span key={p.id} className={`aom-crumb ${i === arr.length - 1 ? 'active' : ''}`}>
                            {p.name}
                            {i < arr.length - 1 && <span className="aom-sep">›</span>}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* 🔑 키워드 미리보기 (항상 표시) */}
                  {move.matchedKeywords?.length > 0 && expandedIdx !== idx && (
                    <div className="aom-keywords-preview">
                      <span className="aom-keywords-icon">🔑</span>
                      {move.matchedKeywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="aom-keyword-mini">{kw}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* 하단: 펼침 영역 - 경로 수정 */}
                  {expandedIdx === idx && move.checked && (
                    <div className="aom-expanded-content">
                      {/* 키워드 표시 */}
                      {move.matchedKeywords?.length > 0 && (
                        <div className="aom-keywords">
                          <span className="aom-keywords-label">🔑 매칭 키워드:</span>
                          {move.matchedKeywords.map((kw, i) => (
                            <span key={i} className="aom-keyword-tag">{kw}</span>
                          ))}
                        </div>
                      )}
                      
                      {/* 🆕 추천 이유 표시 */}
                      {move.reason && (
                        <div className="aom-reason">
                          <span className="aom-reason-icon">💡</span>
                          <span className="aom-reason-text">{move.reason}</span>
                        </div>
                      )}
                      
                      {/* 후보 선택 (2개 추천 표시) */}
                      {move.candidates?.length > 1 && (
                        <div className="aom-candidates">
                          <div className="aom-candidates-header">
                            🤖 "이 자료, 어디에 넣을까요?"
                          </div>
                          {move.candidates.slice(0, 2).map((c, ci) => (
                            <button
                              key={ci}
                              className={`aom-candidate-btn ${ci === 0 ? 'recommended' : 'alternative'}`}
                              onClick={() => handleSelectCandidate(idx, c)}
                            >
                              <div className="aom-candidate-main">
                                <span className="aom-candidate-rank">{c.rank || ci + 1}순위</span>
                                <span className="aom-candidate-name">{c.name || c.path}</span>
                                {c.isNewFolder && <span className="aom-candidate-new">새 폴더</span>}
                              </div>
                              {c.reason && (
                                <div className="aom-candidate-reason">{c.reason}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* 경로 선택기 */}
                      <div className="aom-path-selector-section">
                        <div className="aom-selector-label">📁 저장 위치 변경:</div>
                        <CascadingPathSelector
                          folders={folders}
                          selectedFolderId={move.type === 'move' ? move.targetId : move.newFolderParentId}
                          curriculumPath={move.curriculumPath}
                          onSelect={(folderId) => handleFolderSelect(idx, folderId)}
                          onCreateFolder={(name, parentId) => handleCreateFolder(idx, name, parentId)}
                          showCreateNew={true}
                        />
                      </div>
                      
                      {/* 새 폴더 이름 입력 */}
                      {move.type === 'create' && (
                        <div className="aom-new-folder-section">
                          <label>새 폴더 이름:</label>
                          <input
                            type="text"
                            value={move.targetName}
                            onChange={(e) => handleChangeNewFolderName(idx, e.target.value)}
                            placeholder="폴더 이름 입력"
                            className="aom-new-folder-input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 푸터 */}
        <div className="jjim-aom-footer">
          <div className="aom-footer-stats">
            {status === 'proposal' && (
              <span>{proposals.filter(p => p.checked).length} / {proposals.length}개 선택됨</span>
            )}
          </div>
          <div className="aom-footer-actions">
            <button onClick={onClose} className="jjim-btn secondary">닫기</button>
            {status === 'proposal' && proposals.length > 0 && (
              <button 
                onClick={() => onApply(proposals.filter(p => p.checked))} 
                className="jjim-btn primary gradient"
                disabled={proposals.filter(p => p.checked).length === 0}
              >
                <IconWand /> {proposals.filter(p => p.checked).length}개 정리하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [메인 찜보따리 컴포넌트]
// ==========================================
export default function JjimList({ onBack }) {
  const { user, loginWithGoogle } = useAuth();
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 뷰 모드: 'list', 'grid', 'board'
  const [viewMode, setViewMode] = useState('list');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [autoOrganizeOpen, setAutoOrganizeOpen] = useState(false);
  const [autoOrganizeTargets, setAutoOrganizeTargets] = useState(null); // 선택 분류용
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisModalData, setAnalysisModalData] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [analyzeLoadingId, setAnalyzeLoadingId] = useState(null);
  const [videoDocMap, setVideoDocMap] = useState({});
  const [expandedMemos, setExpandedMemos] = useState(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // 칸반 보드 컬럼
  const [boardColumns] = useState([
    { id: 'inbox', label: '📥 찜한 영상', color: 'bg-gray-100 text-gray-600' },
    { id: 'reviewing', label: '👀 검토 중', color: 'bg-blue-100 text-blue-700' },
    { id: 'ready', label: '✅ 수업 준비 완료', color: 'bg-green-100 text-green-700' },
  ]);

  useEffect(() => {
    if (!user) {
      handleNotLoggedIn();
    } else {
      loadJjimData();
    }
  }, [user]);

  // URL 파라미터로 자동 분류 모달 열기 (예: /jjim?auto=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('auto') || params.get('autoClassify');
    if (auto === '1') {
      setAutoOrganizeTargets(null); // 루트 미분류 영상 기준
      setAutoOrganizeOpen(true);
    }
  }, []);

  const handleNotLoggedIn = async () => {
    const result = await Swal.fire({
      title: '로그인이 필요합니다',
      text: '찜보따리는 로그인 후 이용할 수 있습니다.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Google 로그인',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error('Login error:', error);
        onBack();
      }
    } else {
      onBack();
    }
    setLoading(false);
  };

  const loadJjimData = async () => {
    setLoading(true);
    try {
      const allFolders = [];
      const allVideos = [];
      const docMap = {};

      const mainDocId = user.uid;
      const mainDocRef = doc(db, 'jjimVideos', mainDocId);
      const mainDoc = await getDoc(mainDocRef);

      if (mainDoc.exists()) {
        const data = mainDoc.data();
        if (data.folders) allFolders.push(...data.folders);
        if (data.videos) {
          allVideos.push(...data.videos);
          data.videos.forEach((v) => { docMap[v.id] = mainDocId; });
        }

        if (data.add_lists && data.add_lists.length > 0) {
          for (const listNum of data.add_lists) {
            const addDocId = `${user.uid}_${listNum}`;
            const addDocRef = doc(db, 'jjimVideos', addDocId);
            const addDoc = await getDoc(addDocRef);
            if (addDoc.exists()) {
              const addData = addDoc.data();
              if (addData.folders) allFolders.push(...addData.folders);
              if (addData.videos) {
                allVideos.push(...addData.videos);
                addData.videos.forEach((v) => { docMap[v.id] = addDocId; });
              }
            }
          }
        }
      }

      // 최신순 정렬
      allVideos.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      const migratedVideos = allVideos.map((v) => attachCachedAnalysis(ensureMetadata(v)));

      setFolders(allFolders);
      setVideos(migratedVideos);
      setVideoDocMap(docMap);
    } catch (error) {
      console.error('Error loading jjim data:', error);
      Swal.fire({
        title: '오류',
        text: '데이터를 불러오는 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // 선택 토글
  const handleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // 🆕 전체 선택/해제
  const handleSelectAll = () => {
    const currentItems = [...filteredFolders, ...filteredVideos];
    const allIds = currentItems.map(item => item.id);
    
    // 모두 선택된 상태면 전체 해제, 아니면 전체 선택
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  // 🆕 개별 삭제
  const handleDeleteSingle = async (item, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const itemName = item.title || item.name || '이 항목';
    const isFolder = !item.videoUrl;
    
    const result = await Swal.fire({
      title: '삭제 확인',
      text: `"${itemName}"을(를) 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });
    
    if (result.isConfirmed) {
      try {
        if (isFolder) {
          await deleteFolder({ user, folderId: item.id, moveToRoot: true });
        } else {
          await deleteVideo({ user, videoId: item.id });
        }
        
        await Swal.fire({
          title: '삭제 완료',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
        });
        
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '삭제 중 오류가 발생했습니다.',
          icon: 'error',
        });
      }
    }
  };

  // 선택 전체 해제
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleMemo = (id, e) => {
    e.stopPropagation();
    setExpandedMemos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isYouTubeUrl = (url = '') => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    return patterns.some((p) => p.test(url));
  };

  const getVideoId = (video) => {
    if (!video) return '';
    const id = video.videoId || extractVideoId(video.videoUrl) || '';
    return (id || '').trim();
  };

  const hasExistingAnalysis = (video) => Boolean(video?.analysis);

  const hydrateAnalysis = (analysis, video) => {
    const vid = getVideoId(video);
    return {
      ...analysis,
      videoId: analysis?.videoId || vid,
      videoUrl: analysis?.videoUrl || video?.videoUrl || (vid ? `https://www.youtube.com/watch?v=${vid}` : ""),
    };
  };

  // 로컬 스토리지에 캐시된 분석 붙이기
  const attachCachedAnalysis = (video) => {
    if (!video) return video;
    if (video.analysis) return video;
    const vid = getVideoId(video);
    if (!vid) return video;
    try {
      const cached = localStorage.getItem(`analysis_result_${vid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...video,
          analysis: hydrateAnalysis(parsed, video),
          safetyScore: parsed?.safetyScore ?? video.safetyScore,
        };
      }
    } catch (e) {
      console.warn('attachCachedAnalysis failed', e);
    }
    return video;
  };

  const handleAnalyzeClick = async (video, e) => {
    e.stopPropagation();
    if (!isYouTubeUrl(video.videoUrl)) return;

    const videoWithCache = attachCachedAnalysis(video);

    if (hasExistingAnalysis(videoWithCache)) {
      setAnalysisModalData(hydrateAnalysis(videoWithCache.analysis, videoWithCache));
      setAnalysisProgress(null);
      setAnalysisModalOpen(true);
      return;
    }

    const videoId = getVideoId(videoWithCache);

    const confirm = await Swal.fire({
      title: '분석을 시작할까요?',
      text: '이 영상에 대한 분석을 진행합니다.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '분석하기',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
    });
    if (!confirm.isConfirmed) return;

    try {
      setAnalyzeLoadingId(video.id);
      const result = await analyzeVideo(video.videoUrl, videoId, 'elementary-5-6', (progress) => {
        setAnalysisProgress(progress);
      });
      const hydrated = hydrateAnalysis(result, videoWithCache);
      // 캐시 저장
      try {
        localStorage.setItem(`analysis_result_${videoId}`, JSON.stringify(hydrated));
      } catch (e) {
        console.warn('failed to cache analysis', e);
      }
      setAnalysisModalData(hydrated);
      setAnalysisModalOpen(true);
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, analysis: hydrated, safetyScore: hydrated?.safetyScore ?? v.safetyScore } : v
        )
      );
    } catch (err) {
      console.error('영상 분석 실패:', err);
      await Swal.fire({
        title: '분석 실패',
        text: err?.message || '영상 분석 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setAnalyzeLoadingId(null);
      setAnalysisProgress(null);
    }
  };

  // 🪄 인라인 AI 분류 (단일 파일 즉시 분류)
  const handleInlineAiClassify = (video, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🪄 [인라인 AI 분류] 시작:', video.title);
    
    // 해당 비디오 1개만 scanTargets로 설정하고 AutoOrganizeModal 열기
    setAutoOrganizeTargets([video]);
    setAutoOrganizeOpen(true);
  };

  // 새 폴더 만들기
  const handleCreateFolder = async () => {
    const { value: folderName } = await Swal.fire({
      title: '새 폴더 만들기',
      input: 'text',
      inputLabel: '폴더 이름',
      inputPlaceholder: '예: 6학년 사회',
      showCancelButton: true,
      confirmButtonText: '만들기',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
      inputValidator: (value) => {
        if (!value) return '폴더 이름을 입력해주세요';
      }
    });

    if (folderName) {
      try {
        await createFolder({ user, name: folderName, parentId: currentFolderId });
        await Swal.fire({
          title: '폴더 생성 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '폴더 생성 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // 선택된 항목 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const result = await Swal.fire({
      title: '삭제 확인',
      text: `${selectedIds.size}개 항목을 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedIds) {
          const video = videos.find(v => v.id === id);
          const folder = folders.find(f => f.id === id);
          
          if (video) {
            await deleteVideo({ user, videoId: id });
          } else if (folder) {
            await deleteFolder({ user, folderId: id, moveToRoot: true });
          }
        }
        
        await Swal.fire({
          title: '삭제 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        
        setSelectedIds(new Set());
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '삭제 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // 선택된 항목 이동
  const handleMoveSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const folderOptions = folders.reduce((acc, folder) => {
      acc[folder.id] = folder.name;
      return acc;
    }, { 'null': '📁 최상위 (루트)' });

    const { value: targetFolderId } = await Swal.fire({
      title: '폴더로 이동',
      input: 'select',
      inputOptions: folderOptions,
      showCancelButton: true,
      confirmButtonText: '이동',
      cancelButtonText: '취소',
      confirmButtonColor: '#3b82f6',
    });

    if (targetFolderId !== undefined) {
      try {
        const folderId = targetFolderId === 'null' ? null : targetFolderId;
        
        for (const id of selectedIds) {
          const video = videos.find(v => v.id === id);
          if (video) {
            await moveVideoToFolder({ user, videoId: id, folderId });
          }
        }
        
        await Swal.fire({
          title: '이동 완료!',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500
        });
        
        setSelectedIds(new Set());
        loadJjimData();
      } catch (error) {
        Swal.fire({
          title: '오류',
          text: error.message || '이동 중 오류가 발생했습니다',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // 영상 상태 변경 (칸반 보드용)
  const handleStatusChange = async (videoId, newStatus) => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      const mainDocRef = doc(db, 'jjimVideos', user.uid);
      const mainDoc = await getDoc(mainDocRef);
      
      if (mainDoc.exists()) {
        const data = mainDoc.data();
        const updatedVideos = (data.videos || []).map(v => 
          v.id === videoId ? { ...v, status: newStatus } : v
        );
        
        await updateDoc(mainDocRef, { videos: updatedVideos });
        loadJjimData();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  // 🆕 칸반 보드에서 영상 추가 (Root에 저장)
  const handleAddVideoToBoard = async ({ url, videoId, status }) => {
    try {
      // YouTube API로 제목 가져오기 (간단 버전)
      let title = '제목 로딩 중...';
      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
        const data = await res.json();
        if (data.items?.[0]?.snippet?.title) {
          title = data.items[0].snippet.title;
        }
      } catch (e) {
        console.warn('제목 가져오기 실패:', e);
      }

      // addLinkDirectly 사용 (jjim.js)
      await addLinkDirectly({
        user,
        videoUrl: url,
        title,
        memo: '',
        tags: [],
        folderId: null, // 🆕 Root에 저장 (미분류)
        status, // 🆕 칸반 상태
      });

      loadJjimData();
    } catch (error) {
      console.error('영상 추가 오류:', error);
      throw error;
    }
  };

  // AI 자동 정리 적용
  const handleApplyAutoOrganize = async (moves) => {
    try {
      for (const move of moves) {
        let targetId = move.targetId;
        
        if (move.type === 'create') {
          // 새 폴더 생성
          const existingFolder = folders.find(f => f.name === move.targetName);
          if (existingFolder) {
            targetId = existingFolder.id;
          } else {
            await createFolder({ user, name: move.targetName, parentId: null });
            await loadJjimData();
            const newFolder = folders.find(f => f.name === move.targetName);
            targetId = newFolder?.id || null;
          }
        }
        
        // 영상 이동
        await moveVideoToFolder({ user, videoId: move.videoId, folderId: targetId });
      }
      
      await Swal.fire({
        title: `${moves.length}개 파일이 정리되었습니다!`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
      
      setAutoOrganizeOpen(false);
      loadJjimData();
    } catch (error) {
      Swal.fire({
        title: '오류',
        text: error.message || '정리 중 오류가 발생했습니다',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // 선택된 영상만 AI 정리 모달 열기
  const handleClassifySelected = () => {
    const selectedVideos = videos.filter(v => selectedIds.has(v.id));
    if (selectedVideos.length === 0) {
      Swal.fire({
        title: '선택된 영상이 없습니다',
        text: '폴더가 아니라 영상만 선택 후 다시 시도해주세요.',
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    setAutoOrganizeTargets(selectedVideos);
    setAutoOrganizeOpen(true);
  };

  // 브레드크럼 생성
  const getBreadcrumbs = () => {
    const path = [{ id: 'root', name: '내 찜보따리' }];
    let tempId = currentFolderId;
    let depth = 0;
    while (tempId && depth < 10) {
      const folder = folders.find(i => i.id === tempId);
      if (folder) {
        path.splice(1, 0, { id: folder.id, name: folder.name });
        tempId = folder.parentId;
      } else break;
      depth++;
    }
    return path;
  };

  // 현재 폴더의 항목들
  const currentFolders = folders.filter(f =>
    (f.parentId === currentFolderId) || (currentFolderId === null && !f.parentId)
  );

  const currentVideos = videos.filter(v => v.folderId === currentFolderId);

  // 검색 필터링
  const filteredFolders = searchQuery.trim()
    ? currentFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentFolders;

  const filteredVideos = searchQuery.trim()
    ? currentVideos.filter(v => 
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : currentVideos;

  const allItems = [...filteredFolders, ...filteredVideos];
  const hasContent = allItems.length > 0;

  // 미분류 영상 수
  const unorganizedCount = videos.filter(v => !v.folderId).length;

  if (loading) {
    return (
      <div className="jjim-loading">
        <div className="jjim-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="jjim-container">
      {/* 🆕 통합 헤더 (더 직관적) */}
      <div className="jjim-header-v2">
        {/* 왼쪽: 타이틀 + 브레드크럼 */}
        <div className="jjim-header-left">
          {currentFolderId ? (
            // 하위 폴더에 있을 때: 뒤로가기 + 폴더명
            <div className="jjim-nav">
              <button 
                className="jjim-back-btn"
                onClick={() => {
                  const parent = folders.find(f => f.id === currentFolderId);
                  setCurrentFolderId(parent?.parentId || null);
                }}
                title="뒤로 가기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <h1 className="jjim-current-folder">
                {folders.find(f => f.id === currentFolderId)?.name || '폴더'}
              </h1>
            </div>
          ) : (
            // 루트일 때: 타이틀
            <h1 className="jjim-title-v2">
              <span className="jjim-title-icon">📚</span>
              내 찜보따리
            </h1>
          )}
        </div>

        {/* 오른쪽: 액션 버튼들 */}
        <div className="jjim-header-right">
          {/* 검색 토글 */}
          <button 
            className={`jjim-icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="검색"
          >
            <IconSearch />
          </button>
          
          {/* 뷰 모드 */}
          <div className="jjim-view-toggle-v2">
            <button
              onClick={() => setViewMode('list')} 
              className={`jjim-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="리스트 보기"
            >
              <IconList />
            </button>
            <button
              onClick={() => setViewMode('grid')} 
              className={`jjim-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="그리드 보기"
            >
              <IconGrid />
            </button>
            <button 
              onClick={() => setViewMode('board')} 
              className={`jjim-view-btn ${viewMode === 'board' ? 'active' : ''}`}
              title="칸반 보드"
            >
              <IconKanban />
            </button>
          </div>

          {/* AI 정리 버튼 (미정리 있을 때만) */}
          {unorganizedCount > 0 && (
            <button
              onClick={() => { setAutoOrganizeTargets(null); setAutoOrganizeOpen(true); }} 
              className="jjim-ai-btn-v2"
            >
              <IconWand /> 
              <span className="jjim-ai-btn-count">{unorganizedCount}</span>
            </button>
          )}

          {/* 새 폴더 */}
          <button onClick={handleCreateFolder} className="jjim-new-btn-v2">
            <IconPlus /> 
            <span className="jjim-new-btn-text">새 폴더</span>
          </button>
        </div>
      </div>

      {/* 검색바 (토글) */}
      {isSearchOpen && (
        <div className="jjim-search-bar-v2">
          <IconSearch />
          <input
            type="text"
            placeholder="제목, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button 
              className="jjim-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <IconX />
            </button>
          )}
        </div>
      )}

      {/* 선택 모드 바 (선택된 게 있을 때만) */}
      {selectedIds.size > 0 && (
        <div className="jjim-selection-bar-v2">
          <div className="jjim-selection-left">
            <button onClick={handleClearSelection} className="jjim-selection-close">
              <IconX />
            </button>
            <span className="jjim-selection-count-v2">
              <strong>{selectedIds.size}</strong>개 선택됨
            </span>
            <button 
              className="jjim-select-all-btn"
              onClick={handleSelectAll}
            >
              {[...filteredFolders, ...filteredVideos].every(item => selectedIds.has(item.id)) 
                ? '전체 해제' 
                : '전체 선택'}
            </button>
          </div>
          <div className="jjim-selection-actions-v2">
            <button onClick={handleClassifySelected} className="jjim-action-btn-v2 ai">
              <IconWand /> AI 정리
            </button>
            <button onClick={handleMoveSelected} className="jjim-action-btn-v2 move">
              <IconMove /> 이동
            </button>
            <button onClick={handleDeleteSelected} className="jjim-action-btn-v2 delete">
              <IconTrash /> 삭제
            </button>
          </div>
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div className="jjim-content" onClick={() => handleClearSelection()}>
      {!hasContent ? (
          <div className="jjim-empty">
            <IconFolderOpen />
            <p>폴더가 비어있습니다</p>
            <button onClick={handleCreateFolder} className="jjim-empty-btn">
              새 폴더 만들기
                      </button>
                    </div>
        ) : viewMode === 'board' ? (
          // 🆕 Global Kanban Board v22.0
          <KanbanBoard 
            videos={videos}
            folders={folders}
            onAnalyze={(video) => handleAnalyzeClick(video, { stopPropagation: () => {}, preventDefault: () => {} })}
            onOpenVideo={(video) => window.open(video.videoUrl, '_blank')}
            onStatusChange={handleStatusChange}
            onAddVideo={handleAddVideoToBoard}
            onAiOrganize={(targets) => {
              if (targets) {
                setAutoOrganizeTargets(targets);
              } else {
                setAutoOrganizeTargets(null);
              }
              setAutoOrganizeOpen(true);
            }}
          />
      ) : (
          // 리스트 & 그리드 뷰
          <>
            {/* 폴더 섹션 */}
            {filteredFolders.length > 0 && (
              <div className="jjim-section">
                <h3 className="jjim-section-title">Folders</h3>
                <div className={viewMode === 'grid' ? 'jjim-grid' : 'jjim-list'}>
                  {filteredFolders.map(folder => (
              <div
                key={folder.id}
                      className={`jjim-folder-item ${viewMode} ${selectedIds.has(folder.id) ? 'selected' : ''}`}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (selectedIds.size > 0) {
                          handleSelect(folder.id);
                        } else {
                          setCurrentFolderId(folder.id);
                        }
                      }}
                    >
                      <div className="jjim-folder-checkbox">
                        <Checkbox 
                          checked={selectedIds.has(folder.id)} 
                          onChange={() => handleSelect(folder.id)} 
                        />
                  </div>
                      <IconFolder className="jjim-folder-icon" />
                      <span className="jjim-folder-name">{folder.name}</span>
                      
                      {/* 🆕 개별 삭제 버튼 */}
                      <button 
                        className="jjim-delete-btn"
                        onClick={(e) => handleDeleteSingle(folder, e)}
                        title="폴더 삭제"
                      >
                        ✕
                      </button>
                </div>
                  ))}
                </div>
              </div>
            )}

            {/* 영상 섹션 */}
            {filteredVideos.length > 0 && (
              <div className="jjim-section">
                <h3 className="jjim-section-title">Files</h3>
                <div className={viewMode === 'grid' ? 'jjim-video-grid' : 'jjim-video-list'}>
                  {filteredVideos.map(video => {
                    const videoId = video.videoId;
                    const thumbnail = videoId 
                      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                      : video.thumbnail || 'https://via.placeholder.com/320x180';

            return (
              <div
                key={video.id}
                        className={`jjim-video-item ${viewMode} ${selectedIds.has(video.id) ? 'selected' : ''}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (selectedIds.size > 0) {
                            handleSelect(video.id);
                          } else {
                    window.open(video.videoUrl, '_blank');
                  }
                }}
              >
                        <div className="jjim-video-checkbox">
                          <Checkbox 
                            checked={selectedIds.has(video.id)} 
                            onChange={() => handleSelect(video.id)} 
                          />
                    </div>
                        <div className="jjim-video-thumbnail">
                          <img src={thumbnail} alt={video.title} />
                          {video.duration && (
                            <span className="jjim-video-duration">{video.duration}</span>
                  )}
                </div>
                        <div className="jjim-video-info">
                          <h4 className="jjim-video-title">{video.title || '제목 없음'}</h4>
                          {viewMode === 'list' && (
                            <div className="jjim-video-meta">
                              {video.safetyScore !== undefined && (
                                <SafetyBadge score={video.safetyScore} />
                              )}
                              <span className="jjim-video-date">
                                {video.createdAt?.seconds 
                                  ? new Date(video.createdAt.seconds * 1000).toLocaleDateString()
                                  : '날짜 없음'}
                          </span>
                            </div>
                          )}
                          <div className="jjim-video-actions">
                            {/* 🪄 AI 분류 인라인 버튼 */}
                            <button
                              className="jjim-btn ai-classify"
                              type="button"
                              onClick={(e) => handleInlineAiClassify(video, e)}
                              title="AI 자동 분류"
                            >
                              🪄
                            </button>
                            
                            {isYouTubeUrl(video.videoUrl) ? (
                              <div className="flex gap-2">
                                <button
                                  className={`jjim-btn ${hasExistingAnalysis(video) ? 'result' : 'analyze'}`}
                                  type="button"
                                  disabled={analyzeLoadingId === video.id}
                                  onClick={(e) => handleAnalyzeClick(video, e)}
                                >
                                  {hasExistingAnalysis(video)
                                    ? '상세분석'
                                    : analyzeLoadingId === video.id
                                      ? '분석 중...'
                                      : '분석하기'}
                                </button>
                                <a 
                                  href={video.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="jjim-btn youtube"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  YouTube
                                </a>
                              </div>
                            ) : (
                              <a 
                                href={video.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="jjim-btn link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                원문 보기
                              </a>
                            )}
                          </div>
                          
                          {/* 메모 토글 버튼 */}
                          {video.memo && (
                            <div className="jjim-video-memo-section">
                              <button 
                                className="jjim-memo-toggle-btn"
                                onClick={(e) => toggleMemo(video.id, e)}
                              >
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                  className={`transform transition-transform ${expandedMemos.has(video.id) ? 'rotate-180' : ''}`}
                                >
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                                메모 보기
                              </button>
                              {expandedMemos.has(video.id) && (
                                <div className="jjim-memo-content">
                                  {video.memo}
                                </div>
                              )}
                            </div>
                          )}

                          {viewMode === 'grid' && (
                            <div className="jjim-video-meta-grid">
                              {video.safetyScore !== undefined && (
                                <SafetyBadge score={video.safetyScore} />
                              )}
                            </div>
                    )}
                  </div>
                  
                  {/* 🆕 개별 삭제 버튼 */}
                  <button 
                    className="jjim-delete-btn"
                    onClick={(e) => handleDeleteSingle(video, e)}
                    title="삭제"
                  >
                    ✕
                  </button>
                  </div>
                    );
                  })}
                </div>
                  </div>
                )}
          </>
        )}
                </div>

      {/* AI 자동 정리 모달 */}
      {autoOrganizeOpen && (
        <AutoOrganizeModal 
          videos={videos}
          folders={folders}
          user={user}
          scanTargets={autoOrganizeTargets}
          onClose={() => { setAutoOrganizeOpen(false); setAutoOrganizeTargets(null); }}
          onApply={handleApplyAutoOrganize}
        />
      )}

      {analysisModalOpen && analysisModalData && (
        <div className="jjim-analysis-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAnalysisModalOpen(false)}>
          <div className="jjim-analysis-modal">
            {/* 닫기 버튼 */}
            <button 
              className="jjim-analysis-modal-close"
              onClick={() => {
                setAnalysisModalOpen(false);
                setAnalysisModalData(null);
                setAnalysisProgress(null);
              }}
              aria-label="닫기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <AnalysisResult
              requestId={analysisModalData.videoId || null}
              directResult={analysisModalData}
              progress={analysisProgress}
              onReset={() => {
                setAnalysisModalOpen(false);
                setAnalysisModalData(null);
                setAnalysisProgress(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

