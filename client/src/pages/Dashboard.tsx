
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { formatCurrency, getCurrentDateISO, checkConsecutiveAbsences } from "@/lib/utils";
import { Building2, CalendarCheck, CreditCard, Users, AlertTriangle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Dashboard() {
  const { employees, locations, attendance, payments, resetData } = useStore();
  const currentDate = getCurrentDateISO();
  const currentMonth = currentDate.substring(0, 7);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.active).length;
    const activeLocations = locations.filter(l => l.active).length;
    
    const presentToday = attendance.filter(
      r => r.date === currentDate && r.status === 'present'
    ).length;

    const totalPaidThisMonth = payments
      .filter(p => p.period === currentMonth && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      activeEmployees,
      activeLocations,
      presentToday,
      totalPaidThisMonth
    };
  }, [employees, locations, attendance, payments, currentDate, currentMonth]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-2">Vista general del estado operativo de hoy.</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Limpiar Datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción borrará permanentemente todo el historial de asistencia y pagos registrados.
                  Los empleados y locales se mantendrán. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    resetData();
                    toast.success("Datos eliminados correctamente");
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sí, borrar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Empleados Activos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.activeEmployees}</div>
              <p className="text-xs text-slate-500 mt-1">
                En {stats.activeLocations} locales
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Asistencia Hoy
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.presentToday} <span className="text-sm font-normal text-slate-400">/ {stats.activeEmployees}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((stats.presentToday / stats.activeEmployees) * 100)}% de asistencia
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pagos del Mes
              </CardTitle>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalPaidThisMonth)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Acumulado {currentMonth}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Locales Activos
              </CardTitle>
              <Building2 className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.activeLocations}</div>
              <p className="text-xs text-slate-500 mt-1">
                Operando normalmente
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Alerts Section */}
          {employees.some(e => checkConsecutiveAbsences(e.id, attendance)) && (
            <Card className="col-span-full border-red-200 bg-red-50 shadow-sm mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {employees
                    .filter(e => checkConsecutiveAbsences(e.id, attendance))
                    .map(e => (
                      <div key={e.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-red-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                            {e.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{e.name}</p>
                            <p className="text-xs text-slate-500">{locations.find(l => l.id === e.locationId)?.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                          3+ Faltas
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="col-span-4 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Resumen por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.map(location => {
                  const employeesInLocation = employees.filter(e => e.locationId === location.id).length;
                  const presentInLocation = attendance.filter(
                    r => r.date === currentDate && 
                    r.status === 'present' && 
                    employees.find(e => e.id === r.employeeId)?.locationId === location.id
                  ).length;
                  
                  return (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                          {location.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{location.name}</p>
                          <p className="text-xs text-slate-500">{employeesInLocation} empleados</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900">{presentInLocation}/{employeesInLocation}</p>
                        <p className="text-xs text-emerald-600 font-medium">Presentes</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <Link href="/attendance">
                <button className="w-full group relative flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 shadow-[0_4px_0_rgb(29,78,216)] hover:shadow-[0_2px_0_rgb(29,78,216)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-700/50 rounded-lg group-hover:bg-blue-600/50 transition-colors">
                      <CalendarCheck className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Tomar Asistencia</p>
                      <p className="text-xs text-blue-100">Registrar presentes hoy</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </button>
              </Link>
              
              <Link href="/payments">
                <button className="w-full group relative flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 shadow-[0_4px_0_rgb(15,23,42)] hover:shadow-[0_2px_0_rgb(15,23,42)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900/50 rounded-lg group-hover:bg-slate-800/50 transition-colors">
                      <CreditCard className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Registrar Pagos</p>
                      <p className="text-xs text-slate-400">Gestionar sueldos</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
