import AiChatAssistant from '../components/AiChatAssistant';
import { Tool } from '../types';
import { Workflow } from '../types/workflowTypes';

interface AssistantPageProps {
  t: any;
  language: string;
  allTools: Tool[];
  workflows: Workflow[];
  onOpenTool: (toolId: string) => void;
  onOpenWorkflow: (wfId: string) => void;
  onAddCustomTool: (tool: any) => void;
  onOpenAuth: (msg: string) => void;
}

export default function AssistantPage({ t, language, allTools, workflows, onOpenTool, onOpenWorkflow, onAddCustomTool, onOpenAuth }: AssistantPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-right">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.chatTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.chatDesc}</p>
      </div>

      <AiChatAssistant
        allTools={allTools}
        allWorkflows={workflows}
        onOpenTool={onOpenTool}
        onOpenWorkflow={onOpenWorkflow}
        onAddCustomTool={onAddCustomTool}
        language={language}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
}
