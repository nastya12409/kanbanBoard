import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/contexts';
import { BoardsProvider } from './context/BoardsContext';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import NotFoundPage from './pages/NotFoundPage';

function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="app-header">
      <Link to="/" className="logo">
        🗂 TaskFlow
      </Link>
      <button
        type="button"
        className="btn ghost"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      >
        {theme === 'dark' ? '☀️ Світла' : '🌙 Темна'}
      </button>
    </header>
  );
}

export default function App() {
  // Переключатель темы: атрибут на <html>, поэтому CSS-переменные мгновенно меняются
  useEffect(() => {
    document.title = 'TaskFlow — канбан-дошка';
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <BoardsProvider>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/board/:id" element={<BoardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </BoardsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
