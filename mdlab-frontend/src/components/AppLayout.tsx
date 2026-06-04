'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarDays, FileEdit,
  CheckCircle2, FlaskConical, FileText, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, Search, Bell, Menu,
} from 'lucide-react';
import { tokenStorage } from '@/lib/api';

const MENU = [
  { rota: '/dashboard', label: 'Painel', icone: LayoutDashboard, perfis: ['ADMIN', 'BIOMEDICO', 'TECNICO'] },
  { rota: '/pacientes', label: 'Pacientes', icone: Users, perfis: ['ADMIN', 'TECNICO'] },
  { rota: '/agenda', label: 'Agenda & Coleta', icone: CalendarDays, perfis: ['ADMIN', 'TECNICO'] },
  { rota: '/digitacao', label: 'Digitação', icone: FileEdit, perfis: ['ADMIN', 'TECNICO'] },
  { rota: '/validacao', label: 'Validação', icone: CheckCircle2, perfis: ['ADMIN', 'BIOMEDICO'] },
  { rota: '/exames', label: 'Exames', icone: FlaskConical, perfis: ['ADMIN', 'BIOMEDICO', 'TECNICO'] },
  { rota: '/laudos', label: 'Laudos', icone: FileText, perfis: ['ADMIN', 'BIOMEDICO', 'TECNICO'] },
  { rota: '/relatorios', label: 'Relatórios', icone: BarChart3, perfis: ['ADMIN'] },
  { rota: '/configuracoes', label: 'Configurações', icone: Settings, perfis: ['ADMIN'] },
];

const PAPEIS: Record<string, string> = {
  ADMIN: 'Administrador', BIOMEDICO: 'Biomédico', TECNICO: 'Técnico',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [colapsada, setColapsada] = useState(false);
  const [mobileAberta, setMobileAberta] = useState(false);

  useEffect(() => {
    const u = tokenStorage.getUser();
    if (!u) router.replace('/login');
    else setUser(u);
  }, [router]);

  function sair() {
    tokenStorage.clear();
    router.replace('/login');
  }

  if (!user) return null;

  const itensVisiveis = MENU.filter((i) => i.perfis.includes(user.role));
  const larguraSidebar = colapsada ? 76 : 248;
  const iniciais = user.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <div style={{ minHeight: '100vh', background: '#eef3f3' }}>
      <aside
        style={{ ...est.sidebar, width: larguraSidebar, transform: mobileAberta ? 'translateX(0)' : undefined }}
        className={mobileAberta ? 'sidebar-mobile-aberta' : 'sidebar'}
      >
        <div style={est.sidebarTopo}>
          {!colapsada && <img src="/logo-mdlab-branca.svg" alt="MD Lab" style={{ height: 38 }} />}
          <button onClick={() => setColapsada(!colapsada)} style={est.btnColapso} className="btn-colapso">
            {colapsada ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav style={est.nav}>
          {itensVisiveis.map((item) => {
            const ativo = pathname === item.rota;
            const Icone = item.icone;
            return (
              <button
                key={item.rota}
                onClick={() => { router.push(item.rota); setMobileAberta(false); }}
                style={{ ...est.navItem, ...(ativo ? est.navItemAtivo : {}), justifyContent: colapsada ? 'center' : 'flex-start' }}
                title={colapsada ? item.label : undefined}
              >
                {ativo && <span style={est.navItemBarra} />}
                <Icone size={19} style={{ flexShrink: 0 }} />
                {!colapsada && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={est.sidebarRodape}>
          <div style={{ ...est.userBox, justifyContent: colapsada ? 'center' : 'flex-start' }}>
            <div style={est.avatar}>{iniciais}</div>
            {!colapsada && (
              <div style={{ overflow: 'hidden' }}>
                <div style={est.userNome}>{user.name}</div>
                <div style={est.userPapel}>{PAPEIS[user.role] || user.role}</div>
              </div>
            )}
          </div>
          <button onClick={sair} style={{ ...est.btnSair, justifyContent: colapsada ? 'center' : 'flex-start' }} title="Sair">
            <LogOut size={17} />
            {!colapsada && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {mobileAberta && <div onClick={() => setMobileAberta(false)} style={est.overlay} className="overlay-mobile" />}

      <div style={{ ...est.areaPrincipal, marginLeft: larguraSidebar }} className="area-principal">
        <header style={est.topbar}>
          <button onClick={() => setMobileAberta(true)} style={est.btnMenuMobile} className="btn-menu-mobile">
            <Menu size={22} />
          </button>
          <div style={est.buscaWrap}>
            <Search size={17} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input placeholder="Buscar paciente, protocolo, exame..." style={est.buscaInput} />
          </div>
          <div style={est.topbarAcoes}>
            <button style={est.iconeBtn} title="Notificações">
              <Bell size={18} />
              <span style={est.badge} />
            </button>
            <div style={est.unidadeBox}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Unidade</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0a1f1e' }}>Lab. Municipal</div>
            </div>
          </div>
        </header>
        <main style={est.conteudo}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar-mobile-aberta { box-shadow: 0 0 60px rgba(0,0,0,.4); }
          .area-principal { margin-left: 0 !important; }
          .btn-menu-mobile { display: flex !important; }
          .btn-colapso { display: none !important; }
        }
        @media (min-width: 901px) {
          .btn-menu-mobile { display: none !important; }
          .overlay-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const est: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    background: 'linear-gradient(180deg, #0c2826 0%, #0a1f2e 100%)',
    display: 'flex', flexDirection: 'column',
    transition: 'width .22s ease, transform .22s ease',
    borderRight: '1px solid rgba(45,212,191,.08)',
  },
  sidebarTopo: {
    height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  btnColapso: {
    width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)',
    background: 'rgba(255,255,255,.04)', color: '#5eead4',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  navItem: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px', borderRadius: 11, border: 'none', background: 'transparent',
    color: '#94a3b8', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
    transition: 'all .15s', width: '100%', textAlign: 'left', cursor: 'pointer',
  },
  navItemAtivo: { background: 'rgba(20,184,166,.14)', color: '#5eead4', fontWeight: 600 },
  navItemBarra: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 3, background: '#2dd4bf' },
  sidebarRodape: { padding: 12, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 8 },
  userBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' },
  avatar: {
    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
    background: 'linear-gradient(135deg, #14b8a6, #4f46e5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Sora, sans-serif',
  },
  userNome: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userPapel: { fontSize: 11, color: '#5eead4' },
  btnSair: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
    borderRadius: 11, border: 'none', background: 'transparent',
    color: '#f87171', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif', width: '100%', cursor: 'pointer',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.5)', zIndex: 99 },
  areaPrincipal: { transition: 'margin-left .22s ease', minHeight: '100vh' },
  topbar: {
    height: 70, background: '#fff', borderBottom: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 40,
  },
  btnMenuMobile: {
    display: 'none', width: 40, height: 40, borderRadius: 10, border: 'none',
    background: '#f1f5f9', color: '#0a1f1e', alignItems: 'center', justifyContent: 'center',
  },
  buscaWrap: { flex: 1, maxWidth: 440, display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 12, padding: '10px 14px' },
  buscaInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#0a1f1e', fontFamily: 'Outfit, sans-serif' },
  topbarAcoes: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 },
  iconeBtn: { position: 'relative', width: 40, height: 40, borderRadius: 11, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', border: '2px solid #fff' },
  unidadeBox: { textAlign: 'right' },
  conteudo: { padding: 28, maxWidth: 1280, margin: '0 auto' },
};
