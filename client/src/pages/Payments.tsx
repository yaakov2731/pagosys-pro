
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, getCurrentDateISO } from "@/lib/utils";
import { CheckCircle2, Clock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Payments() {
  const { employees, locations, attendance, payments, markPaid } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentDateISO().substring(0, 7));
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  
  // Payment Dialog State
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    employeeId: string;
    date: string;
    amount: number;
    employeeName: string;
  } | null>(null);
  const [extrasAmount, setExtrasAmount] = useState("0");

  const processedData = useMemo(() => {
    return employees
      .filter(e => e.active && (selectedLocation === "all" || e.locationId === selectedLocation))
      .map(employee => {
        // Get attendance for this month
        const monthlyAttendance = attendance.filter(
          r => r.employeeId === employee.id && 
          r.date.startsWith(selectedMonth) && 
          r.status === 'present'
        );

        // Calculate total earned
        const totalEarned = monthlyAttendance.length * employee.dailyRate;

        // Get payments for this month
        const monthlyPayments = payments.filter(
          p => p.employeeId === employee.id && p.period === selectedMonth
        );

        const totalPaid = monthlyPayments.reduce((sum, p) => sum + p.amount + (p.extras || 0), 0);
        const pendingAmount = totalEarned - totalPaid; // Note: Extras are on top, so they don't reduce pending base salary, but for simplicity we track total paid vs total earned base. 
        // Actually, better logic: Pending = (Days * Rate) - (Paid Base). Extras are separate.
        // But to keep it simple for now: Pending = (Days * Rate) - (Total Paid - Total Extras)
        
        const totalPaidBase = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExtras = monthlyPayments.reduce((sum, p) => sum + (p.extras || 0), 0);
        
        const realPending = totalEarned - totalPaidBase;

        // Determine status
        let status = 'none';
        if (monthlyAttendance.length === 0) status = 'no_activity';
        else if (realPending <= 0) status = 'paid';
        else if (totalPaidBase > 0) status = 'partial';
        else status = 'pending';

        return {
          employee,
          attendance: monthlyAttendance,
          payments: monthlyPayments,
          summary: {
            daysWorked: monthlyAttendance.length,
            totalEarned,
            totalPaid,
            totalExtras,
            pendingAmount: realPending,
            status
          }
        };
      })
      .filter(data => {
        if (paymentStatus === 'all') return true;
        if (paymentStatus === 'pending') return data.summary.status === 'pending' || data.summary.status === 'partial';
        if (paymentStatus === 'paid') return data.summary.status === 'paid';
        return true;
      })
      .sort((a, b) => {
        // Sort by pending amount (desc) then name
        if (b.summary.pendingAmount !== a.summary.pendingAmount) {
          return b.summary.pendingAmount - a.summary.pendingAmount;
        }
        return a.employee.name.localeCompare(b.employee.name);
      });
  }, [employees, attendance, payments, selectedMonth, selectedLocation, paymentStatus]);

  const handleOpenPayDialog = (employeeId: string, date: string, amount: number, employeeName: string) => {
    setSelectedPayment({ employeeId, date, amount, employeeName });
    setExtrasAmount("0");
    setIsPayDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedPayment) {
      markPaid(
        selectedPayment.employeeId, 
        selectedPayment.date, 
        selectedPayment.amount, 
        Number(extrasAmount) || 0
      );
      setIsPayDialogOpen(false);
      setSelectedPayment(null);
      setExtrasAmount("0");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pagos</h1>
            <p className="text-slate-500 mt-2">Control de liquidaciones y pagos pendientes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white"
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Filtrar por local" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los locales</SelectItem>
                  {locations.filter(l => l.active).map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="paid">Pagados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {processedData.map(({ employee, attendance, payments, summary }) => {
            // Group attendance by date to show history
            const sortedAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date));
            
            return (
              <Card key={employee.id} className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {employee.name.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{employee.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span className="font-medium text-blue-600">
                            {locations.find(l => l.id === employee.locationId)?.name}
                          </span>
                          <span>•</span>
                          <span>{formatCurrency(employee.dailyRate)}/día</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Trabajado</p>
                        <p className="font-bold text-slate-900">
                          {summary.daysWorked} días
                          <span className="text-slate-400 mx-1">|</span>
                          {formatCurrency(summary.totalEarned)}
                        </p>
                      </div>
                      
                      {summary.totalExtras > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Extras</p>
                          <p className="font-bold text-blue-600">
                            +{formatCurrency(summary.totalExtras)}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pendiente</p>
                        <p className={`font-bold ${summary.pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatCurrency(summary.pendingAmount)}
                        </p>
                      </div>

                      <Badge variant={summary.status === 'paid' ? 'default' : 'secondary'} 
                        className={
                          summary.status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                          summary.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                          summary.status === 'partial' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                          'bg-slate-100 text-slate-500'
                        }
                      >
                        {summary.status === 'paid' ? 'Pagado' :
                         summary.status === 'pending' ? 'Pendiente' :
                         summary.status === 'partial' ? 'Parcial' : 'Sin actividad'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {sortedAttendance.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {sortedAttendance.map(record => {
                        const payment = payments.find(p => p.date === record.date);
                        const isPaid = !!payment;
                        
                        return (
                          <div key={record.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{formatDate(record.date)}</span>
                                <span className="text-xs text-slate-500">Jornada completa</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-slate-900">{formatCurrency(employee.dailyRate)}</span>
                              
                              {isPaid ? (
                                <div className="flex items-center gap-2">
                                  {payment.extras > 0 && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      + {formatCurrency(payment.extras)} Extra
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex gap-1 items-center py-1 px-3">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Pagado
                                  </Badge>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleOpenPayDialog(employee.id, record.date, employee.dailyRate, employee.name)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                                >
                                  Pagar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No hay registros de asistencia para este período.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {processedData.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500">No se encontraron registros con los filtros seleccionados.</p>
            </div>
          )}
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                Confirmar pago para {selectedPayment?.employeeName} del día {selectedPayment && formatDate(selectedPayment.date)}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Jornal Base</span>
                  <span className="font-bold text-slate-900">{selectedPayment && formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Extras</span>
                  <span className="font-bold text-blue-600">
                    + {formatCurrency(Number(extrasAmount) || 0)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total a Pagar</span>
                  <span className="font-bold text-lg text-emerald-700">
                    {selectedPayment && formatCurrency(selectedPayment.amount + (Number(extrasAmount) || 0))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extras" className="text-sm font-medium text-slate-700">
                  Agregar Horas Extras / Bonos ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="extras"
                    type="number"
                    value={extrasAmount}
                    onChange={(e) => setExtrasAmount(e.target.value)}
                    className="pl-7 bg-white"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Ingrese el monto adicional a pagar por horas extras o premios.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirmar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
