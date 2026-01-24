import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getMonthName(monthIndex: number): string {
  return new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date(2024, monthIndex, 1));
}

export function getCurrentDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { AttendanceRecord } from "./data";

export function checkConsecutiveAbsences(
  employeeId: string, 
  attendance: AttendanceRecord[], 
  threshold: number = 3
): boolean {
  // Get all records for this employee, sorted by date descending
  const employeeRecords = attendance
    .filter(r => r.employeeId === employeeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (employeeRecords.length < threshold) return false;

  // Check the most recent 'threshold' records
  let consecutiveAbsences = 0;
  
  // We need to check consecutive DAYS, not just records
  // But for simplicity in this version, we'll check consecutive 'absent' records
  // Assuming daily records are generated or we only care about recorded absences
  
  for (let i = 0; i < employeeRecords.length; i++) {
    if (employeeRecords[i].status === 'absent') {
      consecutiveAbsences++;
    } else {
      // Break if we find a present record
      break;
    }
  }

  return consecutiveAbsences >= threshold;
}
