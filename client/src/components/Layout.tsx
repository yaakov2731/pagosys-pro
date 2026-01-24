
import { cn } from "@/lib/utils";
import { BarChart3, Calendar, CreditCard, Home, LayoutDashboard, Menu, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Asistencia", href: "/attendance", icon: Calendar },
    { name: "Pagos", href: "/payments", icon: CreditCard },
    { name: "Empleados", href: "/employees", icon: Users },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-10 h-10 grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden shrink-0">
            <div className="bg-[#f97316]"></div> {/* Orange */}
            <div className="bg-[#16a34a]"></div> {/* Green */}
            <div className="bg-[#eab308]"></div> {/* Yellow */}
            <div className="bg-[#3b82f6]"></div> {/* Blue */}
          </div>
          <div className="flex flex-col">
            <span className="leading-none">DOCKS</span>
            <span className="text-sm font-normal text-slate-400 leading-none">DEL PUERTO</span>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-4 font-medium">Control Operativo</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 font-medium mb-1">Usuario Activo</p>
          <p className="text-sm font-bold text-white">Jacobo (Admin)</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 fixed inset-y-0 z-50">
        <NavContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 font-bold text-white text-lg">
          <div className="w-8 h-8 grid grid-cols-2 gap-0.5 rounded overflow-hidden shrink-0">
            <div className="bg-[#f97316]"></div>
            <div className="bg-[#16a34a]"></div>
            <div className="bg-[#eab308]"></div>
            <div className="bg-[#3b82f6]"></div>
          </div>
          <span>DOCKS PRO</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-slate-800 bg-slate-900">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen transition-all duration-200">
        <div className="container py-8 md:py-10 mt-16 md:mt-0 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
