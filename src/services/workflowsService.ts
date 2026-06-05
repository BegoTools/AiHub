import { localStorageAdapter } from './storage/localStorageAdapter';
import { WorkflowProgress } from '../types/storageTypes';

const PROGRESS_PREFIX = 'ai_hub_workflow_progress_';

export async function saveWorkflowProgress(workflowId: string, progress: WorkflowProgress): Promise<void> {
  const key = `${PROGRESS_PREFIX}${workflowId}`;
  await localStorageAdapter.setItem(key, progress);
}

export async function getWorkflowProgress(workflowId: string): Promise<WorkflowProgress | null> {
  const key = `${PROGRESS_PREFIX}${workflowId}`;
  return localStorageAdapter.getItem<WorkflowProgress>(key);
}

export async function clearWorkflowProgress(workflowId: string): Promise<void> {
  const key = `${PROGRESS_PREFIX}${workflowId}`;
  await localStorageAdapter.removeItem(key);
}

export async function getAllWorkflowProgress(): Promise<Record<string, WorkflowProgress>> {
  const all: Record<string, WorkflowProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PROGRESS_PREFIX)) {
      const progress = await localStorageAdapter.getItem<WorkflowProgress>(key);
      if (progress) {
        all[key.replace(PROGRESS_PREFIX, '')] = progress;
      }
    }
  }
  return all;
}

// TODO Future Backend:
// - Replace with database table workflow_progress
// - Add user_id, workflow_id, progress JSON fields
// - Add updated_at timestamp index
