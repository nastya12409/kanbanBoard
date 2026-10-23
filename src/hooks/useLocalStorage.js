import { useEffect, useState } from 'react';


export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue; // кривой JSON или сховище недоступне
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* квота вичерпана — мовчки ігноруємо */
    }
  }, [key, value]);

  return [value, setValue];
}
