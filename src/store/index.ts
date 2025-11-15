import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, SyntheticDataset, Pipeline } from '@/types';

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // User Progress
  userProgress: UserProgress;
  updateProgress: (moduleId: string, completed: boolean) => void;
  recordAssessmentScore: (moduleId: string, score: number) => void;

  // Current Module
  currentModule: string | null;
  setCurrentModule: (moduleId: string | null) => void;

  // Datasets
  datasets: SyntheticDataset[];
  addDataset: (dataset: SyntheticDataset) => void;

  // Pipelines
  pipelines: Pipeline[];
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (pipelineId: string, updates: Partial<Pipeline>) => void;
  deletePipeline: (pipelineId: string) => void;

  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // User Progress
      userProgress: {
        userId: 'default-user',
        completedModules: [],
        completedLessons: [],
        assessmentScores: {},
        lastAccessed: new Date().toISOString(),
      },
      updateProgress: (moduleId, completed) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            completedModules: completed
              ? [...state.userProgress.completedModules, moduleId]
              : state.userProgress.completedModules.filter((id) => id !== moduleId),
            lastAccessed: new Date().toISOString(),
          },
        })),
      recordAssessmentScore: (moduleId, score) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            assessmentScores: {
              ...state.userProgress.assessmentScores,
              [moduleId]: score,
            },
            lastAccessed: new Date().toISOString(),
          },
        })),

      // Current Module
      currentModule: null,
      setCurrentModule: (moduleId) => set({ currentModule: moduleId }),

      // Datasets
      datasets: [],
      addDataset: (dataset) =>
        set((state) => ({ datasets: [...state.datasets, dataset] })),

      // Pipelines
      pipelines: [],
      addPipeline: (pipeline) =>
        set((state) => ({ pipelines: [...state.pipelines, pipeline] })),
      updatePipeline: (pipelineId, updates) =>
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, ...updates } : p
          ),
        })),
      deletePipeline: (pipelineId) =>
        set((state) => ({
          pipelines: state.pipelines.filter((p) => p.id !== pipelineId),
        })),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'quantlab-storage',
    }
  )
);
