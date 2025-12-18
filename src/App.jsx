import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainNavbar from './components/layout/MainNavbar';
import Salon from './pages/Salon';

function App() {
  return (
    <Router>
      <div className="bg-light min-vh-100">
        <MainNavbar />
        <Routes>
          <Route path="/" element={<Salon />} />
          {/* Futuras rutas:
          <Route path="/login" element={<Login />} />
          <Route path="/cocina" element={<Cocina />} />
          */}
        </Routes>
      </div>
    </Router>
  );
}

export default App
