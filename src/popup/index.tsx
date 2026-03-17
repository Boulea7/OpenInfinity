import '../newtab/i18n';  // Initialize i18n for popup
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import '../newtab/styles/globals.css';  // Reuse Tailwind CSS
import { installChunkLoadRecovery } from '../shared/chunkRecovery';

installChunkLoadRecovery();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
