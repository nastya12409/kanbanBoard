import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Модалка через Portal: Esc закрывает, клик по фону закрывает,
// прокрутка страницы блокируется, фокус возвращается на кнопку-открыватель.
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    // Фокус на первое поле внутри окна
    ref.current?.querySelector('input, select, textarea, button')?.focus();

    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.(); // возвращаем фокус туда, откуда открыли
    };
  }, [onClose]);

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрити">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
