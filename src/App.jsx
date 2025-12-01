import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy load components
const MemorialTribute = lazy(() => import('./components/MemorialTribute'));
const TributeGallery = lazy(() => import('./components/TributeGallery'));

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF8F5',
          color: '#D4AF37',
          fontFamily: "'Sarabun', sans-serif"
        }}>
          กำลังโหลด...
        </div>
      }>
        <Routes>
          <Route path="/" element={<MemorialTribute />} />
          <Route path="/gallery" element={<TributeGallery />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
