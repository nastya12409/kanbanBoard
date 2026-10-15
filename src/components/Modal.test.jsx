import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('закривається за Esc', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Картка" onClose={onClose}>
        <p>Текст</p>
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('має атрибути доступності діалогу', () => {
    render(
      <Modal title="Картка" onClose={() => {}}>
        <p>Текст</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Картка');
  });

  it('закривається кнопкою ✕', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Картка" onClose={onClose}>
        <p>Текст</p>
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
