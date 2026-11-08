import type { BudgetLevel } from '../../components/DonutProgress'

export interface BudgetAlertRecord {
  lastLevel: BudgetLevel
  acknowledged: BudgetLevel[]
}

export const budgetAlertRanks: Record<BudgetLevel, number> = {
  none: 0,
  ok: 1,
  warning: 2,
  exceeded: 3,
}

export function evaluateBudgetAlert(
  currentLevel: BudgetLevel,
  record: BudgetAlertRecord,
) {
  const acknowledged =
    budgetAlertRanks[currentLevel] < budgetAlertRanks.warning
      ? record.acknowledged.filter(
          (level) => budgetAlertRanks[level] < budgetAlertRanks.warning,
        )
      : record.acknowledged

  return {
    shouldShow:
      budgetAlertRanks[currentLevel] >= budgetAlertRanks.warning &&
      budgetAlertRanks[currentLevel] > budgetAlertRanks[record.lastLevel] &&
      !acknowledged.includes(currentLevel),
    record: { lastLevel: currentLevel, acknowledged },
  }
}
