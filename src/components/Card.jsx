import { memo } from 'react';
import { deadlineLabel, isOverdue, urgencyOf } from '../utils/filters';

const PRIORITY_LABEL = { low: 'низький', medium: 'середній', high: 'високий' };

// Карточка мемоизирована: правка одной не перерисовывает остальные.
// data-overdue и data-urgency — атрибуты для тестов и стилей.
const Card = memo(function Card({ card, onOpen }) {
  const urgency = urgencyOf(card.deadline);
  const overdue = isOverdue(card.deadline);

  return (
    <article
      className="card"
      onClick={() => onOpen?.(card.id)}
      data-overdue={overdue ? 'true' : 'false'}
      data-urgency={urgency}
    >
      <div className="card-top">
        <h4 className="card-title">{card.title}</h4>
        <span className={`pill priority-${card.priority}`} title={`Пріоритет: ${PRIORITY_LABEL[card.priority]}`}>
          {card.priority}
        </span>
      </div>

      {card.description && <p className="card-desc">{card.description}</p>}

      {/* МОЯ ФИЧА: напоминание о дедлайне */}
      {card.deadline && (
        <div className={`deadline deadline-${urgency}`}>
          <span className="deadline-date">{card.deadline}</span>
          <span className="deadline-label">{deadlineLabel(card.deadline)}</span>
        </div>
      )}

      {card.tags.length > 0 && (
        <ul className="tags">
          {card.tags.map((t) => (
            <li key={t} className="tag">
              #{t}
            </li>
          ))}
        </ul>
      )}

      {card.assignee && <div className="card-assignee">👤 {card.assignee}</div>}
    </article>
  );
});

export default Card;
