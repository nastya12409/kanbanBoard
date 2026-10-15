import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from './Card';

const baseCard = {
  id: 'c1',
  title: 'Зробити макет',
  description: '',
  priority: 'medium',
  deadline: null,
  tags: ['design'],
  assignee: 'Оля',
  createdAt: 0,
};

describe('Card', () => {
  it('показує назву і теги', () => {
    render(<Card card={baseCard} onOpen={() => {}} />);
    expect(screen.getByText('Зробити макет')).toBeInTheDocument();
    expect(screen.getByText('#design')).toBeInTheDocument();
  });

  it('підсвічує прострочену картку (data-overdue)', () => {
    render(<Card card={{ ...baseCard, deadline: '2000-01-01' }} onOpen={() => {}} />);
    const article = screen.getByText('Зробити макет').closest('article');
    expect(article).toHaveAttribute('data-overdue', 'true');
    expect(article).toHaveAttribute('data-urgency', 'overdue');
    expect(screen.getByText(/Прострочено/)).toBeInTheDocument();
  });

  it('відкриває редагування по кліку', async () => {
    const onOpen = vi.fn();
    render(<Card card={baseCard} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Зробити макет'));
    expect(onOpen).toHaveBeenCalledWith('c1');
  });
});
