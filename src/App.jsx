import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase'; // Importamos directo para escuchar cambios

import DashboardLayout from './components/layout/DashboardLayout';
import Salon from './pages/Salon';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { useBarStore } from './store/useBarStore';
import Historial from './pages/Historial';
import CierreCaja from './pages/CierreCaja';
import PedidosActivos from './pages/PedidosActivos';

// Componente para Rutas Protegidas
// Si no hay usuario, te manda al Login. Si hay, te muestra el contenido.
const RutaProtegida = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const setUser = useBarStore((state) => state.setUser); // Acción de Zustand
  const [loading, setLoading] = useState(true);
  
  // Estado local para rutas protegidas, pero también guardamos en el store global para el Sidebar
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    // 1. Carga inicial - Verificamos si hay sesión activa
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionUser(user);
      setUser(user); // Guardamos en Zustand para el Sidebar
      setLoading(false);
    });

    // 2. Escuchar cambios (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setSessionUser(currentUser);
      setUser(currentUser); // Guardamos en Zustand para el Sidebar
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) return <div className="text-center mt-5">Cargando sistema...</div>;

  return (
    <Router>
      <Routes>
        {/* Ruta Pública: Login (Sin Layout) */}
        <Route path="/login" element={ !sessionUser ? <Login /> : <Navigate to="/" /> } />

        {/* Rutas Privadas (Con Layout) */}
        <Route path="/*" element={
          <RutaProtegida user={sessionUser}>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Salon />} />
                <Route path="/pedidos" element={<PedidosActivos />} />
                <Route path="/historial" element={<Historial />} />
                <Route path="/cierre" element={<CierreCaja />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </DashboardLayout>
          </RutaProtegida>
        } />
      </Routes>
    </Router>
  );
}

export default App;