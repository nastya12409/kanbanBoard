import { uid } from './factory';


export function exportBoard(board) {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = board.title.replace(/\s+/g, '_') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}


export function parseBoard(text) {
  const data = JSON.parse(text);
  const valid =
    data &&
    typeof data.title === 'string' &&
    Array.isArray(data.columnOrder) &&
    data.columns &&
    data.cards &&
    data.columnOrder.every((id) => data.columns[id]);
  if (!valid) throw new Error('Неправильний формат файлу дошки');
  return { ...data, id: uid() }; 
}
