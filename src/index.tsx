import React from 'react';
import ReactDOM from 'react-dom/client';
import './polyfills.js';
import App from './App.tsx';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
