import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setFormulusApi } from './services/formulusService';
import './index.css';

async function boot() {
  let formulusApi = null;

  // Try to load the Formulus bridge API (available when running inside Formulus WebView)
  if (typeof window.getFormulus === 'function') {
    try {
      formulusApi = await window.getFormulus();
      console.log('RentFreely: Formulus API loaded');
    } catch (err) {
      console.warn('RentFreely: Formulus API not available, running in browser mode', err);
    }
  } else {
    console.log('RentFreely: Running in browser mode (no Formulus shell)');
  }

  if (formulusApi) {
    setFormulusApi(formulusApi);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App formulusApi={formulusApi} />
    </React.StrictMode>
  );
}

boot();
