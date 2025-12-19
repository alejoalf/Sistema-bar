import { supabase } from './supabase';

// Iniciar sesión con Email y Contraseña
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Cerrar sesión
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Obtener usuario actual (si existe)
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};