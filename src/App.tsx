import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Folder, User, Plus, ArrowUp, 
  ChevronRight, ChevronDown, ChevronLeft, Copy, Cpu,
  Edit2, Save, X, Trash2, Home
} from 'lucide-react';
import { callApi1, callApi2, callApi3, getOptionById, mapInputModeToGenerationRoute } from './lib/api';
import type { API1Response, API2Response, API3Response } from './types/api';

// --- Mock Data ---
const plans = [
  {
    id: 1,
    title: "情感共鸣向：留学生的孤独与成长",
    recommendationIndex: 98,
    description: "以第一人称视角，讲述初到国外的孤独感，到逐渐适应、找到自我节奏的过程。重点突出情绪价值，容易引发同类群体共鸣。",
    tags: ["情绪向", "共鸣", "成长记录"],
    aiCommand: "你现在是一名拥有百万粉丝的小红书爆款短视频编导。请帮我写一个关于“留学生孤独与成长”的短视频脚本。要求：\n1. 视频时长约60秒。\n2. 采用第一人称视角，开头设置悬念或痛点（如：来留学的第365天，我终于敢说，我活下来了）。\n3. 画面需要有强烈的对比感（如深夜赶Due vs 阳光下自信发言）。\n4. 结尾需要有互动引导，引发评论区共鸣。",
    aiTools: [
      { name: "Claude 3.5 Sonnet", desc: "用于进一步优化和扩写脚本细节，情感细腻，文笔自然" },
      { name: "剪映 / CapCut", desc: "使用其AI配音功能生成情感充沛的旁白，以及匹配空镜素材" }
    ]
  },
  {
    id: 2,
    title: "干货经验向：如何快速适应国外生活",
    recommendationIndex: 85,
    description: "总结留学生必备的生存技能，包括租房、购物、交友等实用建议。适合作为干货分享，吸引需要实用信息的新留学生。",
    tags: ["干货", "实用", "经验分享"],
    aiCommand: "你现在是一名资深留学博主。请帮我写一个关于“如何快速适应国外生活”的干货短视频脚本。要求：\n1. 视频时长约60秒，节奏明快。\n2. 采用“痛点+解决方案”的结构，列出3个最实用的生存技能（如租房避坑、超市购物平替、快速交友）。\n3. 语言风格接地气、有网感。\n4. 结尾引导粉丝点赞收藏。",
    aiTools: [
      { name: "ChatGPT (GPT-4o)", desc: "逻辑清晰，非常适合梳理干货框架和知识点" },
      { name: "HeyGen", desc: "如果选择不露脸，可使用数字人播报干货，提高制作效率" }
    ]
  },
  {
    id: 3,
    title: "反差搞笑向：留学前vs留学后",
    recommendationIndex: 76,
    description: "通过夸张的对比手法，展现留学前的美好幻想与留学后的真实（略带心酸）生活。娱乐性强，容易获得高点赞和转发。",
    tags: ["搞笑", "反差", "娱乐"],
    aiCommand: "你现在是一名擅长写搞笑段子的短视频编剧。请帮我写一个关于“留学前vs留学后”的反差搞笑短视频脚本。要求：\n1. 视频时长约60秒。\n2. 采用强烈的对比手法，展现留学前的美好幻想（如精致下午茶）与留学后的真实生活（如赶Due吃泡面）。\n3. 动作和表情提示要夸张，富有喜剧效果。\n4. 结尾留下一个神转折或吐槽。",
    aiTools: [
      { name: "Kimi", desc: "网感好，适合生成搞笑段子和本土化热梗" },
      { name: "Midjourney", desc: "可用于生成夸张的背景素材或表情包辅助视频表现" }
    ]
  }
];

type Step = 'home' | 'conditions' | 'plans' | 'script';
type Tab = 'create' | 'projects';

type ConditionSnapshot = {
  goals: string[];
  platform: string;
  length: string;
  audience: string;
  appearance: string;
  expression: string;
  production: string;
};

type PlanSelectionId = 'A' | 'B' | 'C' | number;

type ProjectSnapshot = {
  topic: string;
  originalTopic: string;
  displayTopic: string;
  inputMode: 'script' | 'command';
  currentStep: 'plans' | 'script';
  selectedPlanId: PlanSelectionId | null;
  expandedPlanId: PlanSelectionId | null;
  selectedPlanTitle: string;
  planCards: any[];
  conditions: ConditionSnapshot;
  api1Result: API1Response | null;
  api2Result: API2Response | null;
  scriptTableData: any[];
  aiSegments: any[];
};

type HistoryItem = {
  id: string;
  type: 'script' | 'command';
  title: string;
  timestamp: number;
  content: any;
  snapshot: ProjectSnapshot;
};

type CreatorMemory = {
  originalTopic: string;
  lastTheme: string;
  lastGoals: string[];
  lastPlatform: string;
  lastAudience: string;
  lastExpression: string;
};

type CompatiblePlanCard = {
  id: 'A' | 'B' | 'C';
  title: string;
  tags: string[];
  description: string;
  recommendationIndex: number;
  selectionReason: string;
  structureHighlights: string[];
};

type CompatibleScriptRow = {
  id: number;
  scene: string;
  time: string;
  visual: string;
  cameraPos: string;
  cameraMove: string;
  shotSize: string;
  dialogue: string;
  sound: string;
};

type CompatibleAiSegment = {
  id: number;
  title: string;
  content: string;
};

const GOAL_LABELS: Record<string, string> = {
  涨粉: '涨粉',
  建立人设: '建立人设',
  引发共鸣: '引发共鸣',
  教程: '教程',
  记录生活: '记录生活',
  分享观点: '分享观点',
  带货: '带货',
  引流: '引流',
};

const PLATFORM_LABELS: Record<string, string> = {
  抖音: '抖音',
  小红书: '小红书',
  B站: 'B站',
  快手: '快手',
  微信视频号: '微信视频号',
};

const LENGTH_LABELS: Record<string, string> = {
  '~15s': '约15秒',
  '~30s': '约30秒',
  '~60s': '约60秒',
  '1~3min': '1~3分钟',
  '3~5min': '3~5分钟',
  '5~10min': '5~10分钟',
  '10min+': '10分钟以上',
};

const AUDIENCE_LABELS: Record<string, string> = {
  泛用户: '泛用户',
  精准用户: '精准用户',
  新手: '新手',
  同行: '同行',
  潜在客户: '潜在客户',
  有相似经历: '有相似经历',
};

const APPEARANCE_LABELS: Record<string, string> = {
  露脸: '露脸',
  不露脸: '不露脸',
  虚拟形象: '虚拟形象',
};

const EXPRESSION_LABELS: Record<string, string> = {
  口播: '口播',
  画外音: '画外音',
  画外音解说: '画外音',
  '纯字幕+音乐': '纯字幕+音乐',
};

const PRODUCTION_LABELS: Record<string, string> = {
  平衡: '平衡',
  低成本: '低成本',
  高表现力: '高表现力',
  快速: '快速',
  精良: '精良',
};

const formatGoalLabel = (value: string) => GOAL_LABELS[value] || value;
const formatPlatformLabel = (value: string) => PLATFORM_LABELS[value] || value;
const formatLengthLabel = (value: string) => LENGTH_LABELS[value] || value;
const formatAudienceLabel = (value: string) => AUDIENCE_LABELS[value] || value;
const formatAppearanceLabel = (value: string) => APPEARANCE_LABELS[value] || value;
const formatExpressionLabel = (value: string) => EXPRESSION_LABELS[value] || value;
const formatProductionLabel = (value: string) => PRODUCTION_LABELS[value] || value;

const LEGACY_LENGTH_TO_CANONICAL: Record<string, string> = {
  约15秒: '~15s',
  约30秒: '~30s',
  约60秒: '~60s',
  '60年代': '~60s',
  '10min以上': '10min+',
};

const normalizeLengthValue = (value: string | undefined) => {
  if (!value) return '~60s';
  return LEGACY_LENGTH_TO_CANONICAL[value] || value;
};

const LEGACY_PRODUCTION_TO_CANONICAL: Record<string, string> = {
  快速: '低成本',
  精良: '高表现力',
};

const normalizeProductionValue = (value: string | undefined) => {
  if (!value) return '平衡';
  return LEGACY_PRODUCTION_TO_CANONICAL[value] || value;
};

const getConditionDisplayChips = (snapshot?: ProjectSnapshot) => {
  const source = snapshot?.conditions;
  if (!source) return [];

  return [
    ...(source.goals || []).map(formatGoalLabel),
    source.platform ? formatPlatformLabel(source.platform) : null,
    source.length ? formatLengthLabel(normalizeLengthValue(source.length)) : null,
    source.audience ? formatAudienceLabel(source.audience) : null,
    source.appearance ? formatAppearanceLabel(source.appearance) : null,
    source.expression ? formatExpressionLabel(source.expression) : null,
    source.production
      ? formatProductionLabel(normalizeProductionValue(source.production))
      : null,
  ].filter(Boolean) as string[];
};

const BouncingLogoLoader = () => (
  <div className="w-16 h-16 bg-black rounded-[20px] rounded-br-[8px] relative overflow-hidden mb-6 shadow-xl mx-auto">
    <motion.div
      className="w-4 h-4 bg-white rounded-full flex items-center justify-center absolute left-[20%]"
      style={{ bottom: '15%' }}
      animate={{ y: [0, -24, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: ["easeOut", "easeIn"], times: [0, 0.5, 1] }}
    >
      <div className="w-1.5 h-1.5 bg-black rounded-full absolute right-[2px]"></div>
    </motion.div>
    <motion.div
      className="w-4 h-4 bg-white rounded-full flex items-center justify-center absolute right-[20%]"
      style={{ bottom: '15%' }}
      animate={{ y: [0, -28, 0] }}
      transition={{ duration: 0.7, repeat: Infinity, ease: ["easeOut", "easeIn"], times: [0, 0.5, 1] }}
    >
      <div className="w-1.5 h-1.5 bg-black rounded-full absolute right-[2px]"></div>
    </motion.div>
  </div>
);

const AiThinkingText = ({ texts }: { texts: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % texts.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [texts]);

  return (
    <div className="h-6 overflow-hidden relative w-full flex justify-center">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute text-sm text-gray-500 font-medium whitespace-nowrap"
        >
          {texts[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('create');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyType, setHistoryType] = useState<'script' | 'command'>('script');
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [creatorMemory, setCreatorMemory] = useState<CreatorMemory | null>(null);
  const [isEditingHistoryScript, setIsEditingHistoryScript] = useState(false);
  const [historyExportMenu, setHistoryExportMenu] = useState(false);

  const HISTORY_STORAGE_KEY = 'ai_script_history';
  const MEMORY_STORAGE_KEY = 'ai_creator_memory';
  const ACTIVE_PROJECT_STORAGE_KEY = 'ai_active_project_id';

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [planCards, setPlanCards] = useState<any[]>(plans as any[]);
  const [pageEntrySource, setPageEntrySource] = useState<'live' | 'history'>('live');
  const [historyOpenedProjectId, setHistoryOpenedProjectId] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('home');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [originalTopic, setOriginalTopic] = useState('');
  const [inputMode, setInputMode] = useState<'script' | 'command'>('script');
  
  // Conditions State
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['建立人设']);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('小红书');
  const [selectedLength, setSelectedLength] = useState<string>('~60s');
  const [isMoreConditionsExpanded, setIsMoreConditionsExpanded] = useState(false);

  // More Conditions State
  const [selectedAudience, setSelectedAudience] = useState<string>('泛用户');
  const [selectedAppearance, setSelectedAppearance] = useState<string>('露脸');
  const [selectedExpression, setSelectedExpression] = useState<string>('口播');
  const [selectedProduction, setSelectedProduction] = useState<string>('平衡');

  // API State
  const [api1Result, setApi1Result] = useState<API1Response | null>(null);
  const [apiError, setApiError] = useState<string>('');
  const [isSubmittingApi1, setIsSubmittingApi1] = useState(false);

  // Plans State
  const [expandedPlanId, setExpandedPlanId] = useState<PlanSelectionId | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanSelectionId | null>(null);
  const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);
  const [api2Result, setApi2Result] = useState<API2Response | null>(null);
  const [api2Error, setApi2Error] = useState('');
  const [api3Result, setApi3Result] = useState<API3Response | null>(null);
  const [api3Error, setApi3Error] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Script Table State
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [scriptTableData, setScriptTableData] = useState<CompatibleScriptRow[]>([]);

  // AI Command View State
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [aiSegments, setAiSegments] = useState<CompatibleAiSegment[]>([]);

  const selectedPlan =
    planCards.find((p) => p.id === selectedPlanId) ?? planCards[0] ?? plans[0] ?? null;

  const recommendedAiTools = [
    { name: 'ChatGPT / GPT-4o', desc: '用于继续细化分段 AI 指令、口播台词与字幕重点。' },
    { name: '可灵 / 即梦 / Midjourney', desc: '根据不同片段指令生成画面、镜头或视频内容。' }
  ];

  const buildScriptTableFromApi3 = (result: API3Response): CompatibleScriptRow[] => {
    const shots = result?.result3?.base_storyboard_script?.shots ?? [];

    return shots.map((shot) => ({
      id: shot.shot_no,
      scene: String(shot.shot_no),
      time: shot.timecode,
      visual: shot.visual_description,
      cameraPos: shot.camera_position,
      cameraMove: shot.shooting_method,
      shotSize: shot.shot_size,
      dialogue: shot.dialogue,
      sound: shot.sound_effect,
    }));
  };

  const buildAiSegmentsFromApi3 = (result: API3Response): CompatibleAiSegment[] => {
    const displayData = result?.result3?.route_display_data;
    if (!displayData || displayData.display_type !== 'segmented_ai_instructions') {
      return [];
    }

    return displayData.instruction_segments.map((segment, index) => {
      const spokenLinesText = segment.spoken_lines?.length
        ? `口播台词：\n${segment.spoken_lines.map((line) => `- ${line}`).join('\n')}`
        : '口播台词：无口播，以字幕呈现';

      const subtitleText = segment.subtitle_focus?.length
        ? `字幕重点：${segment.subtitle_focus.join(' / ')}`
        : '字幕重点：无';

      return {
        id: index + 1,
        title: `${segment.segment_name}（${segment.shot_range}）`,
        content: `${segment.instruction_text}\n\n${spokenLinesText}\n${subtitleText}`,
      };
    });
  };

  const hasSavedRef = useRef(false);
  const skipNextPlansFetchRef = useRef(false);
  const skipOneScriptGenerationRef = useRef(false);

  const buildConditionSnapshot = (): ConditionSnapshot => ({
    goals: selectedGoals,
    platform: selectedPlatform,
    length: selectedLength,
    audience: selectedAudience,
    appearance: selectedAppearance,
    expression: selectedExpression,
    production: selectedProduction,
  });

  const buildProjectSnapshot = (
    stepValue: 'plans' | 'script',
    overrides?: Partial<ProjectSnapshot>
  ): ProjectSnapshot => {
    const stableTopic =
      (inputText || '').trim() ||
      creatorMemory?.originalTopic ||
      creatorMemory?.lastTheme ||
      '未命名主题';

    return {
    topic: stableTopic,
    originalTopic: stableTopic,
    displayTopic: stableTopic,
    inputMode,
    currentStep: stepValue,
    selectedPlanId,
    expandedPlanId,
    selectedPlanTitle: (selectedPlan as any)?.title || '未命名方案',
    planCards: JSON.parse(JSON.stringify(planCards)),
    conditions: buildConditionSnapshot(),
    api1Result,
    api2Result,
    scriptTableData: JSON.parse(JSON.stringify(scriptTableData)),
    aiSegments: JSON.parse(JSON.stringify(aiSegments)),
    ...overrides,
  };
  };

  const restoreSnapshotToState = (
    snapshot: ProjectSnapshot,
    targetStep?: 'plans' | 'script'
  ) => {
    setInputText(snapshot.originalTopic || snapshot.displayTopic || snapshot.topic || '');
    setInputMode(snapshot.inputMode || 'script');

    setSelectedGoals(snapshot.conditions?.goals || ['建立人设']);
    setSelectedPlatform(snapshot.conditions?.platform || '小红书');
    setSelectedLength(normalizeLengthValue(snapshot.conditions?.length));
    setSelectedAudience(snapshot.conditions?.audience || '泛用户');
    setSelectedAppearance(snapshot.conditions?.appearance || '露脸');
    setSelectedExpression(snapshot.conditions?.expression || '口播');
    setSelectedProduction(normalizeProductionValue(snapshot.conditions?.production));

    setApi1Result(snapshot.api1Result || null);
    setApi2Result(snapshot.api2Result || null);

    setPlanCards(snapshot.planCards?.length ? snapshot.planCards : plans);
    setSelectedPlanId(snapshot.selectedPlanId ?? (plans[0]?.id as PlanSelectionId) ?? null);
    setExpandedPlanId(
      snapshot.expandedPlanId ?? snapshot.selectedPlanId ?? (plans[0]?.id as PlanSelectionId) ?? null
    );

    if (snapshot.scriptTableData?.length) {
      setScriptTableData(snapshot.scriptTableData);
    }
    if (snapshot.aiSegments?.length) {
      setAiSegments(snapshot.aiSegments);
    }

    setIsGeneratingPlans(false);
    setIsGeneratingScript(false);
    const nextStep = targetStep || snapshot.currentStep || 'plans';
    if (nextStep === 'plans') {
      skipNextPlansFetchRef.current = true;
    }
    setStep(nextStep);
  };

  const upsertProjectHistory = (
    projectId: string,
    stepValue: 'plans' | 'script',
    overrides?: Partial<ProjectSnapshot>
  ) => {
    const snapshot = buildProjectSnapshot(stepValue, overrides);
    setHistoryItems((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.id === projectId);
      const item: HistoryItem = {
        id: projectId,
        type: snapshot.inputMode,
        title:
          snapshot.displayTopic ||
          snapshot.originalTopic ||
          snapshot.topic ||
          snapshot.selectedPlanTitle ||
          '未命名项目',
        timestamp: Date.now(),
        content: snapshot.inputMode === 'script' ? snapshot.scriptTableData : snapshot.aiSegments,
        snapshot,
      };

      if (index >= 0) {
        next[index] = item;
      } else {
        next.unshift(item);
      }

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const sanitizeFileName = (value: string) =>
    (value || '未命名项目')
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50) || '未命名项目';

  const getCurrentProjectName = () =>
    sanitizeFileName(
      inputText?.trim() ||
        creatorMemory?.originalTopic ||
        creatorMemory?.lastTheme ||
        selectedPlan?.title ||
        '未命名项目'
    );

  const getScriptHeaders = (tableData: any[] = scriptTableData) => {
    if (!Array.isArray(tableData) || tableData.length === 0) return [];
    const first = tableData[0];
    if (!first || typeof first !== 'object') return [];
    return Object.keys(first);
  };

  const getScriptRows = (tableData: any[] = scriptTableData) => {
    const headers = getScriptHeaders(tableData);
    if (!headers.length) return [];
    return tableData.map((row: any) =>
      headers.map((header) => {
        const value = row?.[header];
        if (Array.isArray(value)) return value.join(' / ');
        if (value === null || value === undefined) return '';
        return String(value);
      })
    );
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyText = async (text: string, successMessage = '已复制到剪贴板') => {
    const content = (text || '').trim();
    if (!content) {
      window.alert('没有可复制的内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      window.alert(successMessage);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      window.alert(successMessage);
    }
  };

  const buildSingleAiSegmentText = (segment: any, index: number) => {
    const title =
      segment?.title ||
      segment?.segment_title ||
      segment?.segmentGoal ||
      segment?.segment_goal ||
      `片段 ${index + 1}`;

    const instruction =
      segment?.instructionText ||
      segment?.instruction_text ||
      '';

    const subtitleFocus = Array.isArray(segment?.subtitleFocus)
      ? segment.subtitleFocus.join('；')
      : Array.isArray(segment?.subtitle_focus)
        ? segment.subtitle_focus.join('；')
        : segment?.subtitleFocus || segment?.subtitle_focus || '';

    const spokenLines = Array.isArray(segment?.spokenLines)
      ? segment.spokenLines.join('；')
      : Array.isArray(segment?.spoken_lines)
        ? segment.spoken_lines.join('；')
        : segment?.spokenLines || segment?.spoken_lines || '';

    const bodyFromContent =
      !instruction && !subtitleFocus && !spokenLines && segment?.content
        ? String(segment.content)
        : '';

    return [
      `${index + 1}. ${title}`,
      instruction ? `AI指令：${instruction}` : '',
      subtitleFocus ? `字幕重点：${subtitleFocus}` : '',
      spokenLines ? `声音/台词：${spokenLines}` : '',
      bodyFromContent,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const buildAllAiInstructionText = (segmentsOverride?: any[]) => {
    const segments = segmentsOverride ?? aiSegments;
    if (!Array.isArray(segments) || segments.length === 0) return '';
    return segments
      .map((segment, index) => buildSingleAiSegmentText(segment, index))
      .join('\n\n');
  };

  const exportScriptAsCSV = (tableData?: any[], projectNameOverride?: string) => {
    const data = tableData ?? scriptTableData;
    const headers = getScriptHeaders(data);
    const rows = getScriptRows(data);

    if (!headers.length || !rows.length) {
      window.alert('当前没有可导出的专业脚本内容');
      return;
    }

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const base = projectNameOverride
      ? sanitizeFileName(projectNameOverride)
      : getCurrentProjectName();
    downloadBlob(blob, `${base}-专业脚本.csv`);
  };

  const exportScriptAsPDF = (tableData?: any[], projectNameOverride?: string) => {
    const data = tableData ?? scriptTableData;
    const headers = getScriptHeaders(data);
    const rows = getScriptRows(data);

    if (!headers.length || !rows.length) {
      window.alert('当前没有可导出的专业脚本内容');
      return;
    }

    const base = projectNameOverride
      ? sanitizeFileName(projectNameOverride)
      : getCurrentProjectName();
    const title = `${base} - 专业脚本`;
    const tableHtml = `
    <table>
      <thead>
        <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`)
                .join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            padding: 24px;
            color: #111827;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            vertical-align: top;
            word-break: break-word;
            text-align: left;
          }
          th {
            background: #f3f4f6;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${tableHtml}
        <script>
          window.onload = function () {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) {
      window.alert('无法打开 PDF 导出窗口，请检查浏览器是否拦截弹窗');
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) => {
    const chars = String(text || '').split('');
    const lines: string[] = [];
    let current = '';

    chars.forEach((char) => {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : [''];
  };

  const exportScriptAsJPG = async (
    tableData?: any[],
    projectNameOverride?: string
  ) => {
    const data = tableData ?? scriptTableData;
    const headers = getScriptHeaders(data);
    const rows = getScriptRows(data);

    if (!headers.length || !rows.length) {
      window.alert('当前没有可导出的专业脚本内容');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      window.alert('当前浏览器不支持 JPG 导出');
      return;
    }

    const base = projectNameOverride
      ? sanitizeFileName(projectNameOverride)
      : getCurrentProjectName();
    const title = `${base} - 专业脚本`;
    const font = '14px "Microsoft YaHei", Arial, sans-serif';
    const titleFont = 'bold 20px "Microsoft YaHei", Arial, sans-serif';

    ctx.font = font;
    const columnWidths = headers.map((header, colIndex) => {
      const headerWidth = ctx.measureText(header).width + 28;
      const cellMax = Math.max(
        ...rows.map((row) =>
          Math.min(ctx.measureText(String(row[colIndex] || '')).width + 28, 260)
        ),
        headerWidth
      );
      return Math.min(Math.max(cellMax, 120), 260);
    });

    const padding = 24;
    const titleHeight = 42;
    const rowBaseHeight = 32;
    const lineHeight = 20;

    const rowHeights = rows.map((row) => {
      return Math.max(
        rowBaseHeight,
        ...row.map((cell, colIndex) => {
          const lines = wrapCanvasText(
            ctx,
            String(cell || ''),
            columnWidths[colIndex] - 20
          );
          return lines.length * lineHeight + 12;
        })
      );
    });

    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const tableHeight =
      rowBaseHeight + rowHeights.reduce((sum, height) => sum + height, 0);

    canvas.width = tableWidth + padding * 2;
    canvas.height = titleHeight + tableHeight + padding * 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = titleFont;
    ctx.fillText(title, padding, padding + 20);

    const tableX = padding;
    let currentY = padding + titleHeight;

    ctx.font = font;
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;

    // header
    let currentX = tableX;
    headers.forEach((header, index) => {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(currentX, currentY, columnWidths[index], rowBaseHeight);
      ctx.strokeRect(currentX, currentY, columnWidths[index], rowBaseHeight);

      ctx.fillStyle = '#111827';
      ctx.fillText(header, currentX + 10, currentY + 20);
      currentX += columnWidths[index];
    });

    currentY += rowBaseHeight;

    // rows
    rows.forEach((row, rowIndex) => {
      currentX = tableX;
      const currentHeight = rowHeights[rowIndex];

      row.forEach((cell, colIndex) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(currentX, currentY, columnWidths[colIndex], currentHeight);
        ctx.strokeRect(currentX, currentY, columnWidths[colIndex], currentHeight);

        ctx.fillStyle = '#111827';
        const lines = wrapCanvasText(
          ctx,
          String(cell || ''),
          columnWidths[colIndex] - 20
        );
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, currentX + 10, currentY + 20 + lineIndex * lineHeight);
        });

        currentX += columnWidths[colIndex];
      });

      currentY += currentHeight;
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          window.alert('JPG 导出失败');
          return;
        }
        downloadBlob(blob, `${base}-专业脚本.jpg`);
      },
      'image/jpeg',
      0.95
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized: HistoryItem[] = parsed.map((item: any) => {
            if (item?.snapshot) {
              const s = item.snapshot;
              const topicSrc =
                s.originalTopic ?? s.displayTopic ?? s.topic ?? item?.title ?? '未命名主题';
              const cond = s.conditions;
              return {
                ...item,
                snapshot: {
                  ...s,
                  topic: s.topic ?? topicSrc,
                  originalTopic: s.originalTopic ?? topicSrc,
                  displayTopic: s.displayTopic ?? topicSrc,
                  conditions: cond
                    ? {
                        ...cond,
                        length: normalizeLengthValue(cond.length),
                        production: normalizeProductionValue(cond.production),
                      }
                    : cond,
                },
              };
            }
            const legacyTopic = item?.title || '未命名主题';
            return {
              ...item,
              snapshot: {
                topic: legacyTopic,
                originalTopic: legacyTopic,
                displayTopic: legacyTopic,
                inputMode: item?.type === 'command' ? 'command' : 'script',
                currentStep: 'script',
                selectedPlanId: plans[0].id,
                expandedPlanId: plans[0].id,
                selectedPlanTitle: item?.title || '未命名方案',
                planCards: plans,
                conditions: {
                  goals: ['建立人设'],
                  platform: '小红书',
                  length: '~60s',
                  audience: '泛用户',
                  appearance: '露脸',
                  expression: '口播',
                  production: '平衡',
                },
                api1Result: null,
                api2Result: null,
                scriptTableData: item?.type === 'script' ? item?.content || [] : [],
                aiSegments: item?.type === 'command' ? item?.content || [] : [],
              },
            };
          });
          const cleaned = normalized.filter((item: HistoryItem) => {
            const snapshot = item.snapshot;
            if (!snapshot) return false;

            const hasScript =
              Array.isArray(snapshot.scriptTableData) && snapshot.scriptTableData.length > 0;
            const hasCommand =
              Array.isArray(snapshot.aiSegments) && snapshot.aiSegments.length > 0;
            const hasTopLevelContent = Array.isArray(item.content) && item.content.length > 0;

            return hasScript || hasCommand || hasTopLevelContent;
          });

          setHistoryItems(cleaned);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    const mem = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (mem) {
      try {
        const parsed = JSON.parse(mem);
        setCreatorMemory(parsed);
        setOriginalTopic(parsed?.originalTopic || parsed?.lastTheme || '');
      } catch (e) {}
    }

    const active = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
    if (active) {
      setActiveProjectId(active);
    }
  }, []);

  // Generate final result when entering script step
  useEffect(() => {
    if (step !== 'script') return;

    if (skipOneScriptGenerationRef.current) {
      skipOneScriptGenerationRef.current = false;
      return;
    }

    setIsSummaryExpanded(false);
    hasSavedRef.current = false;

    const optionId =
      selectedPlanId === 'A' || selectedPlanId === 'B' || selectedPlanId === 'C'
        ? selectedPlanId
        : null;
    if (!api1Result || !api2Result || !optionId) {
      setApi3Error('缺少完整方案数据，请返回上一步重新生成。');
      setIsGeneratingScript(false);
      return;
    }

    let cancelled = false;

    const runFinalGeneration = async () => {
      setApi3Error('');
      hasSavedRef.current = false;
      setIsGeneratingScript(true); // hasSavedRef cleared immediately before starting generation

      try {
        const generationRoute = mapInputModeToGenerationRoute(inputMode);
        const selectedOptionData = getOptionById(api2Result, optionId);
        const result = await callApi3({
          result1: api1Result,
          result2: api2Result,
          selected_option_id: optionId,
          generation_route: generationRoute,
          selected_option_data: selectedOptionData,
          user_extra_request: '',
          edited_by_user_fields: [],
          option_edited_by_user_fields: [],
          language: '中文',
        });

        if (cancelled) return;

        setApi3Result(result);

        if (generationRoute === 'pro_script') {
          const mappedTable = buildScriptTableFromApi3(result);
          if (mappedTable.length > 0) {
            setScriptTableData(mappedTable);
          }
        } else {
          const mappedSegments = buildAiSegmentsFromApi3(result);
          if (mappedSegments.length > 0) {
            setAiSegments(mappedSegments);
          }
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : '生成完整版失败，请稍后重试';
        setApi3Error(message);
      } finally {
        if (!cancelled) {
          setIsGeneratingScript(false);
        }
      }
    };

    runFinalGeneration();

    return () => {
      cancelled = true;
    };
  }, [step, api1Result, api2Result, selectedPlanId, inputMode]);

  useEffect(() => {
    if (step !== 'plans') return;
    if (!api1Result) {
      setApi2Error('缺少创作条件分析结果，请返回上一步重试。');
      setIsGeneratingPlans(false);
      return;
    }

    if (skipNextPlansFetchRef.current) {
      skipNextPlansFetchRef.current = false;
      setIsGeneratingPlans(false);
      return;
    }

    let cancelled = false;

    const buildPlanCardsFromApi2 = (result: API2Response): CompatiblePlanCard[] => {
      const scoreMap: Record<'A' | 'B' | 'C', number> = {
        A: 98,
        B: 85,
        C: 76,
      };

      return (result?.result2?.options ?? []).map((option) => ({
        id: option.option_id,
        title: option.card_title,
        tags: option.highlight_tags,
        description: option.card_summary,
        recommendationIndex: scoreMap[option.option_id] ?? 80,
        selectionReason: option.selection_reason,
        structureHighlights: option.expansion_anchor?.core_structure_path ?? [],
      }));
    };

    const runPlansGeneration = async () => {
      setApi2Error('');
      setIsGeneratingPlans(true);

      try {
        const generationRoute = mapInputModeToGenerationRoute(inputMode);
        const result = await callApi2({
          result1: api1Result,
          generation_route: generationRoute,
          user_extra_request: '',
          edited_by_user_fields: [],
          language: '中文',
        });

        if (cancelled) return;

        setApi2Result(result);

        const mappedPlans = buildPlanCardsFromApi2(result);
        setPlanCards(mappedPlans);

        const firstOption = mappedPlans[0]?.id ?? null;
        setSelectedPlanId(firstOption);
        setExpandedPlanId(firstOption);

        if (activeProjectId) {
          upsertProjectHistory(activeProjectId, 'plans', {
            planCards: mappedPlans,
            api2Result: result,
            selectedPlanId: firstOption,
            expandedPlanId: firstOption,
            selectedPlanTitle: mappedPlans[0]?.title || '未命名方案',
          });
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : '方案生成失败，请稍后重试';
        setApi2Error(message);
      } finally {
        if (!cancelled) {
          setIsGeneratingPlans(false);
        }
      }
    };

    runPlansGeneration();

    return () => {
      cancelled = true;
    };
  }, [step, api1Result, inputMode, activeProjectId]);

  useEffect(() => {
    if (step !== 'script' || isGeneratingScript || hasSavedRef.current || !activeProjectId) return;

    const hasUsableContent =
      inputMode === 'script'
        ? Array.isArray(scriptTableData) && scriptTableData.length > 0
        : Array.isArray(aiSegments) && aiSegments.length > 0;

    if (!hasUsableContent) return;

    hasSavedRef.current = true;
    upsertProjectHistory(activeProjectId, 'script');
  }, [step, isGeneratingScript, activeProjectId, inputMode, scriptTableData, aiSegments]);

  const handleNextFromInput = () => {
    setStep('conditions');
    setIsInputExpanded(false);
  };

  const getLockedOriginalTopic = () => {
    return (
      originalTopic.trim() ||
      (creatorMemory?.originalTopic || creatorMemory?.lastTheme)?.trim() ||
      inputText.trim() ||
      '未命名主题'
    );
  };

  const displayTopic = getLockedOriginalTopic();

  const buildApi1Payload = () => {
    const topic = getLockedOriginalTopic();
    const goals = selectedGoals.join('、');
    const platforms = selectedPlatform;
    const duration = selectedLength;
    const audiences = selectedAudience;
    const presentation_mode = selectedAppearance;
    const narration_mode = selectedExpression;
    const materials = '';
    const extra_notes = selectedProduction ? `制作偏好：${selectedProduction}` : '';

    return {
      topic,
      goals,
      platforms,
      duration,
      audiences,
      presentation_mode,
      narration_mode,
      materials,
      extra_notes,
      image_paths: [],
    };
  };

  const handleConfirmConditions = async () => {
    const lockedTopic =
      inputText.trim() ||
      (creatorMemory?.originalTopic || creatorMemory?.lastTheme)?.trim() ||
      '未命名主题';

    const memory: CreatorMemory = {
      originalTopic: lockedTopic,
      lastTheme: lockedTopic,
      lastGoals: selectedGoals,
      lastPlatform: selectedPlatform,
      lastAudience: selectedAudience,
      lastExpression: selectedExpression
    };

    setOriginalTopic(lockedTopic);
    setInputText(lockedTopic);
    setApiError('');
    setIsSubmittingApi1(true);

    try {
      setApi2Result(null);
      setApi2Error('');
      const result = await callApi1({
        ...buildApi1Payload(),
        topic: lockedTopic,
      });
      setApi1Result(result);

      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
      setCreatorMemory(memory);

      const projectId = Date.now().toString();
      setActiveProjectId(projectId);
      localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId);

      setPlanCards(plans as any[]);
      setSelectedPlanId(plans[0].id);
      setExpandedPlanId(plans[0].id);

      upsertProjectHistory(projectId, 'plans', {
        api1Result: result,
        api2Result: null,
        planCards: plans as any[],
        selectedPlanId: plans[0].id,
        expandedPlanId: plans[0].id,
        selectedPlanTitle: (plans[0] as any)?.title || '未命名方案',
      });

      setStep('plans');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '创作条件分析失败，请稍后重试';
      setApiError(message);
    } finally {
      setIsSubmittingApi1(false);
    }
  };

  const api3SegmentGroups = api3Result?.result3?.base_storyboard_script?.segment_groups ?? [];

  const handleCopyAiSegment = async (segment: any, index: number) => {
    await copyText(
      buildSingleAiSegmentText(segment, index),
      `片段 ${index + 1} AI 指令已复制`
    );
  };

  const handleCopyAllAiSegments = async (segmentsOverride?: any[]) => {
    await copyText(buildAllAiInstructionText(segmentsOverride), '完整 AI 指令已复制');
  };

  return (
    <div className="w-full h-screen bg-[#F7F8FA] overflow-hidden relative font-sans text-gray-900">
      
      {/* --- HOME STEP --- */}
      <AnimatePresence>
        {currentTab === 'create' && step === 'home' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 overflow-y-auto pb-32"
          >
            {/* Header */}
            <div className="pt-safe mt-4 px-6 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 bg-black rounded-[10px] rounded-br-[4px] relative flex items-center justify-center overflow-hidden">
                    <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center relative z-10 mr-1.5 mt-0.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-black rounded-full absolute right-[1px]"></div>
                    </div>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">与你开启创作之旅</h1>
              </div>
              <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm transition-transform">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* 主题推荐 */}
            <div className="px-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                <h2 className="text-base font-bold text-gray-900">主题推荐</h2>
              </div>
              <div className="space-y-3">
                {['留学一年终于适应了国外生活', '我的AI学习经历', '咖啡厅学习的一天'].map((theme, i) => (
                  <div 
                    key={i} 
                    className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer active:scale-95 transition-transform"
                    onClick={() => { 
                      setInputText(theme);
                      setOriginalTopic(theme);
                      setIsInputExpanded(true); 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#FFD600] rounded-sm"></div>
                      <span className="text-gray-800 text-sm font-medium">{theme}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* 创作者记忆 */}
            {creatorMemory && (
              <div className="px-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                  <h2 className="text-base font-bold text-gray-900">创作者记忆</h2>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-bold text-gray-900 truncate">{creatorMemory?.originalTopic || creatorMemory?.lastTheme}</div>
                      <div className="text-xs text-gray-400 mt-0.5">最近一次创作设定</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {creatorMemory.lastGoals.map((g, i) => (
                      <span key={`g-${i}`} className="px-2 py-1 bg-[#FFD600]/10 text-[#D4B000] font-medium text-xs rounded-md">
                        {formatGoalLabel(g)}
                      </span>
                    ))}
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 font-medium text-xs rounded-md">
                      {formatPlatformLabel(creatorMemory.lastPlatform)}
                    </span>
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 font-medium text-xs rounded-md">
                      {formatAudienceLabel(creatorMemory.lastAudience)}
                    </span>
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 font-medium text-xs rounded-md">
                      {formatExpressionLabel(creatorMemory.lastExpression)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHAT INPUT (Visible on Home) --- */}
      <AnimatePresence>
        {currentTab === 'create' && step === 'home' && (
          <>
            {isInputExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsInputExpanded(false)}
              />
            )}
            <motion.div 
              layout
              className={`fixed left-0 right-0 z-50 px-4 transition-all duration-300 ${isInputExpanded ? 'bottom-0' : 'bottom-20'}`}
            >
              <div 
                className={`bg-white w-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col ${isInputExpanded ? 'rounded-t-3xl pb-safe pt-4 px-4 h-[40vh]' : 'rounded-3xl p-4'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isInputExpanded) setIsInputExpanded(true);
                }}
              >
                {isInputExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <div className="w-16 h-16 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                      <Plus className="w-6 h-6" />
                    </div>
                  </motion.div>
                )}

                <textarea 
                  className={`w-full resize-none outline-none text-gray-800 placeholder-gray-400 text-base bg-transparent ${isInputExpanded ? 'flex-1' : 'h-6'}`}
                  placeholder="输入任意主题，生成脚本或指令"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onFocus={() => setIsInputExpanded(true)}
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1 bg-gray-50 p-1 rounded-full relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setInputMode('script'); }}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${inputMode === 'script' ? 'font-bold text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      专业脚本
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setInputMode('command'); }}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${inputMode === 'command' ? 'font-bold text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      AI指令
                    </button>
                  </div>
                  <button 
                    className="w-8 h-8 bg-[#FFD600] rounded-full flex items-center justify-center shadow-sm shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inputText) {
                        handleNextFromInput();
                      } else {
                        setIsInputExpanded(true);
                      }
                    }}
                  >
                    {inputText ? <ArrowUp className="w-5 h-5 text-black" /> : <Plus className="w-5 h-5 text-black" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAV (Removed per user request) --- */}

      {/* --- CONDITIONS STEP --- */}
      <AnimatePresence>
        {currentTab === 'create' && step === 'conditions' && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end"
          >
            <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col">
              {/* Sticky Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                  <h2 className="text-lg font-bold text-gray-900">创作条件</h2>
                </div>
                <button 
                  onClick={() => setStep('home')}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-4">
                {/* Goals */}
                <div className="mb-8">
                  <div className="text-sm text-gray-500 mb-3">创作目标（可多选）</div>
                  <div className="flex flex-wrap gap-3">
                    {['涨粉', '建立人设', '引发共鸣', '教程', '记录生活', '分享观点', '带货', '引流'].map(g => (
                      <button 
                        key={g}
                        onClick={() => {
                          if (selectedGoals.includes(g)) {
                            setSelectedGoals(selectedGoals.filter(x => x !== g));
                          } else {
                            setSelectedGoals([...selectedGoals, g]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedGoals.includes(g) ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                      >
                        {formatGoalLabel(g)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div className="mb-8">
                  <div className="text-sm text-gray-500 mb-3">发布平台</div>
                  <div className="flex flex-wrap gap-3">
                    {['抖音', '小红书', 'B站', '快手', '微信视频号'].map(p => (
                      <button 
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedPlatform === p ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                      >
                        {formatPlatformLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lengths */}
                <div className="mb-8">
                  <div className="text-sm text-gray-500 mb-3">视频时长</div>
                  <div className="flex flex-wrap gap-3">
                    {['~15s', '~30s', '~60s', '1~3min', '3~5min', '5~10min', '10min+'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setSelectedLength(l)}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedLength === l ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                      >
                        {formatLengthLabel(l)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* More Conditions Toggle */}
                <div 
                  className="flex items-center gap-2 mb-6 cursor-pointer"
                  onClick={() => setIsMoreConditionsExpanded(!isMoreConditionsExpanded)}
                >
                  <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent transition-transform duration-300 ${isMoreConditionsExpanded ? 'border-t-[8px] border-t-black' : 'border-t-[8px] border-t-black -rotate-90'}`}></div>
                  <h2 className="text-base font-bold text-gray-900">
                    {isMoreConditionsExpanded ? '收起更多条件' : '更多创作条件'}
                  </h2>
                </div>

                {/* Expanded More Conditions */}
                <AnimatePresence>
                  {isMoreConditionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Audience */}
                      <div className="mb-8">
                        <div className="text-sm text-gray-500 mb-3">受众</div>
                        <div className="flex flex-wrap gap-3">
                          {['泛用户', '新手', '同行', '潜在客户', '有相似经历'].map(a => (
                            <button 
                              key={a}
                              onClick={() => setSelectedAudience(a)}
                              className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedAudience === a ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                            >
                              {formatAudienceLabel(a)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Appearance */}
                      <div className="mb-8">
                        <div className="text-sm text-gray-500 mb-3">出镜方式</div>
                        <div className="flex flex-wrap gap-3">
                          {['露脸', '不露脸', '虚拟形象'].map(a => (
                            <button 
                              key={a}
                              onClick={() => setSelectedAppearance(a)}
                              className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedAppearance === a ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                            >
                              {formatAppearanceLabel(a)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expression */}
                      <div className="mb-8">
                        <div className="text-sm text-gray-500 mb-3">表达方式</div>
                        <div className="flex flex-wrap gap-3">
                          {['口播', '画外音解说', '纯字幕+音乐'].map(e => (
                            <button 
                              key={e}
                              onClick={() => setSelectedExpression(e)}
                              className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedExpression === e ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                            >
                              {formatExpressionLabel(e)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Production */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-3">制作偏好</div>
                        <div className="flex flex-wrap gap-3">
                          {['低成本', '平衡', '高表现力'].map((p) => (
                            <button 
                              key={p}
                              onClick={() => setSelectedProduction(p)}
                              className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedProduction === p ? 'border border-[#FFD600] text-gray-900 bg-[#FFD600]/10 font-medium' : 'border border-gray-200 text-gray-600 bg-white'}`}
                            >
                              {formatProductionLabel(p)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                {apiError && (
                  <div className="mb-3 px-1 text-sm text-red-500">
                    {apiError}
                  </div>
                )}
                <button 
                  className={`w-full font-bold text-lg py-4 rounded-2xl shadow-sm transition-transform ${
                    isSubmittingApi1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#FFD600] text-gray-900 active:scale-95'
                  }`}
                  onClick={handleConfirmConditions}
                  disabled={isSubmittingApi1}
                >
                  {isSubmittingApi1 ? '正在分析创作条件...' : '确定'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PLANS STEP --- */}
      <AnimatePresence>
        {currentTab === 'create' && step === 'plans' && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed inset-0 bg-[#F7F8FA] z-50 flex flex-col"
          >
            {isGeneratingPlans ? (
              <div className="flex-1 flex flex-col items-center justify-center pb-20">
                <BouncingLogoLoader />
                <h3 className="text-gray-900 font-bold mb-2 text-lg">AI正在为您生成专属方案...</h3>
                <AiThinkingText 
                  texts={[
                    '正在分析您的创作特征...', 
                    '匹配目标受众偏好...', 
                    '生成多维度视频创意方案...'
                  ]} 
                />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="pt-safe mt-2 px-4 pb-4 flex items-center bg-white shadow-sm z-10">
                  <button onClick={() => setStep('conditions')} className="p-2 -ml-2">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <h1 className="text-lg font-bold text-gray-900 ml-2">方案选择</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-28">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">为您生成了3个方案</h2>
                    <p className="text-sm text-gray-500">基于主题："{displayTopic}"</p>
                  </div>

                  <div className="space-y-4">
                    {api2Error && (
                      <div className="px-1 text-sm text-red-500">
                        {api2Error}
                      </div>
                    )}

                    {!api2Error && planCards.length === 0 && !isGeneratingPlans && (
                      <div className="bg-white rounded-2xl p-5 text-sm text-gray-500 shadow-sm">
                        暂无方案，请返回上一步重新生成。
                      </div>
                    )}

                    {planCards.map(plan => (
                      <div 
                        key={plan.id} 
                        className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${selectedPlanId === plan.id ? 'border-[#FFD600] shadow-md' : 'border-transparent shadow-sm'}`}
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setExpandedPlanId(plan.id);
                        }}
                      >
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-base font-bold text-gray-900 flex-1 pr-4">{plan.title}</h3>
                            <div className="flex flex-col items-end">
                              <div className="text-xs text-gray-400 mb-0.5">AI推荐指数</div>
                              <div className="text-lg font-black text-[#FFD600]">{plan.recommendationIndex}</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {plan.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <AnimatePresence>
                            {expandedPlanId === plan.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 border-t border-gray-50 space-y-3">
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {plan.description}
                                  </p>
                                  <div className="text-xs text-gray-500 leading-relaxed">
                                    <span className="font-medium text-gray-700">适合：</span>
                                    {(plan as any).selectionReason ?? (plan as any).description ?? ''}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(((plan as any).structureHighlights ?? []) as string[]).map((item, idx) => (
                                      <span
                                        key={`${plan.id}-${idx}`}
                                        className="px-2 py-1 bg-[#FFD600]/8 text-[#8A7400] text-xs rounded-md"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {expandedPlanId !== plan.id && (
                            <div className="text-xs text-gray-400 flex items-center justify-center mt-2 pt-2 border-t border-gray-50">
                              点击展开查看更多 <ChevronDown className="w-3 h-3 ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
                  <button 
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${selectedPlanId && !isGeneratingPlans ? 'bg-[#FFD600] text-gray-900 shadow-sm active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    disabled={!selectedPlanId || isGeneratingPlans}
                    onClick={() => {
                      setPageEntrySource('live');
                      setHistoryOpenedProjectId(null);
                      setApi3Result(null);
                      setApi3Error('');
                      setStep('script');
                    }}
                  >
                    {isGeneratingPlans ? '正在生成方案...' : '生成完整版'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SCRIPT STEP --- */}
      <AnimatePresence>
        {currentTab === 'create' && step === 'script' && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed inset-0 bg-[#F7F8FA] z-50 flex flex-col"
          >
            {isGeneratingScript ? (
              <div className="flex-1 flex flex-col items-center justify-center pb-20">
                <BouncingLogoLoader />
                <h3 className="text-gray-900 font-bold mb-2 text-lg">
                  {inputMode === 'script' ? 'AI正在生成专业脚本...' : 'AI正在生成创作指令...'}
                </h3>
                <AiThinkingText 
                  texts={inputMode === 'script' ? [
                    '正在解构视频镜头...',
                    '匹配分镜画面细节...',
                    '优化台词与配乐节奏...',
                    '排版专业分镜脚本...'
                  ] : [
                    '正在转化您的输入条件...',
                    '精调 Midjourney 提示词...',
                    '设定可灵动态参数...',
                    '生成分步 AI 创作流...'
                  ]} 
                />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="pt-safe mt-2 px-4 pb-4 flex items-center justify-between bg-white shadow-sm z-10">
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        if (pageEntrySource === 'history') {
                          setCurrentTab('projects');
                          setStep('home');
                          setPageEntrySource('live');
                          setHistoryOpenedProjectId(null);
                          return;
                        }

                        const current = historyItems.find((item) => item.id === activeProjectId);
                        if (current?.snapshot) {
                          restoreSnapshotToState(current.snapshot, 'plans');
                        } else {
                          setIsGeneratingPlans(false);
                          setStep('plans');
                        }
                      }}
                      className="p-2 -ml-2"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 ml-2">
                      {inputMode === 'script' ? '完整脚本' : 'AI创作指令'}
                    </h1>
                  </div>
                  <button 
                    onClick={() => {
                      setStep('home');
                      setInputText('');
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-colors active:scale-95"
                  >
                    <Home className="w-3.5 h-3.5" />
                    首页
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-24">
                  {/* Summary Card (Expandable) */}
                  <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 transition-colors"
                      onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="shrink-0 px-2 py-1 bg-[#FFD600]/10 text-[#D4B000] text-xs font-bold rounded-md">已选方案</span>
                        <h2 className="text-sm font-bold text-gray-900 truncate">{selectedPlan?.title || '未选择方案'}</h2>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-2">
                        {isSummaryExpanded ? '收起' : '展开条件'}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isSummaryExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-50">
                            <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs bg-gray-50 p-4 rounded-xl mt-3 text-gray-400">
                              <span>· {selectedGoals.map(formatGoalLabel).join(' · ')}</span>
                              <span>· {formatPlatformLabel(selectedPlatform)}</span>
                              <span>· {formatLengthLabel(normalizeLengthValue(selectedLength))}</span>
                              {isMoreConditionsExpanded && (
                                <>
                                  <span>· {formatAudienceLabel(selectedAudience)}</span>
                                  <span>· {formatAppearanceLabel(selectedAppearance)}</span>
                                  <span>· {formatExpressionLabel(selectedExpression)}</span>
                                  <span>
                                    · {formatProductionLabel(normalizeProductionValue(selectedProduction))}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {api3Error && (
                    <div className="mb-4 px-1 text-sm text-red-500">
                      {api3Error}
                    </div>
                  )}

                  {/* Script Content */}
                  {inputMode === 'script' ? (
                    <div className="space-y-6">
                      {/* Detailed Script */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                            <h3 className="text-base font-bold text-gray-900">分镜头脚本</h3>
                            {!isEditingScript && (
                              <button onClick={() => setIsEditingScript(true)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {isEditingScript ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setIsEditingScript(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <button onClick={() => setIsEditingScript(false)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <button 
                                onClick={() => setShowExportMenu(!showExportMenu)} 
                                className="text-xs font-medium text-gray-600 px-3 py-1.5 bg-gray-100 rounded-full active:scale-95 transition-transform flex items-center gap-1"
                              >
                                导出 <ChevronDown className="w-3 h-3" />
                              </button>
                              {showExportMenu && (
                                <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                  <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                    onClick={() => {
                                      void exportScriptAsJPG();
                                      setShowExportMenu(false);
                                    }}
                                  >
                                    JPG
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                    onClick={() => {
                                      exportScriptAsPDF();
                                      setShowExportMenu(false);
                                    }}
                                  >
                                    PDF
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                    onClick={() => {
                                      exportScriptAsCSV();
                                      setShowExportMenu(false);
                                    }}
                                  >
                                    Excel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="overflow-x-auto -mx-5 px-5 pb-2">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 whitespace-nowrap w-12">镜号</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 whitespace-nowrap w-20">时间轴</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 min-w-[150px]">画面描述</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 whitespace-nowrap w-16">机位</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 whitespace-nowrap w-20">摄法</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 whitespace-nowrap w-20">景别</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 min-w-[150px]">台词</th>
                                <th className="py-3 px-2 text-xs font-bold text-gray-900 min-w-[100px]">音效</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {scriptTableData.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <input 
                                        type="text" 
                                        value={row.scene} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].scene = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                      />
                                    ) : row.scene}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <input 
                                        type="text" 
                                        value={row.time} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].time = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                      />
                                    ) : row.time}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-700 align-top">
                                    {isEditingScript ? (
                                      <textarea 
                                        value={row.visual} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].visual = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600] min-h-[60px] resize-y"
                                      />
                                    ) : row.visual}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <input 
                                        type="text" 
                                        value={row.cameraPos} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].cameraPos = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                      />
                                    ) : row.cameraPos}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <input 
                                        type="text" 
                                        value={row.cameraMove} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].cameraMove = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                      />
                                    ) : row.cameraMove}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <input 
                                        type="text" 
                                        value={row.shotSize} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].shotSize = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                      />
                                    ) : row.shotSize}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-900 font-medium align-top">
                                    {isEditingScript ? (
                                      <textarea 
                                        value={row.dialogue} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].dialogue = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600] min-h-[60px] resize-y"
                                      />
                                    ) : row.dialogue}
                                  </td>
                                  <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                    {isEditingScript ? (
                                      <textarea 
                                        value={row.sound} 
                                        onChange={(e) => {
                                          const newData = [...scriptTableData];
                                          newData[index].sound = e.target.value;
                                          setScriptTableData(newData);
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600] min-h-[60px] resize-y"
                                      />
                                    ) : row.sound}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Structure */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                          <h3 className="text-base font-bold text-gray-900">内容结构</h3>
                        </div>
                        <div className="space-y-3">
                          {(api3SegmentGroups.length > 0 ? api3SegmentGroups : [
                            { segment_name: '开头片段', segment_summary: '先建立注意力，再快速进入主题。' },
                            { segment_name: '主体片段', segment_summary: '中间展开重点内容，给出具体信息。' },
                            { segment_name: '结尾片段', segment_summary: '最后收束内容，形成记忆点。' }
                          ]).map((segment, idx) => (
                            <div key={`${segment.segment_name}-${idx}`} className="flex gap-3">
                              <div className="w-5 h-5 rounded-full bg-[#FFD600]/20 text-[#D4B000] flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{segment.segment_name}</p>
                                <p className="text-sm text-gray-700">{segment.segment_summary}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-amber-50 rounded-2xl p-5 shadow-sm border border-amber-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-amber-500">🎬</span>
                          <h3 className="text-base font-bold text-amber-900">拍摄提醒</h3>
                        </div>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                            不要太像讲解员，语气要像在和朋友分享感受。
                          </li>
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                            镜头移动节奏要慢，给观众留出看清细节的时间。
                          </li>
                          <li className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                            开头说完第一句话后，停顿 2 秒再切全景画面。
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* AI Command */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                            <h3 className="text-base font-bold text-gray-900">分段 AI 指令</h3>
                            {!isEditingAi && (
                              <button onClick={() => setIsEditingAi(true)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {isEditingAi ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setIsEditingAi(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <button onClick={() => setIsEditingAi(false)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleCopyAllAiSegments()}
                              className="flex items-center gap-1 text-xs font-medium text-gray-600 px-3 py-1.5 bg-gray-100 rounded-full active:scale-95 transition-transform"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              一键全部复制
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {aiSegments.map((segment, idx) => (
                            <div key={segment.id} className="bg-gray-50 p-4 rounded-xl relative group">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-bold text-gray-900">{segment.title}</div>
                                {!isEditingAi && (
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyAiSegment(segment, idx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    复制
                                  </button>
                                )}
                              </div>
                              {isEditingAi ? (
                                <textarea 
                                  value={segment.content}
                                  onChange={(e) => {
                                    const newData = [...aiSegments];
                                    newData[idx].content = e.target.value;
                                    setAiSegments(newData);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:border-[#FFD600] min-h-[80px] resize-y font-mono"
                                />
                              ) : (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                                  {segment.content}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Tools */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                          <h3 className="text-base font-bold text-gray-900">推荐 AI 工具与模型</h3>
                        </div>
                        <div className="space-y-3">
                          {recommendedAiTools.map((tool, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 border border-gray-50 rounded-xl bg-gray-50/50">
                              <div className="w-8 h-8 rounded-lg bg-[#FFD600]/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Cpu className="w-4 h-4 text-[#D4B000]" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm mb-1">{tool.name}</div>
                                <div className="text-xs text-gray-500 leading-relaxed">{tool.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PROJECTS (HISTORY) TAB --- */}
      <AnimatePresence>
        {currentTab === 'projects' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#F7F8FA] overflow-y-auto pb-32 z-10"
          >
            {/* Header */}
            <div className="pt-safe mt-4 px-6 pb-4 flex justify-between items-center">
               <h1 className="text-xl font-bold text-gray-900">历史记录</h1>
               {historyItems.length > 0 && (
                 <button onClick={() => setShowClearConfirm(true)} className="text-sm text-gray-500 flex items-center gap-1 active:scale-95">
                    <Trash2 className="w-4 h-4" />清空
                 </button>
               )}
            </div>
            
            <div className="px-6 mb-4">
              <div className="flex gap-1 bg-white shadow-sm border border-gray-100 p-1 rounded-full relative w-fit">
                 <button
                   onClick={() => setHistoryType('script')}
                   className={`px-4 py-2 rounded-full text-sm transition-colors ${historyType === 'script' ? 'font-bold text-gray-900 bg-[#F7F8FA] shadow-sm' : 'text-gray-500'}`}
                 >
                   专业脚本
                 </button>
                 <button
                   onClick={() => setHistoryType('command')}
                   className={`px-4 py-2 rounded-full text-sm transition-colors ${historyType === 'command' ? 'font-bold text-gray-900 bg-[#F7F8FA] shadow-sm' : 'text-gray-500'}`}
                 >
                   AI指令
                 </button>
              </div>
            </div>

            <div className="px-6 space-y-3">
              {historyItems.filter(item => item.type === historyType).length === 0 ? (
                 <div className="text-center py-10 text-gray-400 text-sm">暂无记录</div>
              ) : (
                 historyItems.filter(item => item.type === historyType).map(item => (
                   <div 
                     key={item.id} 
                     onClick={() => {
                       if (!item.snapshot) return;
                       setPageEntrySource('history');
                       setHistoryOpenedProjectId(item.id);
                       setActiveProjectId(item.id);
                       skipOneScriptGenerationRef.current = true;
                       setCurrentTab('create');
                       restoreSnapshotToState(item.snapshot, 'script');
                     }}
                     className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform"
                   >
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 pr-4">{item.title}</h3>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                     </div>
                     <div className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                     </div>
                   </div>
                 ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HISTORY DETAIL VIEW --- */}
      <AnimatePresence>
        {viewingHistoryId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-[#F7F8FA] z-50 flex flex-col"
          >
            {(() => {
              const item = historyItems.find(i => i.id === viewingHistoryId);
              if (!item) return null;

              const scriptRows =
                item.snapshot?.scriptTableData?.length ? item.snapshot.scriptTableData : item.content;
              const aiRows =
                item.snapshot?.aiSegments?.length ? item.snapshot.aiSegments : item.content;
              const historyTitle =
                item.snapshot?.displayTopic ||
                item.snapshot?.originalTopic ||
                item.snapshot?.topic ||
                item.title;
              const updateHistoryScriptField = (idx: number, field: string, value: string) => {
                const newItems = [...historyItems];
                const ir = newItems.find((i) => i.id === item.id);
                if (!ir) return;
                if (ir.content?.[idx]) (ir.content[idx] as Record<string, string>)[field] = value;
                if (ir.snapshot?.scriptTableData?.[idx])
                  (ir.snapshot.scriptTableData[idx] as Record<string, string>)[field] = value;
                setHistoryItems(newItems);
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newItems));
              };

              return (
                <>
                  <div className="pt-safe mt-2 px-4 pb-4 flex items-center justify-between bg-white shadow-sm z-10 shrink-0">
                    <div className="flex items-center">
                      <button onClick={() => setViewingHistoryId(null)} className="p-2 -ml-2">
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                      <h1 className="text-lg font-bold text-gray-900 ml-2">
                         {item.type === 'script' ? '脚本详情' : '指令详情'}
                      </h1>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 pb-12">
                     <div className="mb-4">
                        <h2 className="text-base font-bold text-gray-900">{historyTitle}</h2>
                        <div className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</div>
                     </div>
                     {item.type === 'script' ? (
                       <div className="bg-white rounded-2xl p-5 shadow-sm overflow-hidden">
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                             <h3 className="text-base font-bold text-gray-900">分镜头脚本</h3>
                             {!isEditingHistoryScript && (
                               <button onClick={() => setIsEditingHistoryScript(true)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                           {isEditingHistoryScript ? (
                             <div className="flex items-center gap-2">
                               <button onClick={() => setIsEditingHistoryScript(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                 <X className="w-4 h-4" />
                               </button>
                               <button onClick={() => setIsEditingHistoryScript(false)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                 <Save className="w-4 h-4" />
                               </button>
                             </div>
                           ) : (
                             <div className="relative">
                               <button 
                                 onClick={() => setHistoryExportMenu(!historyExportMenu)} 
                                 className="text-xs font-medium text-gray-600 px-3 py-1.5 bg-gray-100 rounded-full active:scale-95 transition-transform flex items-center gap-1"
                               >
                                 导出 <ChevronDown className="w-3 h-3" />
                               </button>
                               {historyExportMenu && (
                                 <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                   <button
                                     type="button"
                                     className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                     onClick={() => {
                                       void exportScriptAsJPG(scriptRows, historyTitle);
                                       setHistoryExportMenu(false);
                                     }}
                                   >
                                     JPG
                                   </button>
                                   <button
                                     type="button"
                                     className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                     onClick={() => {
                                       exportScriptAsPDF(scriptRows, historyTitle);
                                       setHistoryExportMenu(false);
                                     }}
                                   >
                                     PDF
                                   </button>
                                   <button
                                     type="button"
                                     className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                     onClick={() => {
                                       exportScriptAsCSV(scriptRows, historyTitle);
                                       setHistoryExportMenu(false);
                                     }}
                                   >
                                     Excel
                                   </button>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>

                        <div className="overflow-x-auto -mx-5 px-5 pb-2">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                               <thead>
                                 <tr className="border-b border-gray-100">
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 w-12">镜号</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 w-20">时间轴</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 min-w-[150px]">画面描述</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 w-16">机位</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 w-20">摄法</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 w-20">景别</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 min-w-[150px]">台词</th>
                                   <th className="py-2 px-2 text-xs font-bold text-gray-900 min-w-[100px]">音效</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-50">
                                 {scriptRows.map((row: any, idx: number) => (
                                   <tr key={row.id ?? idx} className="hover:bg-gray-50/50">
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                       {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.scene} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'scene', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.scene}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                        {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.time} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'time', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.time}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-700 align-top">
                                        {isEditingHistoryScript ? (
                                         <textarea 
                                           value={row.visual} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'visual', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600] min-h-[60px] resize-y"
                                         />
                                       ) : row.visual}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                        {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.cameraPos} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'cameraPos', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.cameraPos}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                        {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.cameraMove} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'cameraMove', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.cameraMove}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                        {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.shotSize} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'shotSize', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.shotSize}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-900 font-medium align-top">
                                        {isEditingHistoryScript ? (
                                         <textarea 
                                           value={row.dialogue} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'dialogue', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600] min-h-[60px] resize-y"
                                         />
                                       ) : row.dialogue}
                                     </td>
                                     <td className="py-3 px-2 text-xs text-gray-500 align-top">
                                        {isEditingHistoryScript ? (
                                         <input 
                                           type="text" 
                                           value={row.sound} 
                                           onChange={(e) => {
                                             updateHistoryScriptField(idx, 'sound', e.target.value);
                                           }}
                                           className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD600]"
                                         />
                                       ) : row.sound}
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                            </table>
                        </div>
                       </div>
                     ) : (
                       <div className="bg-white rounded-2xl p-5 shadow-sm">
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-4 bg-[#FFD600] rounded-full"></div>
                             <h3 className="text-base font-bold text-gray-900">分段 AI 指令</h3>
                           </div>
                           <button
                             type="button"
                             onClick={() => void handleCopyAllAiSegments(aiRows)}
                             className="flex items-center gap-1 text-xs font-medium text-gray-600 px-3 py-1.5 bg-gray-100 rounded-full active:scale-95 transition-transform"
                           >
                             <Copy className="w-3.5 h-3.5" />
                             一键全部复制
                           </button>
                         </div>
                         <div className="space-y-4">
                           {aiRows.map((segment: any, segIdx: number) => (
                              <div key={segment.id} className="bg-gray-50 p-4 rounded-xl relative group">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-bold text-gray-900">{segment.title}</div>
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyAiSegment(segment, segIdx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    复制
                                  </button>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                                  {segment.content}
                                </div>
                              </div>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CLEAR CONFIRM OVERLAY --- */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-6"
            onClick={() => setShowClearConfirm(false)}
          >
             <motion.div 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
               onClick={e => e.stopPropagation()}
             >
               <h3 className="text-lg font-bold text-gray-900 mb-2">清空历史记录</h3>
               <p className="text-sm text-gray-500 mb-6">确定要清空全部历史记录吗？此操作不可恢复。</p>
               <div className="flex gap-3">
                 <button 
                   onClick={() => setShowClearConfirm(false)}
                   className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:bg-gray-200 transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={() => {
                     setHistoryItems([]);
                     localStorage.removeItem(HISTORY_STORAGE_KEY);
                     localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
                     setActiveProjectId(null);
                     setShowClearConfirm(false);
                   }}
                   className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm active:bg-red-100 transition-colors"
                 >
                   确定清空
                 </button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BOTTOM NAV --- */}
      {((currentTab === 'create' && step === 'home') || currentTab !== 'create') && !viewingHistoryId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-around items-center pt-3 pb-safe z-40">
          <div
            className="flex flex-col items-center gap-1 cursor-pointer px-4"
            onClick={() => setCurrentTab('create')}
          >
            <Sparkles className={`w-6 h-6 ${currentTab === 'create' ? 'text-gray-900' : 'text-gray-400'}`} />
            <span className={`text-[10px] font-medium ${currentTab === 'create' ? 'text-gray-900' : 'text-gray-400'}`}>创作</span>
          </div>
          <div
            className="flex flex-col items-center gap-1 cursor-pointer px-4"
            onClick={() => setCurrentTab('projects')}
          >
            <Folder className={`w-6 h-6 ${currentTab === 'projects' ? 'text-gray-900' : 'text-gray-400'}`} />
            <span className={`text-[10px] font-medium ${currentTab === 'projects' ? 'text-gray-900' : 'text-gray-400'}`}>项目</span>
          </div>
        </div>
      )}

    </div>
  );
}