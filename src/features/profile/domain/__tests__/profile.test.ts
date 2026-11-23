import { NAME_MAX_LENGTH, normalizeName } from '../profile';

describe('normalizeName', () => {
  it('trims and collapses inner spaces', () => {
    expect(normalizeName('   Guilherme    da  Silva  ')).toBe('Guilherme da Silva');
  });

  it('keeps an empty name empty', () => {
    expect(normalizeName('   ')).toBe('');
  });

  it('caps the length at the profile limit', () => {
    expect(normalizeName('a'.repeat(NAME_MAX_LENGTH + 10))).toHaveLength(NAME_MAX_LENGTH);
  });
});
