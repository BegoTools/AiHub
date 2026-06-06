import { supabase } from '../lib/supabaseClient';
import { WorkflowProgress } from '../types/storageTypes';

export async function saveWorkflowProgress(workflowId: string, progress: WorkflowProgress): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('workflow_progress')
    .upsert({
      user_id: user.id,
      workflow_id: workflowId,
      current_step: progress.currentStep,
      completed_steps: progress.completedSteps,
      data: progress.data,
      generated_outputs: progress.generatedOutputs || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, workflow_id' });

  if (error) {
    console.error('[workflowsService] Failed to save progress:', error);
  }
}

export async function getWorkflowProgress(workflowId: string): Promise<WorkflowProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('workflow_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('workflow_id', workflowId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    workflowId: data.workflow_id,
    currentStep: data.current_step || 0,
    completedSteps: data.completed_steps || [],
    data: data.data || {},
    generatedOutputs: data.generated_outputs || {},
    updatedAt: data.updated_at,
  };
}

export async function clearWorkflowProgress(workflowId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('workflow_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('workflow_id', workflowId);
}

export async function getAllWorkflowProgress(): Promise<Record<string, WorkflowProgress>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('workflow_progress')
    .select('*')
    .eq('user_id', user.id);

  if (error) return {};

  const result: Record<string, WorkflowProgress> = {};
  for (const row of data || []) {
    result[row.workflow_id] = {
      workflowId: row.workflow_id,
      currentStep: row.current_step || 0,
      completedSteps: row.completed_steps || [],
      data: row.data || {},
      generatedOutputs: row.generated_outputs || {},
      updatedAt: row.updated_at,
    };
  }
  return result;
}
