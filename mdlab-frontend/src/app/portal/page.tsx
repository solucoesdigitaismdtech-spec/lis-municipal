'use client';

import { useState, useEffect } from 'react';
import {
  Search, Loader2, FileText, Download, CheckCircle2, Clock, FlaskConical,
  AlertCircle, ShieldCheck, Building2,
} from 'lucide-react';
import { portalApi } from '@/lib/api';

export default function PortalPacientePage() {
  const [protocolo, setProtocolo] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Se veio do QR code (/portal?protocolo=LAB-...), preenche o campo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proto = params.get('protocolo');
    if (proto) setProtocolo(proto);
  }, []);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setResultado(null);
    if (!protocolo.trim() || !nascimento) {
      setErro('Preencha o protocolo e a data de nascimento.');
      return;
    }
    setCarregando(true);
    try {
      const r = await portalApi.consultar(protocolo.trim(), nascimento);
      setResultado(r);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível consultar. Verifique os dados.');
    } finally {
      setCarregando(false);
    }
  }

  function novaConsulta() {
    setResultado(null); setProtocolo(''); setNascimento(''); setErro('');
  }

  return (
    <div style={tela}>
      <div style={container}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoBox}>
            <FlaskConical size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#fff', marginTop: 14 }}>Portal do Paciente</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Consulte o andamento dos seus exames</p>
        </div>

        {!resultado ? (
          /* ── Formulário de consulta ── */
          <div style={card}>
            <form onSubmit={consultar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={label}>Protocolo do exame</label>
                <input value={protocolo} onChange={(e) => setProtocolo(e.target.value)} style={inp} placeholder="Ex: LAB-20260601-00001" autoComplete="off" />
              </div>
              <div>
                <label style={label}>Data de nascimento</label>
                <input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} style={inp} />
              </div>

              {erro && <div style={erroBox}><AlertCircle size={16} /> {erro}</div>}

              <button type="submit" disabled={carregando} style={btnPrimario}>
                {carregando ? <><Loader2 size={18} className="spin" /> Consultando...</> : <><Search size={18} /> Consultar exames</>}
              </button>
            </form>

            <div style={avisoSeguranca}>
              <ShieldCheck size={15} color="#0d9488" />
              <span>Seus dados são protegidos. O acesso exige o protocolo e a sua data de nascimento.</span>
            </div>
          </div>
        ) : (
          /* ── Resultado da consulta ── */
          <div style={card}>
            {/* Cabeçalho do resultado */}
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Protocolo</div>
                  <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, color: '#0d9488' }}>{resultado.protocolo}</div>
                </div>
                <div style={statusGeralBadge(resultado.laudoPronto)}>
                  {resultado.statusGeral}
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: '#334155' }}>
                <strong>{resultado.paciente}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', marginTop: 4 }}>
                <Building2 size={13} /> {resultado.laboratorio} · {resultado.municipio}
              </div>
            </div>

            {/* Lista de exames */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Exames</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {resultado.exames?.map((ex: any, i: number) => (
                <div key={i} style={exameItem}>
                  <span style={{ fontSize: 14, color: '#0a1f1e', fontWeight: 500 }}>{ex.nome}</span>
                  <span style={statusExameBadge(ex.pronto)}>
                    {ex.pronto ? <CheckCircle2 size={13} /> : <Clock size={13} />} {ex.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Botão baixar laudo (quando pronto) */}
            {resultado.laudoPronto && resultado.hashLaudo && (
              <button onClick={() => portalApi.baixarLaudo(resultado.hashLaudo)} style={btnBaixar}>
                <Download size={18} /> Baixar laudo (PDF)
              </button>
            )}

            {!resultado.laudoPronto && (
              <div style={avisoAndamento}>
                <Clock size={15} color="#b45309" />
                <span>Seu laudo ainda está em processamento. Volte mais tarde para baixá-lo.</span>
              </div>
            )}

            <button onClick={novaConsulta} style={btnSecundario}>Nova consulta</button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#64748b' }}>
          MD Lab · Sistema Laboratorial
        </div>
      </div>

      <style>{`
        .spin { animation: girar 1s linear infinite; }
        @keyframes girar { to { transform: rotate(360deg); } }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
}

// ─── Estilos ───
const tela: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(160deg, #0c2826, #0a1f2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Outfit, sans-serif' };
const container: React.CSSProperties = { width: '100%', maxWidth: 440 };
const logoBox: React.CSSProperties = { width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #0d9488, #4f46e5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 15, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', boxSizing: 'border-box' };
const btnPrimario: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' };
const btnSecundario: React.CSSProperties = { width: '100%', marginTop: 14, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnBaixar: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 18, background: 'linear-gradient(135deg, #0d9488, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' };
const erroBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '11px 14px', borderRadius: 10, fontSize: 13.5 };
const avisoSeguranca: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 18, padding: '12px 14px', background: '#f0fdfa', borderRadius: 10, fontSize: 12.5, color: '#0f766e' };
const avisoAndamento: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, fontSize: 13, color: '#b45309' };
const exameItem: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: 10, gap: 10 };

function statusGeralBadge(pronto: boolean): React.CSSProperties {
  return { fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 20, color: pronto ? '#0f766e' : '#b45309', background: pronto ? '#f0fdfa' : '#fffbeb' };
}
function statusExameBadge(pronto: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, color: pronto ? '#0f766e' : '#64748b', background: pronto ? '#f0fdfa' : '#f1f5f9', whiteSpace: 'nowrap' };
}
