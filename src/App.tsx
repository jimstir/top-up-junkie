import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TopBar from './components/TopBar';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <TopBar />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
