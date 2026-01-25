
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AttendanceRecord, Employee, EMPLOYEES, Location, LOCATIONS, PaymentRecord } from './data';

interface AppState {
  employees: Employee[];
  locations: Location[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  
  // Actions
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  toggleLocation: (locationId: string) => void;
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => void;
  removeAttendance: (employeeId: string, date: string) => void;
  markPaid: (employeeId: string, date: string, amount: number, extras?: number) => void;
  resetData: () => void;
  
  // Selectors
  getEmployeeAttendance: (employeeId: string, month: string) => AttendanceRecord[];
  getEmployeePayments: (employeeId: string, month: string) => PaymentRecord[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      employees: EMPLOYEES,
      locations: LOCATIONS,
      attendance: [],
      payments: [],

      updateEmployee: (id, data) => {
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        }));
      },

      toggleLocation: (locationId) => {
        set((state) => ({
          locations: state.locations.map((l) =>
            l.id === locationId ? { ...l, active: !l.active } : l
          ),
        }));
      },

      addAttendance: (record) => {
        set((state) => {
          // Prevent duplicates: Check if record already exists for this employee and date
          const exists = state.attendance.some(
            (r) => r.employeeId === record.employeeId && r.date === record.date
          );
          
          if (exists) {
            // Update existing record instead of adding duplicate
            return {
              attendance: state.attendance.map((r) => 
                (r.employeeId === record.employeeId && r.date === record.date)
                  ? { ...r, status: record.status, timestamp: Date.now() }
                  : r
              )
            };
          }

          return {
            attendance: [
              ...state.attendance,
              {
                ...record,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
              },
            ],
          };
        });
      },

      removeAttendance: (employeeId, date) => {
        set((state) => ({
          attendance: state.attendance.filter(
            (r) => !(r.employeeId === employeeId && r.date === date)
          ),
        }));
      },

      markPaid: (employeeId, date, amount, extras = 0) => {
        set((state) => {
          // Check if already paid
          const exists = state.payments.some(
            (p) => p.employeeId === employeeId && p.date === date
          );

          if (exists) return state;

          return {
            payments: [
              ...state.payments,
              {
                id: crypto.randomUUID(),
                employeeId,
                date,
                amount,
                extras,
                status: 'paid',
                period: date.substring(0, 7), // YYYY-MM
                timestamp: Date.now(),
              },
            ],
          };
        });
      },

      resetData: () => {
        set({ attendance: [], payments: [] });
      },

      getEmployeeAttendance: (employeeId: string, month: string) => {
        const { attendance } = get();
        return attendance.filter(
          (r) => r.employeeId === employeeId && r.date.startsWith(month)
        );
      },

      getEmployeePayments: (employeeId: string, month: string) => {
        const { payments } = get();
        return payments.filter(
          (p) => p.employeeId === employeeId && p.period === month
        );
      },
    }),
    {
      name: 'pagosys-storage',
    }
  )
);
