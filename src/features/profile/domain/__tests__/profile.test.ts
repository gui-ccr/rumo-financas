import {
  AVATAR_ICON_KEYS,
  DEFAULT_GREETING,
  NAME_MAX_LENGTH,
  STATUS_MAX_LENGTH,
  buildProfile,
  greetingForHour,
  normalizeAvatarColor,
  normalizeAvatarIcon,
  normalizeName,
  normalizeStatus,
  parseFlag,
  parseSavingsGoal,
  type StoredProfile,
} from '../profile';

const EMPTY_STORED: StoredProfile = {
  name: null,
  avatarColor: null,
  avatarIcon: null,
  status: null,
  timeGreeting: null,
  savingsGoalCents: null,
};

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

describe('normalizeStatus', () => {
  it('trims, collapses spaces and caps at 60 characters', () => {
    expect(normalizeStatus('  foco   em quitar ')).toBe('foco em quitar');
    expect(normalizeStatus('x'.repeat(STATUS_MAX_LENGTH + 5))).toHaveLength(STATUS_MAX_LENGTH);
  });
});

describe('greetingForHour', () => {
  it.each([
    [0, 'Boa noite,'],
    [4, 'Boa noite,'],
    [5, 'Bom dia,'],
    [11, 'Bom dia,'],
    [12, 'Boa tarde,'],
    [17, 'Boa tarde,'],
    [18, 'Boa noite,'],
    [23, 'Boa noite,'],
  ])('hour %i -> %s', (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });

  it('keeps "Olá," as the default greeting', () => {
    expect(DEFAULT_GREETING).toBe('Olá,');
  });
});

describe('avatar fields normalization', () => {
  it('accepts only 6-digit hex colors', () => {
    expect(normalizeAvatarColor('#2B3A8C')).toBe('#2B3A8C');
    expect(normalizeAvatarColor('2B3A8C')).toBeNull();
    expect(normalizeAvatarColor('red')).toBeNull();
    expect(normalizeAvatarColor(42)).toBeNull();
  });

  it('accepts only known icon keys', () => {
    expect(normalizeAvatarIcon('rocket')).toBe('rocket');
    expect(normalizeAvatarIcon('unknown')).toBeNull();
    expect(normalizeAvatarIcon(null)).toBeNull();
  });

  it('defines exactly the twelve avatar glyphs', () => {
    expect(AVATAR_ICON_KEYS).toHaveLength(12);
  });
});

describe('parseSavingsGoal and parseFlag', () => {
  it('reads integer cents and rejects anything else', () => {
    expect(parseSavingsGoal('150000')).toBe(150000);
    expect(parseSavingsGoal('0')).toBeNull();
    expect(parseSavingsGoal('12.5')).toBeNull();
    expect(parseSavingsGoal('-10')).toBeNull();
    expect(parseSavingsGoal(null)).toBeNull();
  });

  it('treats only "1" as on', () => {
    expect(parseFlag('1')).toBe(true);
    expect(parseFlag('0')).toBe(false);
    expect(parseFlag(null)).toBe(false);
  });
});

describe('buildProfile', () => {
  it('loads a profile saved before the new fields existed, with defaults', () => {
    expect(buildProfile({ ...EMPTY_STORED, name: 'Guilherme' }, null)).toEqual({
      name: 'Guilherme',
      photoUri: null,
      avatarColor: null,
      avatarIcon: null,
      status: '',
      timeGreeting: false,
      savingsGoalCents: null,
    });
  });

  it('round-trips every field as it is written', () => {
    const saved: StoredProfile = {
      name: 'Guilherme',
      avatarColor: '#2E8C88',
      avatarIcon: 'piggy-bank',
      status: 'Foco em quitar as dívidas',
      timeGreeting: '1',
      savingsGoalCents: '80000',
    };
    expect(buildProfile(saved, 'file:///docs/profile-1.jpg')).toEqual({
      name: 'Guilherme',
      photoUri: 'file:///docs/profile-1.jpg',
      avatarColor: '#2E8C88',
      avatarIcon: 'piggy-bank',
      status: 'Foco em quitar as dívidas',
      timeGreeting: true,
      savingsGoalCents: 80000,
    });
  });

  it('drops invalid stored values instead of trusting them', () => {
    const profile = buildProfile(
      { ...EMPTY_STORED, avatarColor: 'not-a-color', avatarIcon: 'trophy', savingsGoalCents: 'abc' },
      null,
    );
    expect(profile.avatarColor).toBeNull();
    expect(profile.avatarIcon).toBeNull();
    expect(profile.savingsGoalCents).toBeNull();
  });
});
