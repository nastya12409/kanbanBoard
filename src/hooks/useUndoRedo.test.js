import { describe, expect, it } from 'vitest';
import { withHistory } from './useUndoRedo';
import { reducer } from '../utils/reducer';
import { initialState } from '../utils/factory';


const historyReducer = withHistory(reducer);

const init = () => ({ past: [], present: initialState, future: [] });

const addBoard = (history, title) => historyReducer(history, { type: 'BOARD_ADD', title });

describe('withHistory: undo / redo', () => {
  it('дія + UNDO = початковий стан, REDO = змінений', () => {
    let h = init();
    h = addBoard(h, 'A');
    const afterAdd = h.present;

    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present).toEqual(initialState);
    expect(h.future[0]).toBe(afterAdd);

    h = historyReducer(h, { type: 'REDO' });
    expect(h.present).toBe(afterAdd);
  });

  it('нова дія після UNDO очищає future', () => {
    let h = init();
    h = addBoard(h, 'A');
    h = historyReducer(h, { type: 'UNDO' });
    h = addBoard(h, 'B');
    expect(h.future).toHaveLength(0);
    expect(h.present.boardOrder).toHaveLength(1);
    expect(h.present.boards[h.present.boardOrder[0]].title).toBe('B');
  });

  it('обмежує історію лімітом кроків', () => {
    const limited = withHistory(reducer, 3);
    let h = { past: [], present: initialState, future: [] };
    for (let i = 0; i < 10; i++) {
      h = limited(h, { type: 'BOARD_ADD', title: `B${i}` });
    }
    expect(h.past.length).toBeLessThanOrEqual(3);
  });

  it('порожній UNDO не змінює стан', () => {
    const h = init();
    expect(historyReducer(h, { type: 'UNDO' })).toBe(h);
    expect(historyReducer(h, { type: 'REDO' })).toBe(h);
  });
});
