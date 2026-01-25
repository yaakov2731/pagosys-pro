
export interface Employee {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  locationId: string;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO YYYY-MM-DD
  status: 'present' | 'absent';
  timestamp: number;
}

export interface PaymentRecord {
  id: string;
  employeeId: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  extras: number; // Overtime or bonuses
  status: 'paid' | 'pending';
  period: string; // YYYY-MM
  timestamp: number;
}

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  note?: string;
  period: string; // YYYY-MM
  timestamp: number;
}

export const LOCATIONS: Location[] = [
  { id: 'umo', name: 'UMO', active: true },
  { id: 'brooklyn', name: 'BROOKLYN', active: true },
  { id: 'trento', name: 'TRENTO', active: true },
  { id: 'inflables', name: 'INFLABLES', active: true },
  { id: 'rustica', name: 'RUSTICA', active: true },
  { id: 'puerto_gelato', name: 'PUERTO GELATO', active: true },
];

export const EMPLOYEES: Employee[] = [
  // UMO
  { id: 'jose_humano', name: 'Jose Humano', role: 'Cocinero', dailyRate: 70000, locationId: 'umo', active: true },
  { id: 'victor_gaucho', name: 'Victor Gaucho', role: 'Parrillero', dailyRate: 70000, locationId: 'umo', active: true },
  { id: 'ruth_coronel', name: 'Ruth Coronel', role: 'Encargada', dailyRate: 55000, locationId: 'umo', active: true },
  { id: 'tito', name: 'Tito', role: 'Ayudante Parrillero', dailyRate: 55000, locationId: 'umo', active: true },
  { id: 'marcos_enrique', name: 'Marcos Enrique', role: 'Ayudante Parrillero', dailyRate: 40000, locationId: 'umo', active: true },
  { id: 'ayelen', name: 'Ayelen', role: 'Ayudante de Cocina', dailyRate: 40000, locationId: 'umo', active: true },
  { id: 'romina_meza', name: 'Romina Meza', role: 'Ayudante de Cocina', dailyRate: 40000, locationId: 'umo', active: true },
  { id: 'micaela', name: 'Micaela', role: 'Cajera', dailyRate: 35000, locationId: 'umo', active: true },
  { id: 'gregorio', name: 'Gregorio', role: 'Bachero', dailyRate: 35000, locationId: 'umo', active: true },
  { id: 'ariana', name: 'Ariana', role: 'Recepcionista', dailyRate: 35000, locationId: 'umo', active: true },
  { id: 'johana', name: 'Johana', role: 'Camarera', dailyRate: 30000, locationId: 'umo', active: true },
  { id: 'sofia_vidal', name: 'Sofia Vidal', role: 'Camarera', dailyRate: 30000, locationId: 'umo', active: true },
  { id: 'belen', name: 'Belen', role: 'Camarera', dailyRate: 30000, locationId: 'umo', active: true },
  { id: 'mia_diaz', name: 'Mia Diaz', role: 'Comis', dailyRate: 30000, locationId: 'umo', active: true },
  { id: 'virginia', name: 'Virginia', role: 'Camarera', dailyRate: 37000, locationId: 'umo', active: true },

  // BROOKLYN
  { id: 'maru', name: 'Maru', role: 'Cocinera', dailyRate: 50000, locationId: 'brooklyn', active: true },
  { id: 'ayelen_enriques', name: 'Ayelen Enriques', role: 'Cajera', dailyRate: 35000, locationId: 'brooklyn', active: true },

  // TRENTO
  { id: 'angelica_zapata', name: 'Angelica Zapata', role: 'Cocinera', dailyRate: 50000, locationId: 'trento', active: true },
  { id: 'ayelen_diaz', name: 'Ayelen Diaz', role: 'Barista', dailyRate: 40000, locationId: 'trento', active: true },
  { id: 'julieta', name: 'Julieta', role: 'Cajera', dailyRate: 40000, locationId: 'trento', active: true },

  // INFLABLES
  { id: 'thiago', name: 'Thiago', role: 'Operario', dailyRate: 35000, locationId: 'inflables', active: true },
  { id: 'thomas', name: 'Thomas', role: 'Operario', dailyRate: 35000, locationId: 'inflables', active: true },

  // PUERTO GELATO
  { id: 'alexia', name: 'Alexia', role: 'Cajera', dailyRate: 50000, locationId: 'puerto_gelato', active: true },
  { id: 'nadia_aveiro', name: 'Nadia Aveiro', role: 'Cajera', dailyRate: 45000, locationId: 'puerto_gelato', active: true },
  { id: 'keila_aguirre', name: 'Keila Aguirre', role: 'Despachante', dailyRate: 35000, locationId: 'puerto_gelato', active: true },
  { id: 'araceli', name: 'Araceli', role: 'Despachante', dailyRate: 30000, locationId: 'puerto_gelato', active: true },
];
