import { StoredResult, StoredCustomTool, LibraryItem } from '../types/storageTypes';
import { getSavedResults } from './resultsService';
import { getCustomTools } from './customToolsService';
import { getFavorites } from './favoritesService';
import { getAllWorkflowProgress } from './workflowsService';

export interface LibraryAggregate {
  results: StoredResult[];
  customTools: StoredCustomTool[];
  favorites: string[];
  recentItems: LibraryItem[];
}

export async function getLibraryData(): Promise<LibraryAggregate> {
  const [results, customTools, favorites] = await Promise.all([
    getSavedResults(),
    getCustomTools(),
    getFavorites(),
  ]);

  const workflowProgress = await getAllWorkflowProgress();
  const workflowItems: LibraryItem[] = Object.entries(workflowProgress).map(([wfId, progress]) => ({
    id: `wf_${wfId}`,
    title: `رحلة: ${wfId}`,
    type: 'workflow' as const,
    content: JSON.stringify(progress.data),
    isFavorite: false,
    createdAt: progress.updatedAt,
    metadata: { workflowId: wfId, currentStep: progress.currentStep },
  }));

  const customToolItems: LibraryItem[] = customTools.map(t => ({
    id: t.id,
    title: t.title,
    type: 'tool' as const,
    content: t.description,
    isFavorite: favorites.includes(t.id),
    createdAt: t.createdAt,
    metadata: { category: t.category, visibility: t.visibility },
  }));

  const resultItems: LibraryItem[] = results.map(r => ({
    id: r.id,
    title: r.title,
    type: 'result' as const,
    content: r.content,
    isFavorite: r.isFavorite,
    createdAt: r.createdAt,
    metadata: { toolId: r.toolId, toolName: r.toolName },
  }));

  const allItems = [...resultItems, ...customToolItems, ...workflowItems];
  allItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return {
    results,
    customTools,
    favorites,
    recentItems: allItems.slice(0, 20),
  };
}
