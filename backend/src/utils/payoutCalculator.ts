export interface Milestone {
  viewThreshold: number;
  payout: number;
}

export interface BudgetAllocationResult {
  potentialDelta: number;
  actualDelta: number;
  newPayout: number;
  newBudgetSpent: number;
  capped: boolean;
}

export function calculatePayout(views: number, milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0 || views <= 0) {
    return 0;
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.viewThreshold - b.viewThreshold);

  let payout = 0;
  for (const milestone of sortedMilestones) {
    if (views >= milestone.viewThreshold) {
      payout = milestone.payout;
    } else {
      break;
    }
  }

  return payout;
}

export function calculateBudgetAllocation(
  currentPayout: number,
  calculatedPayout: number,
  totalBudget: number,
  budgetSpent: number
): BudgetAllocationResult {
  const potentialDelta = calculatedPayout - currentPayout;

  if (potentialDelta <= 0) {
    return {
      potentialDelta,
      actualDelta: 0,
      newPayout: currentPayout,
      newBudgetSpent: budgetSpent,
      capped: false,
    };
  }

  const remainingBudget = Math.max(0, totalBudget - budgetSpent);
  const actualDelta = Math.min(potentialDelta, remainingBudget);
  const capped = potentialDelta > remainingBudget;

  return {
    potentialDelta,
    actualDelta,
    newPayout: currentPayout + actualDelta,
    newBudgetSpent: budgetSpent + actualDelta,
    capped,
  };
}
