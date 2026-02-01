
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, getCurrentDateISO } from "@/lib/utils";
import { CheckCircle2, Clock, Download, Plus, Wallet, X, Zap } from "lucide-react";
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
import { toast } from "sonner";
import DateRangePicker from "@/components/DateRangePicker";

export default function Payments() {
  const { employees, locations, attendance, payments, advances, extras, markPaid, addAdvance, removeAdvance, addExtra, removeExtra } = useStore();
  // Date range state (default: current month)
  const currentDate = getCurrentDateISO();
  const currentYear = currentDate.substring(0, 4);
  const currentMonth = currentDate.substring(5, 7);
  const [startDate, setStartDate] = useState(`${currentYear}-${currentMonth}-01`);
  const [endDate, setEndDate] = useState(currentDate);
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
  const [overtimeHours, setOvertimeHours] = useState("");

  // Advance Dialog State
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [selectedEmployeeForAdvance, setSelectedEmployeeForAdvance] = useState<{id: string, name: string} | null>(null);
  const [advanceForm, setAdvanceForm] = useState({
    amount: "",
    date: getCurrentDateISO(),
    note: ""
  });

  // Extra Dialog State
  const [isExtraDialogOpen, setIsExtraDialogOpen] = useState(false);
  const [selectedEmployeeForExtra, setSelectedEmployeeForExtra] = useState<{id: string, name: string, dailyRate: number} | null>(null);
  const [extraForm, setExtraForm] = useState({
    amount: "",
    hours: "",
    date: getCurrentDateISO(),
    note: ""
  });

  const processedData = useMemo(() => {
    return employees
      .filter(e => e.active && (selectedLocation === "all" || e.locationId === selectedLocation))
      .map(employee => {
        // Get attendance for date range
        const monthlyAttendance = attendance.filter(
          r => r.employeeId === employee.id && 
          r.date >= startDate &&
          r.date <= endDate &&
          r.status === 'present'
        );

        // Calculate total earned
        const totalEarned = monthlyAttendance.length * employee.dailyRate;

        // Get payments for date range
        const monthlyPayments = payments.filter(
          p => p.employeeId === employee.id && 
          p.date >= startDate &&
          p.date <= endDate
        );

        // Get advances for date range
        const monthlyAdvances = advances.filter(
          a => a.employeeId === employee.id && 
          a.date >= startDate &&
          a.date <= endDate
        );

        // Get extras for date range
        const monthlyExtras = extras.filter(
          e => e.employeeId === employee.id && 
          e.date >= startDate &&
          e.date <= endDate
        );

        const totalPaidBase = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaidExtras = monthlyPayments.reduce((sum, p) => sum + (p.extras || 0), 0);
        const totalAdvances = monthlyAdvances.reduce((sum, a) => sum + a.amount, 0);
        const totalRegisteredExtras = monthlyExtras.reduce((sum, e) => sum + e.amount, 0);
        
        const totalPaid = totalPaidBase + totalPaidExtras;
        const totalExtras = totalPaidExtras + totalRegisteredExtras;
        
        // Pending = Earned + RegisteredExtras - PaidBase - Advances
        const realPending = totalEarned + totalRegisteredExtras - totalPaidBase - totalAdvances;

        // Determine status
        let status = 'none';
        if (monthlyAttendance.length === 0 && monthlyExtras.length === 0) status = 'no_activity';
        else if (realPending <= 0) status = 'paid';
        else if (totalPaidBase > 0 || totalAdvances > 0) status = 'partial';
        else status = 'pending';

        return {
          employee,
          attendance: monthlyAttendance,
          payments: monthlyPayments,
          advances: monthlyAdvances,
          extras: monthlyExtras,
          summary: {
            daysWorked: monthlyAttendance.length,
            totalEarned,
            totalPaid,
            totalExtras,
            totalAdvances,
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
  }, [employees, attendance, payments, advances, extras, startDate, endDate, selectedLocation, paymentStatus]);

  const handleOpenPayDialog = (employeeId: string, date: string, amount: number, employeeName: string) => {
    setSelectedPayment({ employeeId, date, amount, employeeName });
    setExtrasAmount("0");
    setOvertimeHours("");
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
      setOvertimeHours("");
    }
  };

  const calculateOvertime = (hours: string) => {
    setOvertimeHours(hours);
    if (!selectedPayment || !hours) {
      setExtrasAmount("0");
      return;
    }

    const hoursNum = Number(hours);
    if (isNaN(hoursNum) || hoursNum < 0) {
      setExtrasAmount("0");
      return;
    }

    const hourlyRate = selectedPayment.amount / 8; // Assuming 8 hour workday
    const overtimeValue = Math.round(hourlyRate * hoursNum);
    setExtrasAmount(overtimeValue.toString());
  };

  const handleOpenAdvanceDialog = (employee: {id: string, name: string}) => {
    setSelectedEmployeeForAdvance(employee);
    setAdvanceForm({
      amount: "",
      date: getCurrentDateISO(),
      note: ""
    });
    setIsAdvanceDialogOpen(true);
  };

  const handleSaveAdvance = () => {
    if (!selectedEmployeeForAdvance || !advanceForm.amount) return;

    const amount = Number(advanceForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido mayor a 0");
      return;
    }

    addAdvance(
      selectedEmployeeForAdvance.id,
      amount,
      advanceForm.date,
      advanceForm.note
    );

    toast.success("Adelanto registrado correctamente");
    setIsAdvanceDialogOpen(false);
  };

  const handleOpenExtraDialog = (employee: {id: string, name: string, dailyRate: number}) => {
    setSelectedEmployeeForExtra(employee);
    setExtraForm({
      amount: "",
      hours: "",
      date: getCurrentDateISO(),
      note: ""
    });
    setIsExtraDialogOpen(true);
  };

  const calculateExtraAmount = (hours: string) => {
    setExtraForm(prev => ({ ...prev, hours }));
    if (!selectedEmployeeForExtra || !hours) {
      setExtraForm(prev => ({ ...prev, amount: "" }));
      return;
    }

    const hoursNum = Number(hours);
    if (isNaN(hoursNum) || hoursNum < 0) {
      setExtraForm(prev => ({ ...prev, amount: "" }));
      return;
    }

    const hourlyRate = selectedEmployeeForExtra.dailyRate / 8;
    const amount = Math.round(hourlyRate * hoursNum);
    setExtraForm(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSaveExtra = () => {
    if (!selectedEmployeeForExtra || !extraForm.amount) return;

    const amount = Number(extraForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido mayor a 0");
      return;
    }

    const hours = extraForm.hours ? Number(extraForm.hours) : undefined;
    if (hours !== undefined && (isNaN(hours) || hours < 0)) {
      toast.error("Ingrese una cantidad de horas válida");
      return;
    }

    addExtra(
      selectedEmployeeForExtra.id,
      amount,
      extraForm.date,
      hours,
      extraForm.note
    );

    toast.success("Hora extra registrada correctamente");
    setIsExtraDialogOpen(false);
  };

  const handleExportCSV = () => {
    // Helper function to escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string | number): string => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Header row
    const headers = [
      "Empleado",
      "Local",
      "Días Trabajados",
      "Total Ganado",
      "Total Extras",
      "Total Adelantos",
      "Total Pagado",
      "Saldo Pendiente",
      "Estado"
    ];

    // Data rows
    const rows = processedData.map(({ employee, summary }) => {
      const locationName = locations.find(l => l.id === employee.locationId)?.name || "Desconocido";
      return [
        escapeCSV(employee.name),
        escapeCSV(locationName),
        summary.daysWorked,
        summary.totalEarned,
        summary.totalExtras,
        summary.totalAdvances,
        summary.totalPaid,
        summary.pendingAmount,
        summary.status === 'paid' ? 'Pagado' : summary.status === 'pending' ? 'Pendiente' : summary.status === 'partial' ? 'Parcial' : 'Sin actividad'
      ];
    });

    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pagos_${startDate}_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pagos</h1>
            <p className="text-slate-500 mt-2">Control de liquidaciones, adelantos y pagos pendientes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              className="w-full sm:w-96"
            />
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
            <Button variant="outline" size="icon" onClick={handleExportCSV} title="Exportar a CSV">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {processedData.map(({ employee, attendance, payments, advances, extras, summary }) => {
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

                      {summary.totalAdvances > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Adelantos</p>
                          <p className="font-bold text-red-600">
                            -{formatCurrency(summary.totalAdvances)}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pendiente</p>
                        <p className={`font-bold ${summary.pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatCurrency(summary.pendingAmount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 gap-1 text-slate-600"
                          onClick={() => handleOpenExtraDialog(employee)}
                        >
                          <Zap className="w-3 h-3" />
                          Extra
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 gap-1 text-slate-600"
                          onClick={() => handleOpenAdvanceDialog(employee)}
                        >
                          <Wallet className="w-3 h-3" />
                          Adelanto
                        </Button>
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
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Extras Section */}
                  {extras.length > 0 && (
                    <div className="bg-blue-50/30 border-b border-slate-100 px-4 py-2">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Extras Registrados</p>
                      <div className="space-y-1">
                        {extras.map(extra => (
                          <div key={extra.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-medium">{formatDate(extra.date)}</span>
                              {extra.hours && <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-white">{extra.hours}hs</Badge>}
                              {extra.note && <span className="text-slate-500 italic">- {extra.note}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">+{formatCurrency(extra.amount)}</span>
                              <button 
                                onClick={() => removeExtra(extra.id)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advances Section */}
                  {advances.length > 0 && (
                    <div className="bg-red-50/30 border-b border-slate-100 px-4 py-2">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Adelantos Registrados</p>
                      <div className="space-y-1">
                        {advances.map(advance => (
                          <div key={advance.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-medium">{formatDate(advance.date)}</span>
                              {advance.note && <span className="text-slate-500 italic">- {advance.note}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600">-{formatCurrency(advance.amount)}</span>
                              <button 
                                onClick={() => removeAdvance(advance.id)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime" className="text-sm font-medium text-slate-700">
                    Calculadora Horas
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="overtime"
                      type="number"
                      value={overtimeHours}
                      onChange={(e) => calculateOvertime(e.target.value)}
                      className="pl-9 bg-white"
                      placeholder="Cant. Horas"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Calcula valor basado en jornal de 8hs.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extras" className="text-sm font-medium text-slate-700">
                    Monto Extra ($)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      id="extras"
                      type="number"
                      value={extrasAmount}
                      onChange={(e) => {
                        setExtrasAmount(e.target.value);
                        setOvertimeHours(""); // Clear hours if manual amount entered
                      }}
                      className="pl-7 bg-white"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Total a sumar como extra.
                  </p>
                </div>
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

        {/* Advance Dialog */}
        <Dialog open={isAdvanceDialogOpen} onOpenChange={setIsAdvanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Adelanto</DialogTitle>
              <DialogDescription>
                Entregar dinero a cuenta para {selectedEmployeeForAdvance?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="advanceAmount">Monto ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="advanceAmount"
                    type="number"
                    className="pl-7"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="advanceDate">Fecha</Label>
                <Input
                  id="advanceDate"
                  type="date"
                  value={advanceForm.date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="advanceNote">Nota (Opcional)</Label>
                <Input
                  id="advanceNote"
                  value={advanceForm.note}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  placeholder="Ej: Para transporte"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdvanceDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveAdvance} className="bg-blue-600 hover:bg-blue-700 text-white">
                Guardar Adelanto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extra Dialog */}
        <Dialog open={isExtraDialogOpen} onOpenChange={setIsExtraDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Hora Extra</DialogTitle>
              <DialogDescription>
                Agregar horas extras para {selectedEmployeeForExtra?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="extraHours">Cantidad de Horas</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="extraHours"
                    type="number"
                    className="pl-9"
                    value={extraForm.hours}
                    onChange={(e) => calculateExtraAmount(e.target.value)}
                    placeholder="Cant. Horas"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Calcula automáticamente basado en el jornal.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extraAmount">Monto ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="extraAmount"
                    type="number"
                    className="pl-7"
                    value={extraForm.amount}
                    onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="extraDate">Fecha</Label>
                <Input
                  id="extraDate"
                  type="date"
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extraNote">Nota (Opcional)</Label>
                <Input
                  id="extraNote"
                  value={extraForm.note}
                  onChange={(e) => setExtraForm({ ...extraForm, note: e.target.value })}
                  placeholder="Ej: Se quedó limpiando"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExtraDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveExtra} className="bg-blue-600 hover:bg-blue-700 text-white">
                Guardar Extra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
