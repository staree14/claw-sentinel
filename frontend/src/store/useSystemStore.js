import { create } from 'zustand';

const useSystemStore = create((set) => ({
  currentEvent: null,
  anomalyScore: 0,
  riskLevel: 'Normal',
  reasoning: 'System initialized. Awaiting sensor telemetry.',
  actionTaken: 'Standing by.',
  actions: [],
  suggestedActions: ['Ignore', 'Log event', 'Maintain schedule'],
  trace: [],
  mode: 'ClawSentinel AI',
  activeScenario: null,
  backendOnline: false,
  notification: null,

  setSystemState: (stateUpdate) => set((state) => ({ ...state, ...stateUpdate })),

  resetSystem: () => set({
    currentEvent: null,
    anomalyScore: 0,
    riskLevel: 'Normal',
    reasoning: 'System initialized. Awaiting sensor telemetry.',
    actionTaken: 'Standing by.',
    actions: [],
    suggestedActions: ['Ignore', 'Log event', 'Maintain schedule'],
    trace: [],
    activeScenario: null,
  }),
}));

export default useSystemStore;
