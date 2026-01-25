
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, getCurrentDateISO } from "@/lib/utils";
import { useLocation } from "wouter";
import { Mail, Printer } from "lucide-react";
import { useState, useRef } from "react";
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
  const reportRef = useRef<HTMLDivElement>(null);
  
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

  // Calculate dynamic date range
  const allDates = attendance
    .filter(r => r.date.startsWith(month) && r.status === 'present')
    .map(r => r.date)
    .sort();
  
  const startDate = allDates.length > 0 ? formatDate(allDates[0]) : formatDate(`${month}-01`);
  const endDate = formatDate(getCurrentDateISO());
  const periodString = `${startDate} - ${endDate}`;

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

    const totalPaidBase = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExtras = monthlyPayments.reduce((sum, p) => sum + (p.extras || 0), 0);
    const totalPaid = totalPaidBase + totalExtras;
    
    const pendingAmount = totalEarned - totalPaidBase; // Pending is based on base salary

    return {
      employee,
      daysWorked: monthlyAttendance.length,
      totalEarned,
      totalPaidBase,
      totalExtras,
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
        paidBase: acc.paidBase + curr.totalPaidBase,
        extras: acc.extras + curr.totalExtras,
        paid: acc.paid + curr.totalPaid,
        pending: acc.pending + curr.pendingAmount
      }), { earned: 0, paidBase: 0, extras: 0, paid: 0, pending: 0 });

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
    extras: acc.extras + (curr?.totals.extras || 0),
    pending: acc.pending + (curr?.totals.pending || 0)
  }), { earned: 0, paid: 0, extras: 0, pending: 0 });

  const Logo = () => (
    <div className="w-8 h-8 grid grid-cols-2 gap-0.5 rounded overflow-hidden shrink-0 print:border print:border-slate-200" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      <div className="bg-[#f97316] print:bg-[#f97316]"></div>
      <div className="bg-[#16a34a] print:bg-[#16a34a]"></div>
      <div className="bg-[#eab308] print:bg-[#eab308]"></div>
      <div className="bg-[#3b82f6] print:bg-[#3b82f6]"></div>
    </div>
  );

  const handleSendEmail = async () => {
    if (!email) {
      toast.error("Ingresa un email válido");
      return;
    }
    setIsSending(true);
    
    try {
      // Dynamic import to fix SSR/build issues
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;

      // 1. Generate PDF
      const element = reportRef.current;
      if (!element) return;

      const opt = {
        margin: 5,
        filename: `Reporte_Pagos_${month}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
      };

      await html2pdf().set(opt).from(element).save();
      
      // 2. Open Email Client
      setTimeout(() => {
        const subject = `Reporte de Pagos - ${periodString}`;
        const body = `Hola,\n\nSe ha generado el reporte de pagos del período ${periodString}.\n\nEl archivo PDF se ha descargado automáticamente en tu computadora.\nPor favor, adjúntalo a este correo para enviarlo.\n\nResumen:\nTotal a Pagar: ${formatCurrency(globalTotals.earned)}\nTotal Extras: ${formatCurrency(globalTotals.extras)}\nTotal Pagado: ${formatCurrency(globalTotals.paid)}\nSaldo Pendiente: ${formatCurrency(globalTotals.pending)}\n\nSaludos,\nDocks del Puerto`;
        
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        setIsSending(false);
        setIsEmailOpen(false);
        toast.success("PDF descargado. Adjúntalo al correo abierto.");
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Error al generar el PDF: " + (error as Error).message);
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-8 print:p-0 font-sans text-slate-900">
      {/* Print Controls */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-slate-900">Vista de Impresión</h2>
          <p className="text-sm text-slate-500">Formato A4 Horizontal - Se generará una hoja por cada local.</p>
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
                  El sistema descargará el PDF completo y abrirá tu correo para que lo adjuntes.
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
                <Button onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? "Generando PDF..." : "Descargar y Redactar"}
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

      {/* REPORT CONTENT */}
      <div ref={reportRef} className="print:w-[297mm]">
        {/* SUMMARY PAGE (Only if viewing ALL locations) */}
        {locationId === "all" && (
          <div className="max-w-[297mm] mx-auto bg-white print:max-w-none print:h-[210mm] print:break-after-page flex flex-col mb-16 print:mb-0 p-8 print:p-8">
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight uppercase">Resumen Ejecutivo</h1>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Docks del Puerto • Gerencia</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">PERÍODO: {periodString}</p>
                <p className="text-[10px] text-slate-500">Generado: {formatDate(getCurrentDateISO())}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg print:bg-slate-50" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total a Pagar</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(globalTotals.earned)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg print:bg-slate-50" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Extras</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(globalTotals.extras)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg print:bg-slate-50" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Pagado</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(globalTotals.paid)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg print:bg-slate-50" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Saldo Pendiente</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(globalTotals.pending)}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold uppercase mb-2 border-b border-slate-200 pb-1">Desglose por Local</h3>
            <table className="w-full text-xs mb-8">
              <thead>
                <tr className="border-b border-slate-900">
                  <th className="text-left py-2 font-bold uppercase">Local</th>
                  <th className="text-center py-2 font-bold uppercase">Empleados</th>
                  <th className="text-right py-2 font-bold uppercase">Base</th>
                  <th className="text-right py-2 font-bold uppercase">Extras</th>
                  <th className="text-right py-2 font-bold uppercase">Total Pagado</th>
                  <th className="text-right py-2 font-bold uppercase">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedData.map((group) => (
                  <tr key={group?.location.id}>
                    <td className="py-2 font-bold">{group?.location.name}</td>
                    <td className="py-2 text-center">{group?.employees.length}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(group?.totals.earned || 0)}</td>
                    <td className="py-2 text-right text-blue-600">{formatCurrency(group?.totals.extras || 0)}</td>
                    <td className="py-2 text-right text-emerald-700">{formatCurrency(group?.totals.paid || 0)}</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(group?.totals.pending || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-auto pt-4 border-t border-slate-200">
               <p className="text-[8px] text-slate-400 uppercase tracking-widest text-center">
                  Documento confidencial para uso exclusivo de gerencia
               </p>
            </div>
          </div>
        )}

        {/* INDIVIDUAL LOCATION PAGES */}
        {groupedData.map((group, index) => (
          <div key={group?.location.id} className="max-w-[297mm] mx-auto bg-white print:max-w-none print:h-[210mm] print:break-after-page flex flex-col relative pt-4 mb-16 print:mb-0 p-8 print:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <h1 className="text-xl font-bold tracking-tight uppercase">Reporte de Pagos</h1>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Docks del Puerto • {group?.location.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">PERÍODO: {periodString}</p>
                <p className="text-[10px] text-slate-500">Generado: {formatDate(getCurrentDateISO())}</p>
              </div>
            </div>

            {/* Table */}
            <div className="flex-grow">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-900">
                    <th className="text-left py-2 font-bold uppercase w-1/4">Empleado</th>
                    <th className="text-right py-2 font-bold uppercase">Jornal</th>
                    <th className="text-center py-2 font-bold uppercase">Días</th>
                    <th className="text-right py-2 font-bold uppercase">A Pagar</th>
                    <th className="text-right py-2 font-bold uppercase text-blue-600">Extras</th>
                    <th className="text-right py-2 font-bold uppercase text-emerald-700">Pagado</th>
                    <th className="text-right py-2 font-bold uppercase">Pendiente</th>
                    <th className="text-center py-2 font-bold uppercase w-1/6">Firma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group?.employees.map((data) => (
                    <tr key={data.employee.id} className="break-inside-avoid">
                      <td className="py-3 font-medium">
                        {data.employee.name}
                        <span className="block text-[10px] text-slate-400 font-normal uppercase">{data.employee.role}</span>
                      </td>
                      <td className="py-3 text-right text-slate-500">{formatCurrency(data.employee.dailyRate)}</td>
                      <td className="py-3 text-center font-bold">{data.daysWorked}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(data.totalEarned)}</td>
                      <td className="py-3 text-right text-blue-600 font-medium">
                        {data.totalExtras > 0 ? formatCurrency(data.totalExtras) : '-'}
                      </td>
                      <td className="py-3 text-right text-emerald-700 font-bold">{formatCurrency(data.totalPaid)}</td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {data.pendingAmount > 0 ? formatCurrency(data.pendingAmount) : '-'}
                      </td>
                      <td className="py-3 border-b border-slate-100"></td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-900 font-bold print:bg-slate-50" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    <td className="py-3 pl-2 uppercase text-[10px] tracking-wider">Totales {group?.location.name}</td>
                    <td className="py-3"></td>
                    <td className="py-3 text-center">{group?.employees.reduce((acc, curr) => acc + curr.daysWorked, 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(group?.totals.earned || 0)}</td>
                    <td className="py-3 text-right text-blue-600">{formatCurrency(group?.totals.extras || 0)}</td>
                    <td className="py-3 text-right text-emerald-700">{formatCurrency(group?.totals.paid || 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(group?.totals.pending || 0)}</td>
                    <td className="py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto pt-12 pb-4 break-inside-avoid">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Firma Responsable</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-300 w-3/4 mx-auto mb-2"></div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Firma Gerencia</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 italic">
                    Página {index + 1} de {groupedData.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }
      `}</style>
    </div>
  );
}
