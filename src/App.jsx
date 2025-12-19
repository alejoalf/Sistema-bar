import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Salon from './pages/Salon';

// Componentes "Placeholder" para que no te de error el router,
// luego los crearemos de verdad.
const Cocina = () => <h2>Vista de Cocina (Próximamente)</h2>;
const Admin = () => <h2>Panel de Administración (Próximamente)</h2>;

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
