import { create } from 'zustand'

interface DemoState {
  readerConnected: boolean
  setReaderConnected: (connected: boolean) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  readerConnected: true,
  setReaderConnected: (readerConnected) => set({ readerConnected }),
}))
