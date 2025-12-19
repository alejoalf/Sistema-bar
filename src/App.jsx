import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Salon from './pages/Salon';
import Admin from './pages/Admin';

const Cocina = () => <h2>Vista de Cocina (Próximamente)</h2>;

function App() {
  return (
    <Router>
        <DashboardLayout>
            <Routes>
                <Route path="/" element={<Salon />} />
                <Route path="/cocina" element={<Cocina />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </DashboardLayout>
    </Router>
  );
}

export default App;
