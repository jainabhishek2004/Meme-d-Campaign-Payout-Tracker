import { calculatePayout, Milestone } from '../utils/payoutCalculator';

describe('calculatePayout', () => {
  const sampleMilestones: Milestone[] = [
    { viewThreshold: 10000, payout: 500 },
    { viewThreshold: 50000, payout: 2000 },
    { viewThreshold: 100000, payout: 5000 },
  ];

  it('should return 0 for 0 views', () => {
    expect(calculatePayout(0, sampleMilestones)).toBe(0);
  });

  it('should return 0 for views below all thresholds', () => {
    expect(calculatePayout(5000, sampleMilestones)).toBe(0);
    expect(calculatePayout(9999, sampleMilestones)).toBe(0);
  });

  it('should return first payout for views at exactly first threshold', () => {
    expect(calculatePayout(10000, sampleMilestones)).toBe(500);
  });

  it('should return lower milestone payout for views between two milestones', () => {
    expect(calculatePayout(25000, sampleMilestones)).toBe(500);
    expect(calculatePayout(49999, sampleMilestones)).toBe(500);
    expect(calculatePayout(60000, sampleMilestones)).toBe(2000);
    expect(calculatePayout(99999, sampleMilestones)).toBe(2000);
  });

  it('should return highest payout for views above all milestones', () => {
    expect(calculatePayout(100000, sampleMilestones)).toBe(5000);
    expect(calculatePayout(250000, sampleMilestones)).toBe(5000);
    expect(calculatePayout(1000000, sampleMilestones)).toBe(5000);
  });

  it('should return 0 for empty milestones', () => {
    expect(calculatePayout(50000, [])).toBe(0);
  });

  it('should correctly handle unsorted milestones', () => {
    const unsortedMilestones: Milestone[] = [
      { viewThreshold: 100000, payout: 5000 },
      { viewThreshold: 10000, payout: 500 },
      { viewThreshold: 50000, payout: 2000 },
    ];

    expect(calculatePayout(0, unsortedMilestones)).toBe(0);
    expect(calculatePayout(5000, unsortedMilestones)).toBe(0);
    expect(calculatePayout(10000, unsortedMilestones)).toBe(500);
    expect(calculatePayout(60000, unsortedMilestones)).toBe(2000);
    expect(calculatePayout(120000, unsortedMilestones)).toBe(5000);
  });

  it('should return 0 for negative views', () => {
    expect(calculatePayout(-500, sampleMilestones)).toBe(0);
  });
});
