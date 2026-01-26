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
  // Get all absence records for this employee, sorted by date descending
  const absenceRecords = attendance
    .filter(r => r.employeeId === employeeId && r.status === 'absent')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (absenceRecords.length < threshold) return false;

  // Check if the most recent absences are on consecutive calendar days
  let consecutiveAbsences = 1; // Start with the most recent absence

  for (let i = 0; i < absenceRecords.length - 1; i++) {
    const currentDate = new Date(absenceRecords[i].date);
    const nextDate = new Date(absenceRecords[i + 1].date);

    // Calculate the difference in days
    const diffTime = currentDate.getTime() - nextDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // If exactly 1 day apart, they are consecutive
    if (diffDays === 1) {
      consecutiveAbsences++;
      if (consecutiveAbsences >= threshold) {
        return true;
      }
    } else {
      // Not consecutive, reset counter and continue checking from this point
      consecutiveAbsences = 1;
    }
  }

  return consecutiveAbsences >= threshold;
}
