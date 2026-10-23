// Модель данных: всё создаётся здесь, чтобы reducer оставался чистым
export const uid = () => crypto.randomUUID();

export const PRIORITIES = ['low', 'medium', 'high'];

export const createCard = (title) => ({
  id: uid(),
  title,
  description: '',
  priority: 'medium', 
  deadline: null, 
  tags: [],
  assignee: '',
  createdAt: Date.now(),
});

export const createColumn = (title) => ({ id: uid(), title, cardIds: [] });

export const createBoard = (title) => {
  const columns = ['To Do', 'In Progress', 'Done'].map(createColumn);
  return {
    id: uid(),
    title,
    columnOrder: columns.map((c) => c.id),
    columns: Object.fromEntries(columns.map((c) => [c.id, c])),
    cards: {},
  };
};

export const initialState = { boards: {}, boardOrder: [] };


export const emptyBoard = () => ({
  id: uid(),
  title: 'Імпортована дошка',
  columnOrder: [],
  columns: {},
  cards: {},
});
