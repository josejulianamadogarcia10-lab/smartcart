import { create } from 'zustand'

interface DemoState {
  readerConnected: boolean
  panelOpen: boolean
  forceCheck: boolean
  simulateFailure: boolean
  scenarioRunning: boolean
  scenarioVersion: number
  setReaderConnected: (connected: boolean) => void
  togglePanel: () => void
  closePanel: () => void
  toggleForceCheck: () => void
  toggleSimulateFailure: () => void
  startScenario: () => void
  finishScenario: () => void
  cancelScenario: () => void
  resetDemo: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  readerConnected: true,
  panelOpen: false,
  forceCheck: false,
  simulateFailure: false,
  scenarioRunning: false,
  scenarioVersion: 0,
  setReaderConnected: (readerConnected) => set({ readerConnected }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
  toggleForceCheck: () => set((state) => ({ forceCheck: !state.forceCheck })),
  toggleSimulateFailure: () =>
    set((state) => ({ simulateFailure: !state.simulateFailure })),
  startScenario: () => set({ scenarioRunning: true }),
  finishScenario: () => set({ scenarioRunning: false }),
  cancelScenario: () =>
    set((state) => ({
      scenarioRunning: false,
      scenarioVersion: state.scenarioVersion + 1,
    })),
  resetDemo: () =>
    set((state) => ({
      panelOpen: false,
      forceCheck: false,
      simulateFailure: false,
      scenarioRunning: false,
      scenarioVersion: state.scenarioVersion + 1,
    })),
}))
