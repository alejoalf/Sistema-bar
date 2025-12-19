import React from 'react';
import { Nav } from 'react-bootstrap';
import { LayoutDashboard, Coffee, FileText, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavigationLinks = ({ onLinkClick, mobile = false }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  const linkStyle = mobile 
    ? "d-flex align-items-center gap-3 px-3 py-3 text-decoration-none rounded mb-2"
    : "d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded mb-1";
    
  const activeStyle = "bg-primary text-white";
  const inactiveStyle = mobile ? "text-dark" : "text-white-50 hover-text-white";

  const handleClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <Nav className="flex-column mb-auto">
      <Link 
        to="/" 
        className={`${linkStyle} ${isActive('/') ? activeStyle : inactiveStyle}`}
        onClick={handleClick}
      >
        <LayoutDashboard size={20} /> Salón
      </Link>
      <Link 
        to="/cocina" 
        className={`${linkStyle} ${isActive('/cocina') ? activeStyle : inactiveStyle}`}
        onClick={handleClick}
      >
        <Coffee size={20} /> Cocina
      </Link>
      <Link 
        to="/historial" 
        className={`${linkStyle} ${isActive('/historial') ? activeStyle : inactiveStyle}`}
        onClick={handleClick}
      >
        <FileText size={20} /> Historial
      </Link>
      <Link 
        to="/admin" 
        className={`${linkStyle} ${isActive('/admin') ? activeStyle : inactiveStyle}`}
        onClick={handleClick}
      >
        <Settings size={20} /> Admin
      </Link>
    </Nav>
  );
};

export default NavigationLinks;
