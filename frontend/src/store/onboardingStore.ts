import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  startOnboarding: () => void;
  completeStep: (step: number) => void;
  nextStep: () => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      
      startOnboarding: () => set({ isActive: true, currentStep: 0, completedSteps: [] }),
      
      completeStep: (step: number) => set((state) => ({
        completedSteps: [...state.completedSteps, step],
      })),
      
      nextStep: () => set((state) => ({
        currentStep: state.currentStep + 1,
      })),
      
      finishOnboarding: () => set({ 
        isActive: false, 
        currentStep: 0, 
        completedSteps: [] 
      }),
      
      resetOnboarding: () => set({ 
        isActive: false, 
        currentStep: 0, 
        completedSteps: [] 
      }),
    }),
    {
      name: 'onboarding-storage',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
