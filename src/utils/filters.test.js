import { describe, expect, it } from 'vitest';
import { deadlineLabel, isOverdue, matchesFilters, today, urgencyOf } from './filters';

const baseCard = {
  title: 'Fix login bug',
  description: 'Кнопка входу не працює',
  priority: 'high',
  tags: ['bug'],
  deadline: null,
};

describe('isOverdue', () => {
  it('вважає минулу дату простроченою', () => {
    expect(isOverdue('2000-01-01')).toBe(true);
    expect(isOverdue(today())).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});

describe('urgencyOf + deadlineLabel (мої напоминання)', () => {
  it('класифікує терміновість дедлайну', () => {
    expect(urgencyOf(null)).toBe('none');
    expect(urgencyOf('2000-01-01')).toBe('overdue');
    expect(urgencyOf(today())).toBe('today');
  });

  it('дає зрозумілу підпис до дедлайну', () => {
    expect(deadlineLabel(null)).toBe('');
    expect(deadlineLabel('2000-01-01')).toMatch(/Прострочено \d+ дн/);
    expect(deadlineLabel(today())).toBe('Сьогодні дедлайн!');
  });
});

describe('matchesFilters', () => {
  it('фільтрує за текстом, пріоритетом і тегом', () => {
    const none = { q: '', priority: '', tag: '', due: '' };
    expect(matchesFilters(baseCard, none)).toBe(true);
    expect(matchesFilters(baseCard, { ...none, q: 'login' })).toBe(true);
    expect(matchesFilters(baseCard, { ...none, q: 'design' })).toBe(false);
    expect(matchesFilters(baseCard, { ...none, priority: 'low' })).toBe(false);
    expect(matchesFilters(baseCard, { ...none, tag: 'bug' })).toBe(true);
    expect(matchesFilters(baseCard, { ...none, tag: 'ui' })).toBe(false);
  });

  it('фільтрує за дедлайном', () => {
    const none = { q: '', priority: '', tag: '', due: '' };
    expect(matchesFilters(baseCard, { ...none, due: 'none' })).toBe(true);
    const overdue = { ...baseCard, deadline: '2000-01-01' };
    expect(matchesFilters(overdue, { ...none, due: 'overdue' })).toBe(true);
    expect(matchesFilters(overdue, { ...none, due: 'today' })).toBe(false);
  });
});
