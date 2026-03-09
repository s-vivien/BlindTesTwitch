import { createRoot } from 'react-dom/client';
import './index.scss';
import App from './app';
import { BrowserRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root')!);

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

root.render(
  // <React.StrictMode>
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
  // </React.StrictMode>
);
