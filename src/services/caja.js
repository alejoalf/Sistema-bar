import { supabase } from './supabase';

const mockMovimientos = [];

// Registrar una extracción de caja
export const registrarExtraccion = async (monto, motivo, usuario = null) => {
  // Sin supabase configurado: mock en memoria
  if (!import.meta.env.VITE_SUPABASE_URL) {
    const mock = {
      id: `mock-${Date.now()}`,
      tipo: 'extraccion',
      monto: Number(monto) || 0,
      motivo: motivo || 'Sin motivo',
      created_at: new Date().toISOString(),
      usuario
    };
    mockMovimientos.unshift(mock);
    return mock;
  }

  const payload = {
    tipo: 'extraccion',
    monto: Number(monto) || 0,
    motivo: motivo || 'Sin motivo',
    usuario
  };

  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Obtener extracciones registradas
export const getExtracciones = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return mockMovimientos;
  }

  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('id, tipo, monto, motivo, created_at, usuario')
    .eq('tipo', 'extraccion')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
};
