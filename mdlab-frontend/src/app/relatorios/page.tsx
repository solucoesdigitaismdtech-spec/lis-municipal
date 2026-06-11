'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Loader2, FileText, FlaskConical, CheckCircle2, FileCheck,
  TrendingUp, Award, Calendar, Download,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { relatoriosApi } from '@/lib/api';

function hojeISO() { return new Date().toISOString().split('T')[0]; }
function diasAtras(n: number) { return new Date(Date.now() - n * 864e5).toISOString().split('T')[0]; }

export default function RelatoriosPage() {
  const [inicio, setInicio] = useState(diasAtras(29));
  const [fim, setFim] = useState(hojeISO());
  const [resumo, setResumo] = useState<any>(null);
  const [producao, setProducao] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [produtividade, setProdutividade] = useState<any[]>([]);
  const [detalhado, setDetalhado] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [r, p, e, pr, det] = await Promise.all([
        relatoriosApi.resumo(inicio, fim).catch(() => null),
        relatoriosApi.producao(inicio, fim).catch(() => []),
        relatoriosApi.examesMaisSolicitados(inicio, fim).catch(() => []),
        relatoriosApi.produtividade(inicio, fim).catch(() => []),
        relatoriosApi.detalhado(inicio, fim).catch(() => []),
      ]);
      setResumo(r);
      setProducao(Array.isArray(p) ? p : []);
      setExames(Array.isArray(e) ? e : []);
      setProdutividade(Array.isArray(pr) ? pr : []);
      setDetalhado(Array.isArray(det) ? det : []);
    } finally {
      setCarregando(false);
    }
  }, [inicio, fim]);

  useEffect(() => { carregar(); }, [carregar]);

  // Atalhos de período
  function atalho(dias: number) { setInicio(diasAtras(dias - 1)); setFim(hojeISO()); }

  const producaoFmt = producao.map((d) => ({ ...d, label: d.dia.split('-').slice(1).reverse().join('/') }));
  const maxExame = Math.max(...exames.map((e) => e.quantidade), 1);

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Relatórios</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Produção, exames e produtividade do laboratório</p>
        </div>
        <button onClick={() => relatoriosApi.pdfGeral(inicio, fim)} style={btnExportarGeral}>
          <Download size={16} /> Exportar relatório geral
        </button>
      </div>

      {/* Filtro de período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <Calendar size={18} color="#0d9488" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={inpData} />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>até</span>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={inpData} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => atalho(7)} style={chip}>7 dias</button>
          <button onClick={() => atalho(30)} style={chip}>30 dias</button>
          <button onClick={() => atalho(90)} style={chip}>90 dias</button>
        </div>
      </div>

      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="spin" color="#0d9488" /></div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
            <Card icone={FileText} cor="#4f46e5" bg="#eef2ff" titulo="Ordens de serviço" valor={resumo?.totalOS ?? 0} />
            <Card icone={FlaskConical} cor="#0d9488" bg="#f0fdfa" titulo="Exames realizados" valor={resumo?.totalExames ?? 0} />
            <Card icone={CheckCircle2} cor="#059669" bg="#ecfdf5" titulo="OS concluídas" valor={resumo?.osConcluidas ?? 0} />
            <Card icone={FileCheck} cor="#b45309" bg="#fffbeb" titulo="Laudos emitidos" valor={resumo?.laudosEmitidos ?? 0} />
          </div>

          {/* Gráfico de produção por dia */}
          <div style={bloco}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ ...blocoTitulo, marginBottom: 0 }}><TrendingUp size={17} color="#0d9488" /> Produção por dia</div>
              <button onClick={() => relatoriosApi.pdfTipo('producao', inicio, fim)} style={btnExportarMini} title="Exportar PDF"><Download size={14} /> PDF</button>
            </div>
            {producaoFmt.length === 0 ? (
              <Vazio texto="Sem dados de produção no período" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={producaoFmt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Bar dataKey="exames" name="Exames" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="os" name="OS" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* Ranking de exames */}
            <div style={bloco}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ ...blocoTitulo, marginBottom: 0 }}><Award size={17} color="#0d9488" /> Exames mais solicitados</div>
                <button onClick={() => relatoriosApi.pdfTipo('exames', inicio, fim)} style={btnExportarMini} title="Exportar PDF"><Download size={14} /> PDF</button>
              </div>
              {exames.length === 0 ? <Vazio texto="Sem exames no período" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {exames.map((ex, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#0a1f1e', fontWeight: 500 }}>{i + 1}. {ex.exame}</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{ex.quantidade}</span>
                      </div>
                      <div style={{ height: 7, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${(ex.quantidade / maxExame) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0d9488, #2dd4bf)', borderRadius: 10 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Produtividade */}
            <div style={bloco}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ ...blocoTitulo, marginBottom: 0 }}><BarChart3 size={17} color="#0d9488" /> Produtividade por profissional</div>
                <button onClick={() => relatoriosApi.pdfTipo('produtividade', inicio, fim)} style={btnExportarMini} title="Exportar PDF"><Download size={14} /> PDF</button>
              </div>
              {produtividade.length === 0 ? <Vazio texto="Sem resultados validados no período" /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                  <thead><tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={thR}>Profissional</th><th style={thR}>Perfil</th><th style={{ ...thR, textAlign: 'right' }}>Resultados</th>
                  </tr></thead>
                  <tbody>
                    {produtividade.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={tdR}>{p.profissional}</td>
                        <td style={tdR}><span style={{ fontSize: 11.5, color: '#64748b' }}>{traduzPerfil(p.perfil)}</span></td>
                        <td style={{ ...tdR, textAlign: 'right', fontWeight: 700, color: '#0d9488' }}>{p.resultados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Relatório detalhado por paciente */}
          <div style={bloco}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ ...blocoTitulo, marginBottom: 0 }}><FileText size={17} color="#0d9488" /> Relatório detalhado por paciente</div>
              <button onClick={() => relatoriosApi.pdfTipo('detalhado', inicio, fim)} style={btnExportarMini} title="Exportar PDF"><Download size={14} /> PDF</button>
            </div>
            {detalhado.length === 0 ? (
              <Vazio texto="Nenhum atendimento no período" />
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
                  {detalhado.length} atendimento(s) · {detalhado.reduce((s, o) => s + (o.exames?.length || 0), 0)} exame(s)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {detalhado.map((o, i) => (
                    <div key={i} style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0a1f1e' }}>{o.paciente}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{o.protocolo} · {o.unidade} · {new Date(o.data).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        {(o.exames || []).map((ex: any, j: number) => (
                          <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: j < o.exames.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <span style={{ fontSize: 13, color: '#0a1f1e' }}>{ex.nome}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: corStatus(ex.status) }}>{ex.status}</span>
                              <span style={{ fontSize: 11.5, color: '#94a3b8', minWidth: 70, textAlign: 'right' }}>{ex.dataColeta ? new Date(ex.dataColeta).toLocaleDateString('pt-BR') : '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );
}

function Card({ icone: Icone, cor, bg, titulo, valor }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icone size={20} color={cor} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Sora, sans-serif', color: '#0a1f1e', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{titulo}</div>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13.5 }}>{texto}</div>;
}

function traduzPerfil(role: string) {
  return role === 'ADMIN' ? 'Administrador' : role === 'BIOMEDICO' ? 'Biomédico' : role === 'TECNICO' ? 'Técnico' : role;
}

function corStatus(s: string) {
  if (s === 'Liberado') return '#0f766e';
  if (s === 'Validado' || s === 'Digitado') return '#2563eb';
  if (s === 'Aguardando coleta') return '#b45309';
  return '#64748b';
}

const inpData: React.CSSProperties = { padding: '8px 12px', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 9, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', color: '#0a1f1e', outline: 'none' };
const btnExportarGeral: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' };
const btnExportarMini: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0d9488', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#99f6e4', borderRadius: 9, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, fontFamily: 'Outfit, sans-serif', cursor: 'pointer' };
const chip: React.CSSProperties = { padding: '8px 14px', background: '#f8fafc', borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const bloco: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 18 };
const blocoTitulo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0a1f1e', marginBottom: 16 };
const thR: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 };
const tdR: React.CSSProperties = { padding: '10px 6px', fontSize: 13.5, color: '#334155' };
