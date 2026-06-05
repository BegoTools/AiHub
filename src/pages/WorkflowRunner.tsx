import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Play, Sparkles, RefreshCw, Save,
  FileText, ListChecks, HelpCircle, RotateCcw
} from 'lucide-react';
import { Workflow, WorkflowStep, WorkflowState } from '../types/workflowTypes';
import { WorkflowProgress } from '../types/storageTypes';
import { getWorkflowById } from '../data/workflows';
import { generateAIContent } from '../services/aiService';
import { saveWorkflowProgress, getWorkflowProgress, clearWorkflowProgress } from '../services/workflowsService';
import { DynamicIcon } from '../components/ToolForm';

interface WorkflowRunnerProps {
  workflowId: string | null;
  t: any;
  language: string;
  settings: any;
  onBack: () => void;
}

export default function WorkflowRunner({ workflowId, t, language, settings, onBack }: WorkflowRunnerProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [generatedOutputs, setGeneratedOutputs] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (workflowId) {
      const wf = getWorkflowById(workflowId);
      setWorkflow(wf || null);
      if (wf) {
        loadProgress(wf.id);
      }
      setIsLoaded(true);
    }
  }, [workflowId]);

  const loadProgress = async (id: string) => {
    const saved = await getWorkflowProgress(id);
    if (saved) {
      setCurrentStepIndex(saved.currentStep);
      setCompletedSteps(saved.completedSteps);
      setCollectedData(saved.data || {});
      setGeneratedOutputs(saved.generatedOutputs || {});
      setInputValues(saved.data || {});
    }
  };

  const saveProgress = async () => {
    if (!workflow) return;
    const progress: WorkflowProgress = {
      workflowId: workflow.id,
      currentStep: currentStepIndex,
      completedSteps,
      data: { ...collectedData, ...inputValues },
      generatedOutputs,
      updatedAt: new Date().toISOString(),
    };
    await saveWorkflowProgress(workflow.id, progress);
  };

  useEffect(() => {
    if (workflow && isLoaded) {
      saveProgress();
    }
  }, [currentStepIndex, completedSteps, collectedData, inputValues]);

  const currentStep: WorkflowStep | null = workflow?.steps[currentStepIndex] || null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === (workflow?.steps.length || 1) - 1;
  const progress = workflow ? Math.round(((currentStepIndex + 1) / workflow.steps.length) * 100) : 0;

  const handleInputChange = (id: string, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = async () => {
    if (!currentStep || !workflow) return;

    if (currentStep.type === 'generate') {
      setIsGenerating(true);
      setGenerationError(null);
      try {
        let template = currentStep.promptTemplate || '';
        const allData = { ...collectedData, ...inputValues };
        Object.entries(allData).forEach(([key, val]) => {
          template = template.replace(new RegExp(`{{${key}}}`, 'g'), val);
        });
        const result = await generateAIContent(template, settings);
        setGeneratedOutputs(prev => ({ ...prev, [currentStep.id]: result }));
        setCollectedData(prev => ({ ...prev, ...allData }));
        markComplete();
        if (currentStepIndex < workflow.steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        }
      } catch (err: any) {
        setGenerationError(err.message || 'حدث خطأ أثناء التوليد');
      }
      setIsGenerating(false);
    } else if (currentStep.type === 'result') {
      markComplete();
    } else {
      markComplete();
      if (currentStepIndex < workflow.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const markComplete = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps(prev => [...prev, currentStepIndex]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setCollectedData({});
    setGeneratedOutputs({});
    setInputValues({});
    if (workflow) clearWorkflowProgress(workflow.id);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-blue-500"><Sparkles size={32} /></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
        <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{t.workflowNotFound || 'الرحلة غير موجودة'}</h4>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs bg-blue-600 text-white rounded-xl">{t.back || 'رجوع'}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-zinc-400">
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{workflow.icon}</span>
              <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{workflow.title}</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{workflow.description}</p>
          </div>
        </div>
        <button onClick={handleReset} className="px-3 py-2 text-[10px] font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer">
          <RotateCcw size={12} />
          {t.reset || 'إعادة'}
        </button>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-1">
        <div className="flex items-center gap-1">
          {workflow.steps.map((step, idx) => (
            <div key={step.id} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${
                completedSteps.includes(idx) ? 'bg-emerald-500' :
                idx === currentStepIndex ? 'bg-blue-500 animate-pulse' :
                'bg-slate-200 dark:bg-zinc-700'
              }`} />
              {idx < workflow.steps.length - 1 && <span className="text-slate-300 dark:text-zinc-700">·</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-[10px] text-slate-500 dark:text-zinc-500">{Math.min(currentStepIndex + 1, workflow.steps.length)}/{workflow.steps.length}</span>
          <span className="text-[10px] text-slate-500 dark:text-zinc-500">{t.estimatedTime}: {workflow.estimatedTime}</span>
        </div>
      </div>

      {generationError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs">{generationError}</div>
      )}

      {currentStep && (
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className={`p-2.5 rounded-xl ${
              currentStep.type === 'input' ? 'bg-blue-500/10 text-blue-600' :
              currentStep.type === 'generate' ? 'bg-amber-500/10 text-amber-600' :
              currentStep.type === 'select' ? 'bg-purple-500/10 text-purple-600' :
              'bg-emerald-500/10 text-emerald-600'
            }`}>
              {currentStep.type === 'input' ? <FileText size={20} /> :
               currentStep.type === 'generate' ? <Sparkles size={20} /> :
               currentStep.type === 'select' ? <ListChecks size={20} /> :
               <Check size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">{currentStep.title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{currentStep.description}</p>
            </div>
          </div>

          {(currentStep.type === 'input' || currentStep.type === 'select') && currentStep.inputField && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{currentStep.inputField.label}</label>
              {currentStep.inputField.type === 'textarea' ? (
                <textarea
                  value={inputValues[currentStep.id] || ''}
                  onChange={(e) => handleInputChange(currentStep.id, e.target.value)}
                  placeholder={currentStep.inputField.placeholder}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all resize-none"
                />
              ) : currentStep.inputField.type === 'select' && currentStep.inputField.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentStep.inputField.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleInputChange(currentStep.id, opt.value)}
                      className={`p-3 text-xs font-semibold rounded-xl border text-right transition-all cursor-pointer ${
                        inputValues[currentStep.id] === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-blue-500/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={inputValues[currentStep.id] || ''}
                  onChange={(e) => handleInputChange(currentStep.id, e.target.value)}
                  placeholder={currentStep.inputField.placeholder}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 transition-all"
                />
              )}
            </div>
          )}

          {currentStep.type === 'generate' && generatedOutputs[currentStep.id] && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Check size={16} />
                {t.generatedSuccessfully || 'تم التوليد بنجاح'}
              </h4>
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {generatedOutputs[currentStep.id]}
              </div>
            </div>
          )}

          {currentStep.type === 'result' && (
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl text-center">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block mb-3">
                  <Check size={32} />
                </div>
                <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">{t.workflowComplete || 'أحسنت! الرحلة اكتملت 🎉'}</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">{t.workflowCompleteDesc || 'لقد أكملت جميع خطوات الرحلة بنجاح'}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={handleReset} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw size={12} />
                  {t.startOver || 'ابدأ من جديد'}
                </button>
                <button onClick={onBack} className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer">
                  {t.backToWorkflows || 'العودة للرحلات'}
                </button>
              </div>
              {Object.entries(generatedOutputs).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{t.generatedResults || 'النتائج المولدة'}</h4>
                  {Object.entries(generatedOutputs).map(([stepId, output]) => {
                    const step = workflow.steps.find(s => s.id === stepId);
                    return (
                      <div key={stepId} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                        <h5 className="font-bold text-xs text-slate-600 dark:text-zinc-400 mb-2">{step?.title || stepId}</h5>
                        <div className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">{output}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep.type !== 'result' && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={handleBack}
                disabled={isFirstStep}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFirstStep
                    ? 'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <ArrowRight size={14} className="rtl:rotate-0 rotate-180" />
                {t.back || 'السابق'}
              </button>

              {currentStep.type === 'generate' && !generatedOutputs[currentStep.id] ? (
                <button
                  onClick={handleNext}
                  disabled={isGenerating}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <><RefreshCw size={14} className="animate-spin" /> {t.generating || 'جارٍ التوليد...'}</>
                  ) : (
                    <><Play size={14} /> {t.generate || 'توليد'}</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentStep.type === 'input' && !inputValues[currentStep.id]}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLastStep ? (t.finish || 'إنهاء') : (t.next || 'التالي')}
                  <ArrowLeft size={14} className="rtl:rotate-0 rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
