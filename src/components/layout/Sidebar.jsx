import React from 'react';
import { Nav } from 'react-bootstrap';
import { LayoutDashboard, Coffee, ClipboardList, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  // Función para saber si el link está activo
  const isActive = (path) => location.pathname === path;

  // Estilo base para los links
  const linkStyle = "d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded mb-1";
  const activeStyle = "bg-primary text-white"; // Azul cuando está activo
  const inactiveStyle = "text-white-50 hover-text-white"; // Gris cuando no

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '250px', height: '100vh', position: 'fixed', left: 0, top: 0 }}>
      
      {/* --- LOGO / MARCA --- */}
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-4 fw-bold">HorusBar</span>
      </a>
      
      <hr />
      
      {/* --- MENÚ DE NAVEGACIÓN --- */}
      <Nav className="flex-column mb-auto">
        <Link to="/" className={`${linkStyle} ${isActive('/') ? activeStyle : inactiveStyle}`}>
          <LayoutDashboard size={20} />
          Salón (Mesas)
        </Link>
        
        <Link to="/cocina" className={`${linkStyle} ${isActive('/cocina') ? activeStyle : inactiveStyle}`}>
          <Coffee size={20} />
          Cocina
        </Link>
        
        <Link to="/historial" className={`${linkStyle} ${isActive('/historial') ? activeStyle : inactiveStyle}`}>
          <ClipboardList size={20} />
          Historial Pedidos
        </Link>

        <Link to="/admin" className={`${linkStyle} ${isActive('/admin') ? activeStyle : inactiveStyle}`}>
          <Settings size={20} />
          Administración
        </Link>
      </Nav>
      
      <hr />
      
      {/* --- USUARIO / LOGOUT --- */}
      <div className="dropdown">
        <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2" />
          <strong>Admin</strong>
        </a>
        <Nav className="mt-2">
            <Nav.Link className="text-white-50"><LogOut size={16}/> Cerrar Sesión</Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;