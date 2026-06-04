'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, FileEdit, CheckCircle2, FileText,
  ArrowUpRight, AlertTriangle, Clock, Activity, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { tokenStorage, ordensApi, resultadosApi } from '@/lib/api';

const COR = { teal: '#0d9488', tealClaro: '#2dd4bf', indigo: '#4f46e5', amarelo: '#f59e0b', vermelho: '#dc2626', azul: '#3b82f6' };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ agendados: 0, pendentes: 0, validacao: 0, ordens: [] as any[], carregando: true });

  useEffect(() => {
    setUser(tokenStorage.getUser());
    carregar();
  }, []);

  async function carregar() {
    const [agenda, pendentes, validacao, ordens] = await Promise.allSettled([
      ordensApi.listar('status=ABERTA&limite=1'), resultadosApi.pendentes(), resultadosApi.aguardandoValidacao(), ordensApi.listar('limite=8'),
    ]);
    setStats({
      agendados: agenda.status === 'fulfilled' ? (agenda.value?.paginacao?.total ?? agenda.value?.dados?.length ?? 0) : 0,
      pendentes: pendentes.status === 'fulfilled' && Array.isArray(pendentes.value) ? pendentes.value.length : 0,
      validacao: validacao.status === 'fulfilled' && Array.isArray(validacao.value) ? validacao.value.length : 0,
      ordens: ordens.status === 'fulfilled' ? (ordens.value?.dados ?? []) : [],
      carregando: false,
    });
  }

  if (!user) return null;
  const primeiroNome = user.name?.split(' ')[0] || '';

  const cards = [
    { label: 'Agendados hoje', valor: stats.agendados, icone: CalendarDays, cor: COR.teal, bg: '#f0fdfa', rota: '/agenda', sub: 'Pacientes para coletar' },
    { label: 'Aguardando digitação', valor: stats.pendentes, icone: FileEdit, cor: COR.indigo, bg: '#eef2ff', rota: '/digitacao', sub: 'Exames coletados' },
    { label: 'Aguardando validação', valor: stats.validacao, icone: CheckCircle2, cor: COR.amarelo, bg: '#fffbeb', rota: '/validacao', sub: 'Para o biomédico' },
    { label: 'Laudos do dia', valor: stats.ordens.filter((o) => o.status === 'LIBERADA' || o.status === 'CONCLUIDA').length, icone: FileText, cor: COR.azul, bg: '#eff6ff', rota: '/laudos', sub: 'Liberados hoje' },
  ];

  // Dados do gráfico de fluxo (derivados dos status reais das ordens carregadas)
  const fluxoStatus = [
    { nome: 'Agendada', qtd: stats.ordens.filter((o) => o.status === 'AGENDADA').length },
    { nome: 'Coleta', qtd: stats.ordens.filter((o) => o.status === 'COLETA_REALIZADA').length },
    { nome: 'Digitação', qtd: stats.ordens.filter((o) => o.status === 'EM_DIGITACAO').length },
    { nome: 'Análise', qtd: stats.ordens.filter((o) => o.status === 'EM_ANALISE').length },
    { nome: 'Liberada', qtd: stats.ordens.filter((o) => o.status === 'LIBERADA' || o.status === 'CONCLUIDA').length },
  ];

  return (
    <AppLayout>
      {/* Banner */}
      <div style={banner}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 style={{ fontSize: 26, fontFamily: 'Sora, sans-serif' }}>Olá, {primeiroNome}! 👋</h1>
          <p style={{ opacity: 0.9, fontSize: 14, marginTop: 4 }}>Painel operacional do laboratório em tempo real.</p>
        </div>
        <Activity size={44} style={{ opacity: 0.4 }} />
      </div>

      {/* Cards */}
      <div style={cardsGrid}>
        {cards.map((c) => {
          const Icone = c.icone;
          return (
            <button key={c.label} onClick={() => router.push(c.rota)} style={cardEst} className="card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ ...iconeBox, background: c.bg }}><Icone size={21} color={c.cor} /></div>
                <ArrowUpRight size={17} color="#cbd5e1" />
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#0a1f1e', fontFamily: 'Sora, sans-serif', marginTop: 14 }}>
                {stats.carregando ? '—' : c.valor}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#334155' }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{c.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Gráfico + Distribuição */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }} className="grafico-grid">
        <div style={painel}>
          <div style={painelHeader}>
            <div>
              <h3 style={painelTitulo}>Fluxo de ordens</h3>
              <p style={painelSub}>Distribuição por etapa (ordens recentes)</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 240, marginTop: 12 }}>
            <ResponsiveContainer>
              <AreaChart data={fluxoStatus} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COR.teal} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COR.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="qtd" stroke={COR.teal} strokeWidth={2.5} fill="url(#grad)" name="Ordens" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Painel de alertas */}
        <div style={painel}>
          <div style={painelHeader}>
            <div>
              <h3 style={painelTitulo}>Central de alertas</h3>
              <p style={painelSub}>Pontos de atenção</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <AlertaItem cor={COR.amarelo} bg="#fffbeb" icone={CheckCircle2} titulo={`${stats.validacao} aguardando validação`} desc="Resultados para o biomédico liberar" onClick={() => router.push('/validacao')} />
            <AlertaItem cor={COR.indigo} bg="#eef2ff" icone={FileEdit} titulo={`${stats.pendentes} para digitar`} desc="Exames coletados sem resultado" onClick={() => router.push('/digitacao')} />
            <AlertaItem cor={COR.teal} bg="#f0fdfa" icone={CalendarDays} titulo={`${stats.agendados} agendados hoje`} desc="Pacientes para coleta" onClick={() => router.push('/agenda')} />
          </div>
        </div>
      </div>

      {/* Central de operações */}
      <div style={{ ...painel, marginTop: 16 }}>
        <div style={painelHeader}>
          <div>
            <h3 style={painelTitulo}>Central de operações</h3>
            <p style={painelSub}>Ordens de serviço recentes</p>
          </div>
          <button onClick={() => router.push('/agenda')} style={verTodos}>Ver todas <ChevronRight size={15} /></button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          {stats.carregando ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando...</div>
          ) : stats.ordens.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhuma ordem ainda. Crie uma na Agenda.</div>
          ) : (
            <table style={tabela}>
              <thead>
                <tr>
                  {['Protocolo', 'Paciente', 'Unidade', 'Exames', 'Status'].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.ordens.map((o) => (
                  <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: COR.teal }}>{o.protocolo}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{o.paciente?.nome || '—'}</td>
                    <td style={td}>{o.unidade?.nome || '—'}</td>
                    <td style={td}>{o._count?.itens ?? '—'}</td>
                    <td style={td}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .card-hover { transition: transform .15s, box-shadow .15s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(13,148,136,.12); }
        @media (max-width: 820px) { .grafico-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}

function AlertaItem({ cor, bg, icone: Icone, titulo, desc, onClick }: any) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icone size={18} color={cor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a1f1e' }}>{titulo}</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{desc}</div>
      </div>
      <ChevronRight size={16} color="#cbd5e1" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const mapa: Record<string, { label: string; cor: string; bg: string }> = {
    AGENDADA: { label: 'Agendada', cor: '#0369a1', bg: '#e0f2fe' },
    COLETA_REALIZADA: { label: 'Coletada', cor: '#7c3aed', bg: '#f3e8ff' },
    EM_DIGITACAO: { label: 'Em digitação', cor: '#4f46e5', bg: '#eef2ff' },
    EM_ANALISE: { label: 'Em análise', cor: '#b45309', bg: '#fffbeb' },
    LIBERADA: { label: 'Liberada', cor: '#0f766e', bg: '#f0fdfa' },
    CONCLUIDA: { label: 'Concluída', cor: '#0f766e', bg: '#f0fdfa' },
    CANCELADA: { label: 'Cancelada', cor: '#dc2626', bg: '#fef2f2' },
  };
  const s = mapa[status] || { label: status, cor: '#64748b', bg: '#f1f5f9' };
  return <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: s.cor, background: s.bg, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

const banner: React.CSSProperties = { background: 'linear-gradient(135deg, #0d9488, #4f46e5)', borderRadius: 20, padding: 28, color: '#fff', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cardsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 };
const cardEst: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, textAlign: 'left', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const iconeBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const painel: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 };
const painelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const painelTitulo: React.CSSProperties = { fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' };
const painelSub: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginTop: 2 };
const verTodos: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: '#0d9488', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const tabela: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 600 };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, color: '#334155' };
