import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBarStore } from '../../store/useBarStore';
import { logout } from '../../services/auth';
import NavigationLinks from './NavigationLinks';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = useBarStore((state) => state.user);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.email ? user.email.split('@')[0] : 'Usuario';

  return (
    <div 
      className="d-none d-md-flex flex-column flex-shrink-0 p-3 text-white bg-dark" 
      style={{ width: '250px', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000 }}
    >
      {/* --- MARCA --- */}
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-4 fw-bold">HorusBar</span>
      </a>
      
      <hr />
      
      {/* --- MENÚ --- */}
      <NavigationLinks />
      
      <hr />
      
      {/* --- PERFIL DE USUARIO  --- */}
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