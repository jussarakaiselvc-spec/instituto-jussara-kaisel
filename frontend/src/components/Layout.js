import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, BookOpen, Video, CheckSquare, MessageCircle, CreditCard, Package, Settings, LogOut, Menu, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API}/mensagens/unread-count`);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/minha-mentoria', icon: BookOpen, label: 'Minha Mentoria' },
    { path: '/sessoes', icon: Video, label: 'Sessões' },
    { path: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
    { path: '/calendario', icon: Calendar, label: 'Calendário' },
    { path: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
    { path: '/financeiro', icon: CreditCard, label: 'Financeiro' },
    { path: '/meus-produtos', icon: Package, label: 'Meus Produtos' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: Settings, label: 'Administração' });
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 backdrop-blur-xl bg-white/5 border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <img
            src="https://customer-assets.emergentagent.com/job_portal-jussara/artifacts/ydejbjhx_LOGO%20%20KUNDALINI%20.INSTITUCIONAL%20E%20MINHA.png"
            alt="Instituto Jussara Kaisel"
            className="w-full h-auto mb-4"
          />
          <div className="mt-4">
            <p className="text-sm text-slate-400">Bem-vinda,</p>
            <p className="text-[#DAA520] font-heading text-lg" data-testid="user-name">{user?.name}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-[#DAA520]/10 text-[#DAA520] border border-[#DAA520]/30'
                    : 'text-slate-400 hover:text-[#DAA520] hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-body">{item.label}</span>
                {item.path === '/mensagens' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#DAA520] text-[#0B1120] text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            onClick={onLogout}
            variant="ghost"
            data-testid="logout-button"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-white/5"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 backdrop-blur-xl bg-[#111827] border-r border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <img
                src="https://customer-assets.emergentagent.com/job_portal-jussara/artifacts/ydejbjhx_LOGO%20%20KUNDALINI%20.INSTITUCIONAL%20E%20MINHA.png"
                alt="Instituto Jussara Kaisel"
                className="w-32 h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                data-testid="close-sidebar-button"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="p-4">
              <p className="text-sm text-slate-400">Bem-vinda,</p>
              <p className="text-[#DAA520] font-heading text-lg">{user?.name}</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-[#DAA520]/10 text-[#DAA520] border border-[#DAA520]/30'
                        : 'text-slate-400 hover:text-[#DAA520] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-body">{item.label}</span>
                    {item.path === '/mensagens' && unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-[#DAA520] text-[#0B1120] text-xs flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <Button
                onClick={onLogout}
                variant="ghost"
                className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-white/5"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="open-sidebar-button"
          >
            <Menu className="w-6 h-6 text-[#DAA520]" />
          </Button>
          <img
            src="https://customer-assets.emergentagent.com/job_portal-jussara/artifacts/ydejbjhx_LOGO%20%20KUNDALINI%20.INSTITUCIONAL%20E%20MINHA.png"
            alt="Instituto Jussara Kaisel"
            className="h-8 w-auto"
          />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
