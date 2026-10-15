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

/**
 * Calculates the payout based on views and milestones.
 * A creator's payout = the amount of the HIGHEST milestone their post's view count has crossed.
 *
 * @param views Total views on the post
 * @param milestones List of milestones (viewThreshold, payout)
 * @returns Payout amount
 */
export function calculatePayout(views: number, milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0 || views <= 0) {
    return 0;
  }

  // Sort ascending by viewThreshold to ensure proper threshold evaluation
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

/**
 * Calculates the budget allocation ensuring the campaign never exceeds totalBudget,
 * handles delta calculation, idempotency, and capping to remaining budget.
 *
 * @param currentPayout Currently recorded payout for this submission
 * @param calculatedPayout New payout calculated based on current views
 * @param totalBudget Total campaign budget
 * @param budgetSpent Current budget spent across all submissions
 */
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
