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