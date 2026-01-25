
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { formatCurrency, getCurrentDateISO } from "@/lib/utils";
import { BarChart, PieChart, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useMemo } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Reports() {
  const { employees, locations, attendance, payments, extras } = useStore();
  const currentMonth = getCurrentDateISO().substring(0, 7);

  const costsByLocation = useMemo(() => {
    return locations.filter(l => l.active).map(location => {
      const locationEmployees = employees.filter(e => e.locationId === location.id);
      
      // Calculate total cost for this month (based on attendance + extras)
      const totalCost = locationEmployees.reduce((sum, emp) => {
        const daysWorked = attendance.filter(
          r => r.employeeId === emp.id && 
          r.date.startsWith(currentMonth) && 
          r.status === 'present'
        ).length;
        
        const employeeExtras = extras.filter(
          e => e.employeeId === emp.id && e.period === currentMonth
        ).reduce((acc, curr) => acc + curr.amount, 0);

        return sum + (daysWorked * emp.dailyRate) + employeeExtras;
      }, 0);

      return {
        name: location.name,
        cost: totalCost
      };
    }).sort((a, b) => b.cost - a.cost);
  }, [employees, locations, attendance, currentMonth]);

  const attendanceByLocation = useMemo(() => {
    return locations.filter(l => l.active).map(location => {
      const locationEmployees = employees.filter(e => e.locationId === location.id);
      
      const totalDays = locationEmployees.length * 30; // Approx
      const presentDays = locationEmployees.reduce((sum, emp) => {
        return sum + attendance.filter(
          r => r.employeeId === emp.id && 
          r.date.startsWith(currentMonth) && 
          r.status === 'present'
        ).length;
      }, 0);

      return {
        name: location.name,
        present: presentDays,
        total: totalDays
      };
    });
  }, [employees, locations, attendance, currentMonth]);

  const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2'];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes</h1>
              <p className="text-slate-500 mt-2">Análisis de costos y asistencia del mes actual ({currentMonth}).</p>
            </div>
            <Link href={`/print-report?month=${currentMonth}`}>
              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Reporte A4
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                Costos por Local
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={costsByLocation} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                      {costsByLocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Distribución de Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={costsByLocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="cost"
                    >
                      {costsByLocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Detalle de Costos Estimados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Local</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Costo Total</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">% del Total</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {costsByLocation.map((item) => {
                    const total = costsByLocation.reduce((sum, i) => sum + i.cost, 0);
                    const percentage = total > 0 ? (item.cost / total) * 100 : 0;
                    
                    return (
                      <tr key={item.name} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{item.name}</td>
                        <td className="p-4 align-middle text-right">{formatCurrency(item.cost)}</td>
                        <td className="p-4 align-middle text-right">{percentage.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-4 align-middle">TOTAL</td>
                    <td className="p-4 align-middle text-right">
                      {formatCurrency(costsByLocation.reduce((sum, i) => sum + i.cost, 0))}
                    </td>
                    <td className="p-4 align-middle text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
