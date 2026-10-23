import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';


const SortableCard = memo(function SortableCard({ card, onOpen, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="card-item" {...attributes} {...listeners}>
      <Card card={card} onOpen={onOpen} />
    </li>
  );
});

export default SortableCard;
