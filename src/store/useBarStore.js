import { create } from 'zustand';

export const useBarStore = create((set) => ({
  mesaSeleccionada: null,
  seleccionarMesa: (mesa) => set({ mesaSeleccionada: mesa }),
  liberarMesa: () => set({ mesaSeleccionada: null }),

  user: null,
  setUser: (usuario) => set({ user: usuario }),
}));