import React from 'react';
import { Nav, Dropdown } from 'react-bootstrap'; // Agregamos Dropdown
import { LayoutDashboard, Coffee, ClipboardList, Settings, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBarStore } from '../../store/useBarStore';
import { logout } from '../../services/auth';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useBarStore((state) => state.user); // Obtenemos el usuario real

  const isActive = (path) => location.pathname === path;
  const linkStyle = "d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded mb-1";
  const activeStyle = "bg-primary text-white";
  const inactiveStyle = "text-white-50 hover-text-white";

  // Función para cerrar sesión
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Nos aseguramos de mandarlo al login
  };

  // Obtenemos el nombre o email para mostrar (cortamos el email antes del @ para que quede corto)
  const displayName = user?.email ? user.email.split('@')[0] : 'Usuario';

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '250px', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000 }}>
      
      {/* --- MARCA --- */}
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-4 fw-bold">HorusBar</span>
      </a>
      
      <hr />
      
      {/* --- MENÚ --- */}
      <Nav className="flex-column mb-auto">
        <Link to="/" className={`${linkStyle} ${isActive('/') ? activeStyle : inactiveStyle}`}>
          <LayoutDashboard size={20} /> Salón
        </Link>
        <Link to="/cocina" className={`${linkStyle} ${isActive('/cocina') ? activeStyle : inactiveStyle}`}>
          <Coffee size={20} /> Cocina
        </Link>
        <Link to="/admin" className={`${linkStyle} ${isActive('/admin') ? activeStyle : inactiveStyle}`}>
          <Settings size={20} /> Admin
        </Link>
      </Nav>
      
      <hr />
      
      {/* --- PERFIL DE USUARIO (DROPDOWN) --- */}
      <Dropdown>
        <Dropdown.Toggle variant="dark" id="dropdown-basic" className="d-flex align-items-center w-100 text-white border-0 p-0">
            <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center me-2" style={{width: 32, height: 32}}>
                <User size={18} />
            </div>
            <strong>{displayName}</strong>
        </Dropdown.Toggle>

        <Dropdown.Menu className="shadow-lg">
            <Dropdown.Item disabled className="text-muted small">
                {user?.email}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
                <LogOut size={16} className="me-2"/> Cerrar Sesión
            </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default Sidebar;