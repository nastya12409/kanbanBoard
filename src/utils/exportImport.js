import { uid } from './factory';

// Экспорт дошки в JSON-файл (Blob + временное ссылка)
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

// Разбор импортируемого файла: данные файла — недоверенные
export function parseBoard(text) {
  const data = JSON.parse(text); // SyntaxError при кривом JSON
  const valid =
    data &&
    typeof data.title === 'string' &&
    Array.isArray(data.columnOrder) &&
    data.columns &&
    data.cards &&
    data.columnOrder.every((id) => data.columns[id]);
  if (!valid) throw new Error('Неправильний формат файлу дошки');
  return { ...data, id: uid() }; // новый id: импорт не затирает дошки
}
