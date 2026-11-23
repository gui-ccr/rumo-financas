import { initialsOf } from '../initials';

describe('initialsOf', () => {
  it('uses the first and last word', () => {
    expect(initialsOf('Guilherme Silva')).toBe('GS');
    expect(initialsOf('Maria da Costa Lima')).toBe('ML');
  });

  it('uses one letter for a single word, in uppercase', () => {
    expect(initialsOf('maya')).toBe('M');
  });

  it('ignores extra spaces and returns nothing for an empty name', () => {
    expect(initialsOf('   ana    beatriz ')).toBe('AB');
    expect(initialsOf('   ')).toBe('');
  });
});
