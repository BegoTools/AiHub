import { Tool } from '../types';
import { Workflow } from '../types/workflowTypes';

export interface ScoredItem {
  id: string;
  title: string;
  description: string;
  score: number;
}

export interface IntentResult {
  type: 'tool_match' | 'workflow_match' | 'direct_chat';
  matchedTools: ScoredItem[];
  matchedWorkflows: ScoredItem[];
  confidence: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ًٌٍَُِّْ،؟!\.;,]/g, '')
    .replace(/[آإأ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(t => t.length > 1);
}

function scoreTokens(queryTokens: string[], targetTokens: string[]): number {
  let matches = 0;
  for (const qt of queryTokens) {
    for (const tt of targetTokens) {
      if (tt.includes(qt) || qt.includes(tt)) {
        matches += qt.length / tt.length;
        break;
      }
    }
  }
  return matches / Math.max(queryTokens.length, 1);
}

const intentKeywords: Record<string, string[]> = {
  summarize: ['لخص', 'تلخيص', 'ملخص', 'موجز', 'اختصار', 'summarize', 'summary'],
  explain: ['اشرح', 'شرح', 'مبسط', 'فهم', 'explain', 'simplify'],
  write: ['كتب', 'كتابة', 'مقال', 'موضوع', 'write', 'article', 'essay'],
  ad: ['إعلان', 'اعلان', 'إعلانات', 'ad', 'advertisement', 'promote'],
  email: ['إيميل', 'بريد', 'email', 'mail'],
  cv: ['سيرة', 'ذاتية', 'cv', 'resume', 'curriculum'],
  translate: ['ترجم', 'ترجمة', 'translation', 'translate'],
  code: ['كود', 'برمجة', 'code', 'programming', 'develop'],
  marketing: ['تسويق', 'حملة', 'marketing', 'campaign'],
  project: ['مشروع', 'project', 'business', 'startup'],
  plan: ['خطة', 'plan', 'schedule', 'جدول', 'مذاكرة'],
  product: ['منتج', 'product', 'description', 'وصف'],
  social: ['بوست', 'منشور', 'فيسبوك', 'تيك توك', 'post', 'facebook', 'social'],
  analysis: ['تحليل', 'analysis', 'decision', 'قرار'],
  reply: ['رد', 'عميل', 'client', 'customer', 'reply'],
  tool: ['اصنع', 'صنع', 'أنشئ', 'أنشاء', 'create', 'build', 'make', 'أداة', 'اداة', 'tool'],
};

export function isToolCreationIntent(text: string): boolean {
  const creationKeywords = [
    'اصنع', 'صنع', 'أنشئ', 'أنشاء', 'إنشاء',
    'create', 'build', 'make', 'construct',
    'أداة', 'اداة', 'tool', 'اداه',
    'اعمل', 'عمل', 'do', 'make',
  ];
  const normalized = normalize(text);
  const hasCreationVerb = creationKeywords.some(kw => normalized.includes(kw));
  const hasToolNoun = ['أداة', 'اداة', 'اداه', 'tool', 'tools'].some(kw => normalized.includes(kw));
  return hasCreationVerb && hasToolNoun;
}

function detectIntents(query: string): string[] {
  const tokens = tokenize(query);
  const detected: string[] = [];
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const token of tokens) {
      for (const kw of keywords) {
        const normalizedKw = normalize(kw);
        if (token === normalizedKw || normalizedKw.includes(token) || token.includes(normalizedKw)) {
          detected.push(intent);
          break;
        }
      }
      if (detected.includes(intent)) break;
    }
  }
  return detected;
}

export function analyzeIntent(
  query: string,
  allTools: Tool[],
  allWorkflows: Workflow[]
): IntentResult {
  const intents = detectIntents(query);
  const queryTokens = tokenize(query);

  const scoredTools: ScoredItem[] = allTools.map(tool => {
    const titleTokens = tokenize(tool.title);
    const descTokens = tokenize(tool.description);
    const catTokens = tokenize(tool.categoryId || '');

    const titleScore = scoreTokens(queryTokens, titleTokens) * 0.5;
    const descScore = scoreTokens(queryTokens, descTokens) * 0.3;
    const catScore = scoreTokens(queryTokens, catTokens) * 0.1;

    const intentScore = intents.length > 0
      ? (intents.some(i => tool.title.includes(i) || tool.categoryId.includes(i)) ? 0.3 : 0)
      : 0;

    const totalScore = Math.min(titleScore + descScore + catScore + intentScore, 1);
    return {
      id: tool.id,
      title: tool.title,
      description: tool.description,
      score: Math.round(totalScore * 100) / 100,
    };
  });

  const scoredWorkflows: ScoredItem[] = allWorkflows.map(wf => {
    const titleTokens = tokenize(wf.title);
    const descTokens = tokenize(wf.description);
    const catTokens = tokenize(wf.category || '');

    const titleScore = scoreTokens(queryTokens, titleTokens) * 0.5;
    const descScore = scoreTokens(queryTokens, descTokens) * 0.3;
    const catScore = scoreTokens(queryTokens, catTokens) * 0.1;

    const stepsText = wf.steps.map(s => s.title + ' ' + s.description).join(' ');
    const stepsTokens = tokenize(stepsText);
    const stepsScore = scoreTokens(queryTokens, stepsTokens) * 0.1;

    const totalScore = Math.min(titleScore + descScore + catScore + stepsScore, 1);
    return {
      id: wf.id,
      title: wf.title,
      description: wf.description,
      score: Math.round(totalScore * 100) / 100,
    };
  });

  const bestScored = [...scoredTools, ...scoredWorkflows]
    .filter(s => s.score > 0.2)
    .sort((a, b) => b.score - a.score);

  const hasToolIntent = intents.some(i => i === 'tool');

  if (hasToolIntent && bestScored.filter(s => s.score < 0.3).length > 0) {
    return {
      type: 'direct_chat',
      matchedTools: scoredTools.filter(t => t.score > 0.1).slice(0, 3),
      matchedWorkflows: scoredWorkflows.filter(w => w.score > 0.1).slice(0, 3),
      confidence: 0.3,
    };
  }

  if (bestScored.length === 0) {
    return {
      type: 'direct_chat',
      matchedTools: [],
      matchedWorkflows: [],
      confidence: 0,
    };
  }

  const topScore = bestScored[0].score;
  const topTools = scoredTools.filter(t => t.score === topScore);
  const topWorkflows = scoredWorkflows.filter(w => w.score === topScore);

  if (topTools.length > 0 && topScore >= 0.3) {
    return {
      type: 'tool_match',
      matchedTools: scoredTools.filter(t => t.score > 0.2).slice(0, 5),
      matchedWorkflows: scoredWorkflows.filter(w => w.score > 0.2).slice(0, 3),
      confidence: topScore,
    };
  }

  if (topWorkflows.length > 0 && topScore >= 0.3) {
    return {
      type: 'workflow_match',
      matchedTools: scoredTools.filter(t => t.score > 0.2).slice(0, 3),
      matchedWorkflows: scoredWorkflows.filter(w => w.score > 0.2).slice(0, 5),
      confidence: topScore,
    };
  }

  return {
    type: 'direct_chat',
    matchedTools: scoredTools.filter(t => t.score > 0.1).slice(0, 3),
    matchedWorkflows: scoredWorkflows.filter(w => w.score > 0.1).slice(0, 3),
    confidence: topScore,
  };
}

export function getSuggestionsForResponse(language: string): { label: string; action: string }[] {
  const isAr = language === 'ar';
  return [
    { label: isAr ? '✂️ اختصر الرد' : '✂️ Shorten', action: 'shorten' },
    { label: isAr ? '🎩 خليه رسمي' : '🎩 Make formal', action: 'formal' },
    { label: isAr ? '🇪🇬 باللهجة المصرية' : '🇪🇬 Egyptian dialect', action: 'egyptian' },
    { label: isAr ? '📊 حوله لجدول' : '📊 To table', action: 'table' },
    { label: isAr ? '📋 اعمل خطة' : '📋 Make plan', action: 'plan' },
    { label: isAr ? '💾 احفظ النتيجة' : '💾 Save result', action: 'save' },
  ];
}
