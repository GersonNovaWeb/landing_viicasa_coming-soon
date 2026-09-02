import { create } from 'zustand';
import { initialData } from './mockData';

type StoreState = {
  properties: any[];
  customers: any[];
  reservations: any[];
  products: any[];
  orders: any[];
  transactions: any[];
  notifications: any[];
  messages: any[];
  
  // Actions
  addProperty: (prop: any) => void;
  updateProperty: (id: string, prop: any) => void;
  deleteProperty: (id: string) => void;
  
  addReservation: (res: any) => void;
  updateReservation: (id: string, res: any) => void;
  
  markNotificationRead: (id: string) => void;
};

export const useStore = create<StoreState>((set) => ({
  properties: initialData.properties,
  customers: initialData.customers,
  reservations: initialData.reservations,
  products: initialData.products,
  orders: initialData.orders,
  transactions: initialData.transactions,
  notifications: initialData.notifications,
  messages: initialData.messages,

  addProperty: (prop) => set((state) => ({ properties: [prop, ...state.properties] })),
  updateProperty: (id, prop) => set((state) => ({
    properties: state.properties.map(p => p.id === id ? { ...p, ...prop } : p)
  })),
  deleteProperty: (id) => set((state) => ({
    properties: state.properties.filter(p => p.id !== id)
  })),
  
  addReservation: (res) => set((state) => ({ reservations: [res, ...state.reservations] })),
  updateReservation: (id, res) => set((state) => ({
    reservations: state.reservations.map(r => r.id === id ? { ...r, ...res } : r)
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  }))
}));
