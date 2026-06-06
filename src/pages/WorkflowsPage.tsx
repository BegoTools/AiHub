import { useNavigate } from 'react-router-dom';
import { DynamicIcon } from '../components/ToolForm';
import { Workflow } from '../types/workflowTypes';

interface WorkflowsPageProps {
  t: any;
  workflows: Workflow[];
}

export default function WorkflowsPage({ t, workflows }: WorkflowsPageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.workflowsTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.workflowsDesc}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => navigate(`/workflows/${wf.id}`)}
            className="p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-blue-500/40 hover:shadow-md transition-all text-right cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                <DynamicIcon name={wf.icon} size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{wf.title}</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{wf.description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">{wf.estimatedTime}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{wf.steps.length} خطوات</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
