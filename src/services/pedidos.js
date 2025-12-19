import { supabase } from './supabase';

export const crearPedido = async (mesaId, items, total) => {
  try {
    // 1. Crear la cabecera del pedido (Tabla 'pedidos')
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        { 
          mesa_id: mesaId, 
          estado: 'pendiente', // 'pendiente' significa que va a cocina
          total: total 
        }
      ])
      .select() // Importante: devuelve el dato insertado para tener el ID
      .single();

    if (pedidoError) throw pedidoError;

    const pedidoId = pedidoData.id;

    // 2. Preparar los detalles (Tabla 'detalle_pedidos')
    const detalles = items.map(item => ({
      pedido_id: pedidoId,
      producto_id: item.id,
      cantidad: 1, // Por simplicidad asumimos 1 por item del array
      precio_unitario: item.precio
    }));

    const { error: detalleError } = await supabase
      .from('detalle_pedidos')
      .insert(detalles);

    if (detalleError) throw detalleError;

    // 3. (Opcional) Restar Stock - Lo hacemos simple por ahora
    // Recorremos los items y restamos 1 al stock
    for (const item of items) {
        await supabase.rpc('restar_stock', { p_id: item.id, p_cantidad: 1 });
    }

    return pedidoId;

  } catch (error) {
    console.error('Error creando pedido:', error);
    throw error;
  }
};

// Obtener la cuenta actual de la mesa (Pedidos no cobrados)
export const getCuentaMesa = async (mesaId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      total,
      estado,
      created_at,
      detalle_pedidos (
        cantidad,
        precio_unitario,
        productos (nombre)
      )
    `)
    .eq('mesa_id', mesaId)
    .neq('estado', 'cobrado'); // Traer todo lo que NO esté cobrado ya

  if (error) {
    console.error('Error al traer cuenta:', error);
    return [];
  }
  return data;
};

// Cobrar mesa 
export const cobrarMesa = async (mesaId) => {
  // 1. Marcar pedidos como cobrados
  const { error: errorPedidos } = await supabase
    .from('pedidos')
    .update({ estado: 'cobrado' })
    .eq('mesa_id', mesaId)
    .neq('estado', 'cobrado');

  if (errorPedidos) throw errorPedidos;

  // 2. Liberar la mesa 
  const { error: errorMesa } = await supabase
    .from('mesas')
    .update({ estado: 'libre' })
    .eq('id', mesaId);

  if (errorMesa) throw errorMesa;
};

// Obtener historial de ventas (Pedidos cobrados)
export const getHistorialVentas = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      created_at,
      total,
      estado,
      mesas (numero_mesa),
      detalle_pedidos (
        id,
        cantidad,
        precio_unitario,
        productos (
          nombre,
          categoria
        )
      )
    `)
    .eq('estado', 'cobrado') // Solo ventas cerradas
    .order('created_at', { ascending: false }); // Lo más nuevo arriba

  if (error) {
    console.error('Error cargando historial:', error);
    return [];
  }
  return data;
};