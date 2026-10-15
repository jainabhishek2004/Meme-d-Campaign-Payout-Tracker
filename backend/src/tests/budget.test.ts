import { calculateBudgetAllocation } from '../utils/payoutCalculator';

describe('calculateBudgetAllocation', () => {
  it('should apply full delta when delta is within remaining budget', () => {
    // Current payout: 500, New calculated payout: 2000 (delta = 1500)
    // Total budget: 10000, Budget spent: 2000 (remaining = 8000)
    const result = calculateBudgetAllocation(500, 2000, 10000, 2000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(1500);
    expect(result.newPayout).toBe(2000);
    expect(result.newBudgetSpent).toBe(3500);
    expect(result.capped).toBe(false);
  });

  it('should cap delta to remaining budget when delta exceeds remaining budget', () => {
    // Current payout: 500, New calculated payout: 2000 (delta = 1500)
    // Total budget: 5000, Budget spent: 4000 (remaining = 1000)
    const result = calculateBudgetAllocation(500, 2000, 5000, 4000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(1000); // Capped to 1000
    expect(result.newPayout).toBe(1500); // 500 + 1000
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(true);
  });

  it('should result in delta = 0 when remaining budget is already 0', () => {
    // Current payout: 500, New calculated payout: 2000 (delta = 1500)
    // Total budget: 5000, Budget spent: 5000 (remaining = 0)
    const result = calculateBudgetAllocation(500, 2000, 5000, 5000);

    expect(result.potentialDelta).toBe(1500);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(500); // Unchanged
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(true);
  });

  it('should make no change when new payout is less than current payout (views went down)', () => {
    // Current payout: 2000, New calculated payout: 500 (delta = -1500)
    // Total budget: 10000, Budget spent: 2000
    const result = calculateBudgetAllocation(2000, 500, 10000, 2000);

    expect(result.potentialDelta).toBe(-1500);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(2000); // Unchanged
    expect(result.newBudgetSpent).toBe(2000); // Unchanged
    expect(result.capped).toBe(false);
  });

  it('should make no change when new payout equals current payout', () => {
    // Current payout: 2000, New calculated payout: 2000 (delta = 0)
    const result = calculateBudgetAllocation(2000, 2000, 10000, 2000);

    expect(result.potentialDelta).toBe(0);
    expect(result.actualDelta).toBe(0);
    expect(result.newPayout).toBe(2000);
    expect(result.newBudgetSpent).toBe(2000);
    expect(result.capped).toBe(false);
  });

  it('should handle exactly reaching the budget limit', () => {
    // Current payout: 0, New calculated payout: 5000
    // Total budget: 5000, Budget spent: 0 (remaining = 5000)
    const result = calculateBudgetAllocation(0, 5000, 5000, 0);

    expect(result.potentialDelta).toBe(5000);
    expect(result.actualDelta).toBe(5000);
    expect(result.newPayout).toBe(5000);
    expect(result.newBudgetSpent).toBe(5000);
    expect(result.capped).toBe(false);
  });
});
