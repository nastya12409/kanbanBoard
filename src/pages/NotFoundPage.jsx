import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page center">
      <h1>404</h1>
      <p>Сторінку не знайдено</p>
      <Link to="/" className="btn primary">
        На головну
      </Link>
    </div>
  );
}
