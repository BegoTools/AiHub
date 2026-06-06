import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Tool, HistoryItem, ApiSettings, Category } from '../types';
import { Workflow } from '../types/workflowTypes';

import HomePage from '../pages/HomePage';
import AssistantPage from '../pages/AssistantPage';
import ToolsPage from '../pages/ToolsPage';
import ToolDetailsPage from '../pages/ToolDetailsPage';
import CategoriesPage from '../pages/CategoriesPage';
import CategoryDetailPage from '../pages/CategoryDetailPage';
import FavoritesPage from '../pages/FavoritesPage';
import HistoryPage from '../pages/HistoryPage';
import WorkflowsPage from '../pages/WorkflowsPage';
import SettingsPage from '../pages/SettingsPage';
import AboutPage from '../pages/AboutPage';
import LibraryPage from '../pages/LibraryPage';
import CommunityToolsPage from '../pages/CommunityToolsPage';
import CreateToolWizard from '../pages/CreateToolWizard';
import WorkflowRunner from '../pages/WorkflowRunner';
import ErrorBoundary from '../components/ErrorBoundary';

interface AppRoutesProps {
  t: any;
  language: string;
  allTools: Tool[];
  localizedCategories: Category[];
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  openTool: (toolId: string) => void;
  recentToolsUsed: Tool[];
  history: HistoryItem[];
  handleClearHistory: () => void;
  handleDeleteHistoryItem: (id: string) => void;
  handleGenerate: (inputs: Record<string, string>) => Promise<void>;
  currentToolOutput: string;
  setCurrentToolOutput: (val: string) => void;
  isGenerating: boolean;
  saveManualResultToHistory: () => void;
  workflows: Workflow[];
  settings: ApiSettings;
  handleSaveSettings: (settings: ApiSettings) => void;
  onAddCustomTool: (tool: any) => void;
  onOpenAuth: (msg: string) => void;
}

export default function AppRoutes({
  t, language, allTools, localizedCategories, favorites, toggleFavorite,
  openTool, recentToolsUsed, history, handleClearHistory, handleDeleteHistoryItem,
  handleGenerate, currentToolOutput, setCurrentToolOutput, isGenerating,
  saveManualResultToHistory, workflows, settings, handleSaveSettings,
  onAddCustomTool, onOpenAuth
}: AppRoutesProps) {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={
        <HomePage
          t={t}
          localizedCategories={localizedCategories}
          allTools={allTools}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          openTool={openTool}
          recentToolsUsed={recentToolsUsed}
        />
      } />
      <Route path="/assistant" element={
        <AssistantPage
          t={t}
          language={language}
          allTools={allTools}
          workflows={workflows}
          settings={settings}
          onOpenTool={openTool}
          onOpenWorkflow={(wfId: string) => navigate(`/workflows/${wfId}`)}
          onAddCustomTool={onAddCustomTool}
          onOpenAuth={onOpenAuth}
        />
      } />
      <Route path="/tools" element={
        <ToolsPage
          t={t}
          allTools={allTools}
          localizedCategories={localizedCategories}
        />
      } />
      <Route path="/tools/:toolId" element={
        <ToolDetailsPage
          t={t}
          allTools={allTools}
          localizedCategories={localizedCategories}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          handleGenerate={handleGenerate}
          currentToolOutput={currentToolOutput}
          setCurrentToolOutput={setCurrentToolOutput}
          isGenerating={isGenerating}
          saveManualResultToHistory={saveManualResultToHistory}
        />
      } />
      <Route path="/categories" element={
        <CategoriesPage
          t={t}
          localizedCategories={localizedCategories}
          allTools={allTools}
        />
      } />
      <Route path="/categories/:categoryId" element={
        <CategoryDetailPage
          t={t}
          localizedCategories={localizedCategories}
          allTools={allTools}
          openTool={openTool}
        />
      } />
      <Route path="/library" element={
        <LibraryPage
          t={t}
          language={language}
          onOpenTool={openTool}
          onOpenWorkflow={(wfId: string) => navigate(`/workflows/${wfId}`)}
        />
      } />
      <Route path="/workflows" element={
        <WorkflowsPage
          t={t}
          workflows={workflows}
        />
      } />
      <Route path="/workflows/:workflowId" element={
        <WorkflowRunner
          t={t}
          language={language}
          settings={settings}
          onBack={() => navigate('/workflows')}
        />
      } />
      <Route path="/community" element={
        <ErrorBoundary>
          <CommunityToolsPage
            t={t}
            language={language}
            onOpenTool={openTool}
          />
        </ErrorBoundary>
      } />
      <Route path="/favorites" element={
        <FavoritesPage
          t={t}
          favorites={favorites}
          allTools={allTools}
          localizedCategories={localizedCategories}
          openTool={openTool}
          toggleFavorite={toggleFavorite}
        />
      } />
      <Route path="/history" element={
        <HistoryPage
          t={t}
          language={language}
          history={history}
          allTools={allTools}
          openTool={openTool}
          handleClearHistory={handleClearHistory}
          handleDeleteHistoryItem={handleDeleteHistoryItem}
        />
      } />
      <Route path="/settings" element={
        <SettingsPage
          t={t}
          settings={settings}
          handleSaveSettings={handleSaveSettings}
        />
      } />
      <Route path="/about" element={
        <AboutPage t={t} />
      } />
      <Route path="/create-tool" element={
        <CreateToolWizard
          t={t}
          language={language}
          onSuccess={() => navigate('/home')}
          onCancel={() => navigate('/home')}
        />
      } />
    </Routes>
  );
}
