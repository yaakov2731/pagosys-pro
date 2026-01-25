
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, getCurrentDateISO } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { useState } from "react";

export default function Attendance() {
  const { employees, locations, attendance, addAttendance, removeAttendance } = useStore();
  const [selectedDate, setSelectedDate] = useState(getCurrentDateISO());
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const filteredEmployees = employees.filter(e => 
    e.active && (selectedLocation === "all" || e.locationId === selectedLocation)
  );

  // Group employees by location
  const employeesByLocation = filteredEmployees.reduce((acc, employee) => {
    const location = locations.find(l => l.id === employee.locationId);
    if (!location) return acc;
    
    if (!acc[location.name]) {
      acc[location.name] = [];
    }
    acc[location.name].push(employee);
    return acc;
  }, {} as Record<string, typeof employees>);

  const getAttendanceStatus = (employeeId: string) => {
    const record = attendance.find(
      r => r.employeeId === employeeId && r.date === selectedDate
    );
    return record?.status || null;
  };

  const handleAttendance = (employeeId: string, status: 'present' | 'absent') => {
    const currentStatus = getAttendanceStatus(employeeId);
    
    if (currentStatus === status) {
      // Toggle off if clicking same status
      removeAttendance(employeeId, selectedDate);
    } else {
      addAttendance({
        employeeId,
        date: selectedDate,
        status
      });
    }
  };

  const stats = {
    total: filteredEmployees.length,
    present: filteredEmployees.filter(e => getAttendanceStatus(e.id) === 'present').length,
    absent: filteredEmployees.filter(e => getAttendanceStatus(e.id) === 'absent').length,
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asistencia</h1>
            <p className="text-slate-500 mt-2">Gestión diaria de presencia por local.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-emerald-600">Presentes</span>
              <span className="text-2xl font-bold text-emerald-700">{stats.present}</span>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-100 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-red-600">Ausentes</span>
              <span className="text-2xl font-bold text-red-700">{stats.absent}</span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(employeesByLocation).map(([locationName, locationEmployees]) => (
            <Card key={locationName} className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {locationName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {locationEmployees.map(employee => {
                    const status = getAttendanceStatus(employee.id);
                    
                    return (
                      <div key={employee.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{employee.name}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{employee.role}</span>
                            <span>•</span>
                            <span>{formatCurrency(employee.dailyRate)}/día</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant={status === 'present' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendance(employee.id, 'present')}
                            className={status === 'present' 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" 
                              : "text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Presente
                          </Button>
                          
                          <Button
                            variant={status === 'absent' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendance(employee.id, 'absent')}
                            className={status === 'absent'
                              ? "bg-red-600 hover:bg-red-700 text-white border-transparent"
                              : "text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Ausente
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(employeesByLocation).length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500">No hay empleados para mostrar con los filtros actuales.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
