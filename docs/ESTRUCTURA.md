# Guía de Estructura del Proyecto

## 📂 Organización de Carpetas

### `/src/components`
Componentes reutilizables organizados por feature:

#### `/layout`
- `MainNavbar.jsx` - Barra de navegación principal del sistema

#### `/mesas`
- `MesaCard.jsx` - Tarjeta visual de mesa con estados (libre, ocupada, pagando)

#### `/pedidos`
- (Pendiente) Componentes para gestión de pedidos y modales

### `/src/pages`
Vistas principales de la aplicación:
- `Salon.jsx` - Vista principal del salón con mapa de mesas

### `/src/services`
Servicios externos:
- `supabase.js` - Cliente configurado de Supabase (Auth + DB)

### `/src/store`
Estado global con Zustand:
- `useBarStore.js` - Store principal con gestión de mesa seleccionada

## 🎨 Convenciones de Código

### Componentes
- Usar PascalCase para nombres de archivo: `MesaCard.jsx`
- Usar React Bootstrap para todos los componentes UI
- Iconos desde `lucide-react`

### Estado
- Zustand para estado global
- Estados locales con `useState` cuando sea necesario

### Estilos
- React Bootstrap como framework principal
- Clases de Bootstrap: `bg-light`, `min-vh-100`, `mb-4`, etc.
- CSS custom solo cuando sea estrictamente necesario

## 🔄 Flujo de Datos

```
Usuario hace click en Mesa
    ↓
MesaCard.onClick()
    ↓
useBarStore.seleccionarMesa()
    ↓
Estado global actualizado
    ↓
(Futuro) Modal de pedido se abre
```

## 🚀 Próximas Features a Implementar

1. **Modal de Pedidos**
   - Componente: `/components/pedidos/ModalPedido.jsx`
   - Integración con Supabase para guardar pedidos

2. **Vista de Cocina**
   - Página: `/pages/Cocina.jsx`
   - Realtime de Supabase para actualización automática

3. **Autenticación**
   - Página: `/pages/Login.jsx`
   - Supabase Auth con email/password

4. **Admin Panel**
   - Página: `/pages/Admin.jsx`
   - CRUD de productos y categorías
