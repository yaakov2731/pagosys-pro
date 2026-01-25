
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, getCurrentDateISO } from "@/lib/utils";
import { useLocation } from "wouter";
import { Mail, Printer, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PrintReport() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const { employees, locations, attendance, payments } = useStore();
  const [location] = useLocation();
  
  // Extract params from URL
  const searchParams = new URLSearchParams(window.location.search);
  const month = searchParams.get("month") || getCurrentDateISO().substring(0, 7);
  const locationId = searchParams.get("location") || "all";

  // Filter employees based on selection
  const activeEmployees = employees
    .filter(e => e.active && (locationId === "all" || e.locationId === locationId))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Process data per employee
  const employeeData = activeEmployees.map(employee => {
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

  // Group by location
  const groupedData = locations
    .filter(loc => locationId === "all" || loc.id === locationId)
    .map(loc => {
      const locEmployees = employeeData.filter(d => d.employee.locationId === loc.id);
      if (locEmployees.length === 0) return null;

      const totals = locEmployees.reduce((acc, curr) => ({
        earned: acc.earned + curr.totalEarned,
        paid: acc.paid + curr.totalPaid,
        pending: acc.pending + curr.pendingAmount
      }), { earned: 0, paid: 0, pending: 0 });

      return {
        location: loc,
        employees: locEmployees,
        totals
      };
    })
    .filter(Boolean);

  // Calculate Global Totals
  const globalTotals = groupedData.reduce((acc, curr) => ({
    earned: acc.earned + (curr?.totals.earned || 0),
    paid: acc.paid + (curr?.totals.paid || 0),
    pending: acc.pending + (curr?.totals.pending || 0)
  }), { earned: 0, paid: 0, pending: 0 });

  const Logo = () => (
    <div className="w-12 h-12 grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden shrink-0 print:border print:border-slate-200">
      <div className="bg-[#f97316] print:bg-slate-800"></div>
      <div className="bg-[#16a34a] print:bg-slate-600"></div>
      <div className="bg-[#eab308] print:bg-slate-400"></div>
      <div className="bg-[#3b82f6] print:bg-slate-900"></div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 font-sans text-slate-900">
      {/* Print Controls */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Vista de Impresión</h2>
          <p className="text-sm text-slate-500">Se generará una hoja A4 por cada local.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-300">
                <Mail className="w-4 h-4" />
                Enviar por Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Reporte por Email</DialogTitle>
                <DialogDescription>
                  Se abrirá tu cliente de correo con un resumen del reporte listo para enviar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Destinatario</Label>
                  <Input
                    id="email"
                    placeholder="gerencia@docks.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (!email) {
                      toast.error("Ingresa un email válido");
                      return;
                    }
                    setIsSending(true);
                    
                    // Simulate sending delay
                    setTimeout(() => {
                      const subject = `Reporte de Pagos - ${month}`;
                      const body = `Adjunto el reporte de pagos del período ${month}.\n\nResumen:\nTotal a Pagar: ${formatCurrency(globalTotals.earned)}\nTotal Pagado: ${formatCurrency(globalTotals.paid)}\nSaldo Pendiente: ${formatCurrency(globalTotals.pending)}\n\nSaludos,\nDocks del Puerto`;
                      
                      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      
                      setIsSending(false);
                      setIsEmailOpen(false);
                      toast.success("Cliente de correo abierto");
                    }, 1000);
                  }} 
                  disabled={isSending}
                >
                  {isSending ? "Abriendo..." : "Redactar Correo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => window.print()}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* SUMMARY PAGE (Only if viewing ALL locations) */}
      {locationId === "all" && (
        <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:h-screen print:break-after-page flex flex-col">
          <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-4">
              <Logo />
              <div>
                <h1 className="text-3xl font-bold tracking-tight uppercase">Resumen Ejecutivo</h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Docks del Puerto • Gerencia</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">PERÍODO: {month}</p>
              <p className="text-xs text-slate-500">Generado: {formatDate(getCurrentDateISO())}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total a Pagar</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(globalTotals.earned)}</p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Pagado</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(globalTotals.paid)}</p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(globalTotals.pending)}</p>
            </div>
          </div>

          <h3 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">Desglose por Local</h3>
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b border-slate-900">
                <th className="text-left py-3 font-bold uppercase">Local</th>
                <th className="text-center py-3 font-bold uppercase">Empleados</th>
                <th className="text-right py-3 font-bold uppercase">Total</th>
                <th className="text-right py-3 font-bold uppercase">Pagado</th>
                <th className="text-right py-3 font-bold uppercase">Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedData.map((group) => (
                <tr key={group?.location.id}>
                  <td className="py-3 font-bold">{group?.location.name}</td>
                  <td className="py-3 text-center">{group?.employees.length}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(group?.totals.earned || 0)}</td>
                  <td className="py-3 text-right text-emerald-700">{formatCurrency(group?.totals.paid || 0)}</td>
                  <td className="py-3 text-right font-bold">{formatCurrency(group?.totals.pending || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-auto pt-8 border-t border-slate-200">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">
                Documento confidencial para uso exclusivo de gerencia
             </p>
          </div>
        </div>
      )}

      {/* INDIVIDUAL LOCATION PAGES */}
      {groupedData.map((group, index) => (
        <div key={group?.location.id} className="max-w-[210mm] mx-auto bg-white print:max-w-none print:h-screen print:break-after-page flex flex-col relative pt-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-4">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold tracking-tight uppercase">Reporte de Pagos</h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Local: <span className="text-blue-600">{group?.location.name}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">PERÍODO: {month}</p>
              <p className="text-xs text-slate-500">Generado: {formatDate(getCurrentDateISO())}</p>
            </div>
          </div>

          {/* Main Table */}
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-50">
                <th className="text-left py-3 pl-2 font-bold uppercase w-1/3">Empleado / Rol</th>
                <th className="text-center py-3 font-bold uppercase">Días Trab.</th>
                <th className="text-right py-3 font-bold uppercase">Jornal</th>
                <th className="text-right py-3 font-bold uppercase">A Pagar</th>
                <th className="text-right py-3 font-bold uppercase">Pagado</th>
                <th className="text-right py-3 pr-2 font-bold uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {group?.employees.map((row) => (
                <tr key={row.employee.id} className="break-inside-avoid hover:bg-slate-50">
                  <td className="py-3 pl-2">
                    <div className="font-bold text-slate-900">{row.employee.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{row.employee.role}</div>
                  </td>
                  <td className="py-3 text-center font-medium">{row.daysWorked}</td>
                  <td className="py-3 text-right text-slate-500">{formatCurrency(row.employee.dailyRate)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(row.totalEarned)}</td>
                  <td className="py-3 text-right text-emerald-700">{formatCurrency(row.totalPaid)}</td>
                  <td className={`py-3 pr-2 text-right font-bold ${row.pendingAmount > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatCurrency(row.pendingAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold text-base">
                <td className="py-4 pl-2">TOTAL {group?.location.name}</td>
                <td className="py-4 text-center">-</td>
                <td className="py-4 text-right">-</td>
                <td className="py-4 text-right">{formatCurrency(group?.totals.earned || 0)}</td>
                <td className="py-4 text-right text-emerald-700">{formatCurrency(group?.totals.paid || 0)}</td>
                <td className="py-4 pr-2 text-right">{formatCurrency(group?.totals.pending || 0)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures Area */}
          <div className="mt-auto mb-12 grid grid-cols-2 gap-16 break-inside-avoid px-8">
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="text-xs font-bold uppercase text-slate-500">Firma Responsable Local</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="text-xs font-bold uppercase text-slate-500">Firma Gerencia / Admin</p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Docks del Puerto • Control Operativo • {group?.location.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
