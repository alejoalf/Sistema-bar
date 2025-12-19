<<<<<<< HEAD
# 🍷 Sistema de Gestión para Bar

Dashboard completo de gestión para bares con mapa de mesas, gestión de pedidos y cocina en tiempo real.

## 🚀 Stack Técnico

- **Frontend**: React 19 + Vite
- **UI Framework**: React Bootstrap (sin Tailwind)
- **Estado Global**: Zustand
- **Backend/DB**: Supabase (Auth + Postgres + Realtime)
- **Iconos**: Lucide React
- **Router**: React Router DOM v7

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── layout/          # Navbar y componentes de estructura
│   ├── mesas/           # Componentes relacionados con mesas
│   └── pedidos/         # Modales y componentes de pedidos
├── pages/               # Vistas principales (Salón, Cocina, etc)
├── services/            # Conexión a Supabase
├── store/               # Estado global con Zustand
├── App.jsx              # Configuración de rutas
└── main.jsx             # Punto de entrada
```

## ⚙️ Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno



### 3. Ejecutar en desarrollo

```bash
npm run dev
```

## 🎯 Features Implementadas

### ✅ Vista del Salón
- Mapa de mesas con estados visuales (libre, ocupada, pagando)
- Tarjetas de mesa con React Bootstrap
- Integración con Zustand para selección de mesas

## 🔜 Próximos Pasos

- [ ] Modal de gestión de pedidos
- [ ] Vista de cocina en tiempo real
- [ ] Sistema de autenticación con Supabase
- [ ] Conexión real con base de datos
- [ ] Panel de administración

## 📝 Arquitectura

Este proyecto sigue una **arquitectura por features**, donde cada funcionalidad está organizada en su propia carpeta con sus componentes, lógica y servicios relacionados.

## 🎨 Estilo

El proyecto utiliza **React Bootstrap** para todos los componentes visuales, manteniendo un diseño consistente y responsive sin necesidad de CSS personalizado extenso

## React Compiler


