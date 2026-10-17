import { calculateBudgetAllocation } from '../utils/payoutCalculator';

describe('calculateBudgetAllocation', () => {
  it('should apply full delta when delta is within remaining budget', () => {

    const result = calculateBudgetAllocation(500, 2000, 10000, 2000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(1500);
    expect(result.newPayout).toBe(2000);
    expect(result.newBudgetSpent).toBe(3500);
    expect(result.capped).toBe(false);
  });

  it('should cap delta to remaining budget when delta exceeds remaining budget', () => {

    const result = calculateBudgetAllocation(500, 2000, 5000, 4000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(1000);
    expect(result.newPayout).toBe(1500);
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(true);
  });

  it('should result in delta = 0 when remaining budget is already 0', () => {

    const result = calculateBudgetAllocation(500, 2000, 5000, 5000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(500);
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(true);
  });

  it('should make no change when new payout is less than current payout (views went down)', () => {

    const result = calculateBudgetAllocation(2000, 500, 10000, 2000);

    expect(result.potentialDelta).toBe(-1500);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(2000);
    expect(result.newBudgetSpent).toBe(2000);
    expect(result.capped).toBe(false);
  });

  it('should make no change when new payout equals current payout', () => {

    const result = calculateBudgetAllocation(2000, 2000, 10000, 2000);

    expect(result.potentialDelta).toBe(0);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(2000);
    expect(result.newBudgetSpent).toBe(2000);
    expect(result.capped).toBe(false);
  });

  it('should handle exactly reaching the budget limit', () => {

    const result = calculateBudgetAllocation(0, 5000, 5000, 0);

    expect(result.potentialDelta).toBe(5000);
    expect(result.actualDelta).toBe(5000);
    expect(result.newPayout).toBe(5000);
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(false);
  });
});
