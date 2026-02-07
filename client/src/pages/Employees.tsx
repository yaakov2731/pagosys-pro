
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatCurrency, checkConsecutiveAbsences } from "@/lib/utils";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Employee } from "@/lib/data";

export default function Employees() {
  const { employees, locations, attendance, addEmployee, updateEmployee } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  
  // Add Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    role: "",
    locationId: "",
    dailyRate: "",
    active: true
  });
  
  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    dailyRate: "",
    role: "",
    active: true
  });

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "all" || e.locationId === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      dailyRate: employee.dailyRate.toString(),
      role: employee.role,
      active: employee.active
    });
    setIsEditDialogOpen(true);
  };

  const handleAddEmployee = () => {
    if (!addForm.name || !addForm.role || !addForm.locationId || !addForm.dailyRate) {
      toast.error("Por favor completá todos los campos");
      return;
    }

    addEmployee({
      name: addForm.name,
      role: addForm.role,
      locationId: addForm.locationId,
      dailyRate: Number(addForm.dailyRate),
      active: addForm.active
    });

    toast.success("Empleado agregado correctamente");
    setIsAddDialogOpen(false);
    setAddForm({
      name: "",
      role: "",
      locationId: "",
      dailyRate: "",
      active: true
    });
  };

  const handleSaveEdit = () => {
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, {
      dailyRate: Number(editForm.dailyRate),
      role: editForm.role,
      active: editForm.active
    });

    toast.success("Empleado actualizado correctamente");
    setIsEditDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empleados</h1>
              <p className="text-slate-500 mt-2">Directorio de personal y roles.</p>
            </div>
            
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empleado
            </Button>
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
            <Card key={employee.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => handleEditClick(employee)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
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

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Completá los datos del nuevo empleado
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Pérez"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="add-role">Rol / Puesto</Label>
                <Input
                  id="add-role"
                  placeholder="Ej: Cocinero, Cajera, etc."
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Local</Label>
                <Select value={addForm.locationId} onValueChange={(value) => setAddForm({ ...addForm, locationId: value })}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Seleccioná un local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(l => l.active).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="add-dailyRate">Jornal Diario ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="add-dailyRate"
                    type="number"
                    className="pl-7"
                    placeholder="0"
                    value={addForm.dailyRate}
                    onChange={(e) => setAddForm({ ...addForm, dailyRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base">Estado Inicial</Label>
                  <p className="text-xs text-slate-500">
                    El empleado estará activo por defecto
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={addForm.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddForm({ ...addForm, active: !addForm.active })}
                    className={addForm.active ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-500"}
                  >
                    {addForm.active ? "Activo" : "Inactivo"}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
                Agregar Empleado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Empleado</DialogTitle>
              <DialogDescription>
                Modificar datos para {editingEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Rol / Puesto</Label>
                <Input
                  id="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dailyRate">Jornal Diario ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <Input
                    id="dailyRate"
                    type="number"
                    className="pl-7"
                    value={editForm.dailyRate}
                    onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base">Estado Activo</Label>
                  <p className="text-xs text-slate-500">
                    Desactivar si el empleado ya no trabaja aquí
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={editForm.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
                    className={editForm.active ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-500"}
                  >
                    {editForm.active ? "Activo" : "Inactivo"}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
