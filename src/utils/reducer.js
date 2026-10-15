// Чистый reducer: (state, action) => newState.
// Не трогает localStorage и не мутирует входной state.
import { createBoard, createCard, createColumn } from './factory';

// Функция-хелпер: обновляет одну дошку, не меняя остальные
const updateBoard = (state, boardId, fn) => {
  const board = state.boards[boardId];
  if (!board) return state; // неизвестная дошка: состояние не меняется
  return { ...state, boards: { ...state.boards, [boardId]: fn(board) } };
};

export function reducer(state, action) {
  switch (action.type) {
    // ---- дошки ----
    case 'BOARD_ADD': {
      const board = createBoard(action.title);
      return {
        boards: { ...state.boards, [board.id]: board },
        boardOrder: [...state.boardOrder, board.id],
      };
    }
    case 'BOARD_RENAME':
      return updateBoard(state, action.boardId, (b) => ({
        ...b,
        title: action.title,
      }));
    case 'BOARD_DELETE': {
      const boards = { ...state.boards };
      delete boards[action.boardId];
      return {
        boards,
        boardOrder: state.boardOrder.filter((id) => id !== action.boardId),
      };
    }
    case 'BOARD_IMPORT':
      return {
        boards: { ...state.boards, [action.board.id]: action.board },
        boardOrder: [...state.boardOrder, action.board.id],
      };

    // ---- колонки ----
    case 'COLUMN_ADD':
      return updateBoard(state, action.boardId, (b) => {
        const col = createColumn(action.title);
        return {
          ...b,
          columnOrder: [...b.columnOrder, col.id],
          columns: { ...b.columns, [col.id]: col },
        };
      });
    case 'COLUMN_RENAME':
      return updateBoard(state, action.boardId, (b) => {
        const col = b.columns[action.columnId];
        if (!col) return b;
        return {
          ...b,
          columns: { ...b.columns, [col.id]: { ...col, title: action.title } },
        };
      });
    case 'COLUMN_DELETE':
      return updateBoard(state, action.boardId, (b) => {
        const col = b.columns[action.columnId];
        if (!col) return b;
        const columns = { ...b.columns };
        const cards = { ...b.cards };
        delete columns[action.columnId];
        col.cardIds.forEach((id) => delete cards[id]); // картки колонки
        return {
          ...b,
          columnOrder: b.columnOrder.filter((id) => id !== action.columnId),
          columns,
          cards,
        };
      });

    // ---- картки ----
    case 'CARD_ADD':
      return updateBoard(state, action.boardId, (b) => {
        const card = createCard(action.title);
        const col = b.columns[action.columnId];
        if (!col) return b;
        return {
          ...b,
          cards: { ...b.cards, [card.id]: card },
          columns: {
            ...b.columns,
            [col.id]: { ...col, cardIds: [...col.cardIds, card.id] },
          },
        };
      });
    case 'CARD_UPDATE':
      return updateBoard(state, action.boardId, (b) => {
        const card = b.cards[action.cardId];
        if (!card) return b;
        return {
          ...b,
          cards: { ...b.cards, [action.cardId]: { ...card, ...action.patch } },
        };
      });
    case 'CARD_DELETE':
      return updateBoard(state, action.boardId, (b) => {
        if (!b.cards[action.cardId]) return b;
        const cards = { ...b.cards };
        delete cards[action.cardId];
        return {
          ...b,
          cards,
          columns: Object.fromEntries(
            Object.entries(b.columns).map(([id, col]) => [
              id,
              col.cardIds.includes(action.cardId)
                ? { ...col, cardIds: col.cardIds.filter((x) => x !== action.cardId) }
                : col,
            ])
          ),
        };
      });
    case 'CARD_MOVE':
      return updateBoard(state, action.boardId, (b) => {
        const { cardId, from, to, index } = action;
        if (!b.columns[from] || !b.columns[to]) return b;
        const source = b.columns[from].cardIds.filter((id) => id !== cardId);
        const target = from === to ? source : [...b.columns[to].cardIds];
        target.splice(index, 0, cardId);
        return {
          ...b,
          columns: {
            ...b.columns,
            [from]: { ...b.columns[from], cardIds: source },
            [to]: { ...b.columns[to], cardIds: target },
          },
        };
      });

    default:
      return state;
  }
}
