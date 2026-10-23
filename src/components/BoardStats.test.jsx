import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoardStats from './BoardStats';


const board = {
  id: 'b1',
  title: 'Тест',
  columnOrder: ['col1', 'col2', 'col3'],
  columns: {
    col1: { id: 'col1', title: 'To Do', cardIds: ['a', 'b'] },
    col2: { id: 'col2', title: 'In Progress', cardIds: ['c'] },
    col3: { id: 'col3', title: 'Done', cardIds: ['d'] },
  },
  cards: {
    a: { id: 'a', title: '1', deadline: '2000-01-01', priority: 'high', description: '', tags: [] },
    b: { id: 'b', title: '2', deadline: null, priority: 'low', description: '', tags: [] },
    c: { id: 'c', title: '3', deadline: null, priority: 'low', description: '', tags: [] },
    d: { id: 'd', title: '4', deadline: null, priority: 'low', description: '', tags: [] },
  },
};

describe('BoardStats (моя фіча: статистика)', () => {
  it('рахує прогрес виконання', () => {
    render(<BoardStats board={board} />);
    expect(screen.getByText('1/4 виконано (25%)')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '25');
  });

  it('показує лічильники по колонках', () => {
    render(<BoardStats board={board} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText(/Прострочено: 1/)).toBeInTheDocument();
  });

  it('не падає на порожній дошці', () => {
    const empty = {
      ...board,
      cards: {},
      columns: {
        col1: { id: 'col1', title: 'To Do', cardIds: [] },
        col2: { id: 'col2', title: 'In Progress', cardIds: [] },
        col3: { id: 'col3', title: 'Done', cardIds: [] },
      },
    };
    render(<BoardStats board={empty} />);
    expect(screen.getByText('0/0 виконано (0%)')).toBeInTheDocument();
  });
});
