export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: 'input' | 'generate' | 'select' | 'result';
  inputField?: {
    label: string;
    placeholder: string;
    type: 'text' | 'textarea' | 'select';
    options?: { value: string; label: string }[];
  };
  toolId?: string;
  promptTemplate?: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  steps: WorkflowStep[];
  estimatedTime: string;
  isComplete?: boolean;
}

export interface WorkflowState {
  currentWorkflowId: string | null;
  currentStep: number;
  completedSteps: string[];
  collectedData: Record<string, any>;
  generatedOutputs: Record<string, string>;
}
