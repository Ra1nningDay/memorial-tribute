import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MemorialTribute from './components/MemorialTribute';
import TributeGallery from './components/TributeGallery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MemorialTribute />} />
        <Route path="/gallery" element={<TributeGallery />} />
      </Routes>
    </Router>
  );
}

export default App;
