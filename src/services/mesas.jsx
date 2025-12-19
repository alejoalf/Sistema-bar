import { supabase } from './supabase';

// Datos mock para cuando Supabase no esté configurado
const mesasMock = [
  { id: '1', numero_mesa: 1, estado: 'libre', capacidad: 4 },
  { id: '2', numero_mesa: 2, estado: 'ocupada', capacidad: 4 },
  { id: '3', numero_mesa: 3, estado: 'pagando', capacidad: 2 },
  { id: '4', numero_mesa: 4, estado: 'libre', capacidad: 6 },
  { id: '5', numero_mesa: 5, estado: 'libre', capacidad: 4 },
  { id: '6', numero_mesa: 6, estado: 'ocupada', capacidad: 4 },
];

// Obtener todas las mesas ordenadas por número
export const getMesas = async () => {
  // Si no hay configuración de Supabase, usar datos mock
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 Usando datos MOCK (configura Supabase en .env)');
    return mesasMock;
  }

  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero_mesa', { ascending: true });

  if (error) {
    console.error('Error cargando mesas:', error);
    console.log('🎭 Fallback a datos MOCK');
    return mesasMock;
  }
  return data || [];
};

// Función para cambiar estado (la usaremos pronto)
export const updateEstadoMesa = async (id, nuevoEstado) => {
  const { error } = await supabase
    .from('mesas')
    .update({ estado: nuevoEstado })
    .eq('id', id);
    
  if (error) throw error;
};

// ... (manten lo que ya tenias arriba: getMesas)

// Función para abrir la mesa (Marcar como ocupada)
export const abrirMesa = async (idMesa) => {
  // Si no hay Supabase configurado, simular éxito
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 MOCK: Mesa abierta (ID:', idMesa, ')');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
    return;
  }

  const { error } = await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', idMesa);
    
  if (error) throw error;
};

// Función para cerrar la mesa (Liberar)
export const cerrarMesa = async (idMesa) => {
  // Si no hay Supabase configurado, simular éxito
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.log('🎭 MOCK: Mesa cerrada (ID:', idMesa, ')');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
    return;
  }

  const { error } = await supabase
    .from('mesas')
    .update({ estado: 'libre' })
    .eq('id', idMesa);

  if (error) throw error;
};