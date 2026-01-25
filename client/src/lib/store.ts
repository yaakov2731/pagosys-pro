
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvanceRecord, AttendanceRecord, Employee, EMPLOYEES, ExtraRecord, Location, LOCATIONS, PaymentRecord } from './data';

interface AppState {
  employees: Employee[];
  locations: Location[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  advances: AdvanceRecord[];
  extras: ExtraRecord[];
  
  // Actions
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  toggleLocation: (locationId: string) => void;
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => void;
  removeAttendance: (employeeId: string, date: string) => void;
  markPaid: (employeeId: string, date: string, amount: number, extras?: number) => void;
  addAdvance: (employeeId: string, amount: number, date: string, note?: string) => void;
  removeAdvance: (id: string) => void;
  addExtra: (employeeId: string, amount: number, date: string, hours?: number, note?: string) => void;
  removeExtra: (id: string) => void;
  resetData: () => void;
  
  // Selectors
  getEmployeeAttendance: (employeeId: string, month: string) => AttendanceRecord[];
  getEmployeePayments: (employeeId: string, month: string) => PaymentRecord[];
  getEmployeeAdvances: (employeeId: string, month: string) => AdvanceRecord[];
  getEmployeeExtras: (employeeId: string, month: string) => ExtraRecord[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      employees: EMPLOYEES,
      locations: LOCATIONS,
      attendance: [],
      payments: [],
      advances: [],
      extras: [],

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

      addAdvance: (employeeId, amount, date, note) => {
        set((state) => ({
          advances: [
            ...state.advances,
            {
              id: crypto.randomUUID(),
              employeeId,
              amount,
              date,
              note,
              period: date.substring(0, 7),
              timestamp: Date.now(),
            },
          ],
        }));
      },

      removeAdvance: (id) => {
        set((state) => ({
          advances: state.advances.filter((a) => a.id !== id),
        }));
      },

      addExtra: (employeeId, amount, date, hours, note) => {
        set((state) => ({
          extras: [
            ...state.extras,
            {
              id: crypto.randomUUID(),
              employeeId,
              amount,
              date,
              hours,
              note,
              period: date.substring(0, 7),
              timestamp: Date.now(),
            },
          ],
        }));
      },

      removeExtra: (id) => {
        set((state) => ({
          extras: state.extras.filter((e) => e.id !== id),
        }));
      },

      resetData: () => {
        set({ attendance: [], payments: [], advances: [], extras: [] });
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

      getEmployeeAdvances: (employeeId: string, month: string) => {
        const { advances } = get();
        return advances.filter(
          (a) => a.employeeId === employeeId && a.period === month
        );
      },

      getEmployeeExtras: (employeeId: string, month: string) => {
        const { extras } = get();
        return extras.filter(
          (e) => e.employeeId === employeeId && e.period === month
        );
      },
    }),
    {
      name: 'pagosys-storage',
    }
  )
);
