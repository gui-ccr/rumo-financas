import { spendSlices, type CategorySpend } from '../month-overview';

const spend = (categoryId: number, totalCents: number): CategorySpend => ({
  categoryId,
  name: `c${categoryId}`,
  icon: 'tag',
  color: '#7C83FD',
  group: 'pessoal',
  totalCents,
});

describe('spendSlices', () => {
  it('is empty when nothing was spent', () => {
    expect(spendSlices([])).toEqual([]);
  });

  it('folds the long tail into one slice and shares add up to 1', () => {
    const slices = spendSlices([spend(1, 500), spend(2, 300), spend(3, 100), spend(4, 60), spend(5, 40)], 3);
    expect(slices.map((s) => s.categoryId)).toEqual([1, 2, 3, -1]);
    expect(slices[3].totalCents).toBe(100);
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
  });
});
