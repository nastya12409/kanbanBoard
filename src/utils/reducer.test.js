import { describe, expect, it } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './factory';

// Первичная сборка: создаем дошку и колонки
const setup = () => {
  const state = reducer(initialState, { type: 'BOARD_ADD', title: 'Робота' });
  const boardId = state.boardOrder[0];
  const [todo, doing] = state.boards[boardId].columnOrder;
  return { state, boardId, todo, doing };
};

describe('reducer: дошки', () => {
  it('додає дошку з трьома колонками за замовчуванням', () => {
    const { state, boardId } = setup();
    const board = state.boards[boardId];
    expect(board.title).toBe('Робота');
    expect(board.columnOrder).toHaveLength(3);
    expect(state.boardOrder).toEqual([boardId]);
  });

  it('перейменовує та видаляє дошку', () => {
    const { state, boardId } = setup();
    const renamed = reducer(state, {
      type: 'BOARD_RENAME',
      boardId,
      title: 'Нова',
    });
    expect(renamed.boards[boardId].title).toBe('Нова');

    const removed = reducer(renamed, { type: 'BOARD_DELETE', boardId });
    expect(removed.boardOrder).toHaveLength(0);
    expect(removed.boards[boardId]).toBeUndefined();
  });
});

describe('reducer: картки', () => {
  it('додає картку в колонку і не мутує вихідний стан', () => {
    const { state, boardId, todo } = setup();
    const next = reducer(state, {
      type: 'CARD_ADD',
      boardId,
      columnId: todo,
      title: 'Задача',
    });
    expect(next.boards[boardId].columns[todo].cardIds).toHaveLength(1);
    // вихідний стан не змінився (reducer чистий)
    expect(state.boards[boardId].columns[todo].cardIds).toHaveLength(0);
  });

  it('переносить картку між колонками', () => {
    const { state, boardId, todo, doing } = setup();
    const s1 = reducer(state, {
      type: 'CARD_ADD',
      boardId,
      columnId: todo,
      title: 'Задача',
    });
    const cardId = s1.boards[boardId].columns[todo].cardIds[0];
    const s2 = reducer(s1, {
      type: 'CARD_MOVE',
      boardId,
      cardId,
      from: todo,
      to: doing,
      index: 0,
    });
    expect(s2.boards[boardId].columns[todo].cardIds).toEqual([]);
    expect(s2.boards[boardId].columns[doing].cardIds).toEqual([cardId]);
  });

  it('оновлює і видаляє картку', () => {
    const { state, boardId, todo } = setup();
    const s1 = reducer(state, {
      type: 'CARD_ADD',
      boardId,
      columnId: todo,
      title: 'Задача',
    });
    const cardId = s1.boards[boardId].columns[todo].cardIds[0];

    const s2 = reducer(s1, {
      type: 'CARD_UPDATE',
      boardId,
      cardId,
      patch: { priority: 'high' },
    });
    expect(s2.boards[boardId].cards[cardId].priority).toBe('high');
    expect(s1.boards[boardId].cards[cardId].priority).toBe('medium');

    const s3 = reducer(s2, { type: 'CARD_DELETE', boardId, cardId });
    expect(s3.boards[boardId].cards[cardId]).toBeUndefined();
    expect(s3.boards[boardId].columns[todo].cardIds).toEqual([]);
  });

  it('невідома дія повертає той самий стан', () => {
    const { state } = setup();
    expect(reducer(state, { type: 'NOPE' })).toBe(state);
  });
});
