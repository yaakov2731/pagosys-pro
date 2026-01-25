
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, checkConsecutiveAbsences } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, User } from "lucide-react";
import { useState } from "react";

export default function Employees() {
  const { employees, locations, attendance } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "all" || e.locationId === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empleados</h1>
            <p className="text-slate-500 mt-2">Directorio de personal y roles.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map(employee => (
            <Card key={employee.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">{employee.name}</CardTitle>
                  <p className="text-sm text-slate-500">{employee.role}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Local</span>
                    <span className="font-medium text-slate-900">
                      {locations.find(l => l.id === employee.locationId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Jornal Diario</span>
                    <span className="font-medium text-slate-900">{formatCurrency(employee.dailyRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Estado</span>
                    <div className="flex items-center gap-2">
                      {checkConsecutiveAbsences(employee.id, attendance) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Alerta: 3+ inasistencias consecutivas</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Badge variant={employee.active ? "default" : "secondary"} className={employee.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : ""}>
                        {employee.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No se encontraron empleados.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
