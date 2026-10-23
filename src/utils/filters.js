
export const today = () => new Date().toLocaleDateString('sv-SE');

export const isOverdue = (deadline) => Boolean(deadline) && deadline < today();


export const daysLeft = (deadline) => {
  if (!deadline) return null;
  const now = new Date(today() + 'T00:00:00');
  const due = new Date(deadline + 'T00:00:00');
  return Math.round((due - now) / 86400000);
};


export const urgencyOf = (deadline) => {
  const d = daysLeft(deadline);
  if (d === null) return 'none';
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 3) return 'soon';
  return 'ok';
};


export const deadlineLabel = (deadline) => {
  const d = daysLeft(deadline);
  if (d === null) return '';
  if (d < 0) return `Прострочено ${Math.abs(d)} дн.`;
  if (d === 0) return 'Сьогодні дедлайн!';
  if (d === 1) return 'Залишився 1 день';
  if (d <= 4) return `Залишилось ${d} дні`;
  return `Залишилось ${d} днів`;
};

export const matchesFilters = (card, { q, priority, tag, due }) => {
  if (q) {
    const hay = (card.title + ' ' + card.description).toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  if (priority && card.priority !== priority) return false;
  if (tag && !card.tags.includes(tag)) return false;
  if (due === 'overdue' && !isOverdue(card.deadline)) return false;
  if (due === 'today' && card.deadline !== today()) return false;
  if (due === 'none' && card.deadline) return false;
  return true;
};
