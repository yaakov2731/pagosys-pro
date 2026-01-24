
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, getCurrentDateISO } from "@/lib/utils";
import { useLocation } from "wouter";

export default function PrintReport() {
  const { employees, locations, attendance, payments } = useStore();
  const [location] = useLocation();
  
  // Extract params from URL (simple query param parsing)
  const searchParams = new URLSearchParams(window.location.search);
  const month = searchParams.get("month") || getCurrentDateISO().substring(0, 7);
  const locationId = searchParams.get("location") || "all";

  const filteredEmployees = employees
    .filter(e => e.active && (locationId === "all" || e.locationId === locationId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const reportData = filteredEmployees.map(employee => {
    const monthlyAttendance = attendance.filter(
      r => r.employeeId === employee.id && 
      r.date.startsWith(month) && 
      r.status === 'present'
    );

    const totalEarned = monthlyAttendance.length * employee.dailyRate;
    
    const monthlyPayments = payments.filter(
      p => p.employeeId === employee.id && p.period === month
    );

    const totalPaid = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = totalEarned - totalPaid;

    return {
      employee,
      daysWorked: monthlyAttendance.length,
      totalEarned,
      totalPaid,
      pendingAmount
    };
  });

  const totals = reportData.reduce((acc, curr) => ({
    days: acc.days + curr.daysWorked,
    earned: acc.earned + curr.totalEarned,
    paid: acc.paid + curr.totalPaid,
    pending: acc.pending + curr.pendingAmount
  }), { days: 0, earned: 0, paid: 0, pending: 0 });

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 font-sans text-slate-900">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200">
        <div>
          <h2 className="font-bold text-lg">Vista de Impresión</h2>
          <p className="text-sm text-slate-500">Use Ctrl+P o Cmd+P para imprimir</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Imprimir Reporte
        </button>
      </div>

      {/* A4 Content Container */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-slate-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 overflow-hidden">
              <img src="/logo.png" alt="Docks Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase">Reporte de Pagos</h1>
              <p className="text-sm text-slate-500 font-medium">DOCKS DEL PUERTO - TIGRE</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">PERÍODO: {month}</p>
            <p className="text-sm text-slate-500">Generado: {formatDate(getCurrentDateISO())}</p>
            {locationId !== 'all' && (
              <p className="text-sm font-medium mt-1 text-blue-600 uppercase">
                Local: {locations.find(l => l.id === locationId)?.name}
              </p>
            )}
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-2 font-bold uppercase w-1/3">Empleado / Rol</th>
              <th className="text-center py-2 font-bold uppercase">Días</th>
              <th className="text-right py-2 font-bold uppercase">Jornal</th>
              <th className="text-right py-2 font-bold uppercase">Total</th>
              <th className="text-right py-2 font-bold uppercase">Pagado</th>
              <th className="text-right py-2 font-bold uppercase">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportData.map((row) => (
              <tr key={row.employee.id} className="break-inside-avoid">
                <td className="py-3 pr-4">
                  <div className="font-bold text-slate-900">{row.employee.name}</div>
                  <div className="text-xs text-slate-500 uppercase">{row.employee.role}</div>
                </td>
                <td className="py-3 text-center font-medium">{row.daysWorked}</td>
                <td className="py-3 text-right text-slate-600">{formatCurrency(row.employee.dailyRate)}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(row.totalEarned)}</td>
                <td className="py-3 text-right text-emerald-700">{formatCurrency(row.totalPaid)}</td>
                <td className={`py-3 text-right font-bold ${row.pendingAmount > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                  {formatCurrency(row.pendingAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-base">
              <td className="py-4 pl-2">TOTALES</td>
              <td className="py-4 text-center">{totals.days}</td>
              <td className="py-4 text-right">-</td>
              <td className="py-4 text-right">{formatCurrency(totals.earned)}</td>
              <td className="py-4 text-right text-emerald-700">{formatCurrency(totals.paid)}</td>
              <td className="py-4 text-right">{formatCurrency(totals.pending)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures Area */}
        <div className="mt-16 grid grid-cols-2 gap-16 break-inside-avoid">
          <div className="border-t border-slate-400 pt-2">
            <p className="text-xs font-bold uppercase text-slate-500 mb-8">Firma Responsable</p>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="text-xs font-bold uppercase text-slate-500 mb-8">Firma Gerencia</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Documento interno confidencial • Docks del Puerto
          </p>
        </div>
      </div>
    </div>
  );
}
