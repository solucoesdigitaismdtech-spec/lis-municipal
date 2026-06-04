'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Loader2, User, FileCheck, FileClock, Printer, X, ShieldCheck,
  Download, AlertCircle, Search, Calendar,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { laudosApi } from '@/lib/api';
import { tokenStorage } from '@/lib/api';

export default function LaudosPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [laudoAberto, setLaudoAberto] = useState<string | null>(null);
  const [perfil, setPerfil] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => { setPerfil(tokenStorage.getUser()?.role || ''); }, []);
  const podeGerar = ['ADMIN', 'BIOMEDICO'].includes(perfil);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await laudosApi.listar();
      setOrdens(Array.isArray(resp) ? resp : resp?.dados ?? []);
    } catch {
      setOrdens([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Filtra por nome do paciente ou protocolo (busca local)
  const ordensFiltradas = busca.trim()
    ? ordens.filter((o) => {
        const t = busca.toLowerCase();
        return (o.paciente?.nome || '').toLowerCase().includes(t) || (o.protocolo || '').toLowerCase().includes(t);
      })
    : ordens;

  const dataOS = (o: any) => {
    const d = o.laudo?.liberadoEm || o.updatedAt || o.createdAt;
    return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  };

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Laudos</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Ordens concluídas e laudos emitidos</p>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{ordensFiltradas.length} {ordensFiltradas.length === 1 ? 'ordem' : 'ordens'}</span>
      </div>

      {/* Busca por nome do paciente ou protocolo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
        <Search size={18} color="#94a3b8" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome do paciente ou protocolo..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Outfit, sans-serif' }} />
        {busca && <button onClick={() => setBusca('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={16} color="#94a3b8" /></button>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : ordensFiltradas.length === 0 ? (
          <div style={vazio}>
            <FileText size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>{busca ? 'Nenhum resultado para a busca' : 'Nenhuma ordem concluída'}</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>{busca ? 'Tente outro nome ou protocolo' : 'Os laudos aparecem aqui quando as OS são validadas'}</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                {['Protocolo', 'Paciente', 'Data', 'Exames', 'Laudo', 'Ação'].map((h, i) => <th key={i} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ordensFiltradas.map((o) => {
                  const temLaudo = !!o.laudo;
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12.5, color: '#0d9488', fontWeight: 600 }}>{o.protocolo}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>{o.paciente?.nome}</td>
                      <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13 }}><Calendar size={13} /> {dataOS(o)}</span></td>
                      <td style={td}>{o._count?.itens ?? '—'}</td>
                      <td style={td}>
                        {temLaudo ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0f766e', background: '#f0fdfa', padding: '4px 10px', borderRadius: 20 }}><FileCheck size={13} /> Emitido</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#b45309', background: '#fffbeb', padding: '4px 10px', borderRadius: 20 }}><FileClock size={13} /> Pronto p/ gerar</span>
                        )}
                      </td>
                      <td style={td}>
                        {temLaudo ? (
                          <button onClick={() => setLaudoAberto(o.id)} style={btnVer}><Printer size={14} /> Ver laudo</button>
                        ) : podeGerar ? (
                          <BotaoGerar ordemId={o.id} onGerado={() => { carregar(); setLaudoAberto(o.id); }} />
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>Aguardando emissão</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {laudoAberto && <VisualizadorLaudo ordemId={laudoAberto} onFechar={() => setLaudoAberto(null)} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );
}

function BotaoGerar({ ordemId, onGerado }: { ordemId: string; onGerado: () => void }) {
  const [gerando, setGerando] = useState(false);
  async function gerar() {
    setGerando(true);
    try { await laudosApi.gerar(ordemId); onGerado(); }
    catch { setGerando(false); }
  }
  return (
    <button onClick={gerar} disabled={gerando} style={btnGerar}>
      {gerando ? <Loader2 size={14} className="spin" /> : <FileText size={14} />} Gerar laudo
    </button>
  );
}

// ─── Visualizador imprimível do laudo ───
function VisualizadorLaudo({ ordemId, onFechar }: { ordemId: string; onFechar: () => void }) {
  const [ordem, setOrdem] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    laudosApi.dados(ordemId).then(setOrdem).catch(() => setErro('Erro ao carregar o laudo.'));
  }, [ordemId]);

  const idade = (data: string) => data ? Math.floor((Date.now() - new Date(data).getTime()) / (365.25 * 24 * 3600 * 1000)) : '';
  const dataBR = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const horaBR = (d: string) => d ? new Date(d).toLocaleString('pt-BR') : '—';

  const foraDaFaixa = (ref: any, valorStr: string) => {
    const n = parseFloat(String(valorStr)?.replace(',', '.'));
    if (isNaN(n)) return false;
    if (ref.minimo != null && n < ref.minimo) return true;
    if (ref.maximo != null && n > ref.maximo) return true;
    return false;
  };

  // Os valores podem vir como texto simples ("14.2") ou como objeto
  // { valor, unidade, situacao, referencia }. Estas funções extraem
  // cada parte de forma segura, independente do formato.
  const obterValor = (valor: any) =>
    valor && typeof valor === 'object' && 'valor' in valor ? valor.valor : valor;
  const obterUnidade = (valor: any, ref: any) =>
    valor && typeof valor === 'object' && valor.unidade ? valor.unidade : (ref?.unidade || '');
  const obterReferencia = (valor: any, ref: any) => {
    if (valor && typeof valor === 'object' && valor.referencia) return valor.referencia;
    if (!ref) return '—';
    return ref.textoRef ? ref.textoRef : `${ref.minimo ?? '—'} a ${ref.maximo ?? '—'} ${ref.unidade || ''}`;
  };

  function imprimir() { window.print(); }

  const [baixando, setBaixando] = useState(false);
  async function baixarPdf() {
    setBaixando(true);
    try {
      // Busca o PDF do backend enviando o token (a rota exige login)
      const token = tokenStorage.getAccess();
      const resp = await fetch(`/api/laudos/ordem/${ordemId}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Falha ao gerar o PDF');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      // Abre o PDF numa nova aba (o usuário pode salvar/imprimir de lá)
      window.open(url, '_blank');
      // Libera a memória depois de um tempo
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert('Não foi possível gerar o PDF. Verifique se o servidor está com o Puppeteer ativo.');
    } finally {
      setBaixando(false);
    }
  }

  if (erro) return (
    <div style={overlayLaudo} onClick={onFechar}><div style={{ background: '#fff', padding: 30, borderRadius: 16 }} onClick={(e) => e.stopPropagation()}>{erro}</div></div>
  );
  if (!ordem) return (
    <div style={overlayLaudo}><div style={{ padding: 60 }}><Loader2 size={30} className="spin" color="#fff" /></div></div>
  );

  const lab = ordem.laboratorio || {};
  const laudo = ordem.laudo || {};

  return (
    <div style={overlayLaudo} onClick={onFechar}>
      {/* Barra de ações (não imprime) */}
      <div style={barraAcoes} className="nao-imprime" onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} style={btnBarraSec}><X size={16} /> Fechar</button>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Laudo — {ordem.protocolo}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={imprimir} style={btnBarraSec}><Printer size={16} /> Imprimir</button>
          <button onClick={baixarPdf} disabled={baixando} style={btnBarra}>
            {baixando ? <Loader2 size={16} className="spin" /> : <Download size={16} />} {baixando ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {/* Folha do laudo */}
      <div style={folhaWrap} onClick={(e) => e.stopPropagation()}>
        <div style={folha} id="laudo-folha">
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d9488', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{lab.nome || 'Laboratório'}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                {lab.municipio}/{lab.uf} {lab.cnes && `· CNES ${lab.cnes}`}<br />
                {lab.responsavelTecnico && `Resp. Técnico: ${lab.responsavelTecnico}`}{lab.crbm && ` · CRBM ${lab.crbm}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Laudo de Análises</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#0d9488', marginTop: 2 }}>{ordem.protocolo}</div>
            </div>
          </div>

          {/* Dados do paciente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
            <div><strong style={{ color: '#334155' }}>Paciente:</strong> {ordem.paciente?.nome}</div>
            <div><strong style={{ color: '#334155' }}>Sexo:</strong> {ordem.paciente?.sexo === 'FEMININO' ? 'Feminino' : ordem.paciente?.sexo === 'MASCULINO' ? 'Masculino' : 'Outro'}</div>
            <div><strong style={{ color: '#334155' }}>Nascimento:</strong> {dataBR(ordem.paciente?.dataNascimento)} ({idade(ordem.paciente?.dataNascimento)} anos)</div>
            <div><strong style={{ color: '#334155' }}>Unidade:</strong> {ordem.unidade?.nome}</div>
          </div>

          {/* Exames */}
          {ordem.itens?.map((item: any) => {
            const valores = item.resultado?.valores || {};
            const valoresRef = item.exame?.valoresRef || [];
            const bio = item.resultado?.biomedico?.name;
            return (
              <div key={item.id} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d9488', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', fontSize: 13.5, fontWeight: 700 }}>
                  {item.exame?.nome} {item.exame?.material && <span style={{ fontWeight: 400, opacity: 0.9 }}>· {item.exame.material}</span>}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}>
                    <th style={tLaudo}>Parâmetro</th><th style={tLaudo}>Resultado</th><th style={tLaudo}>Valores de referência</th>
                  </tr></thead>
                  <tbody>
                    {Object.keys(valores).length === 0 ? (
                      <tr><td colSpan={3} style={{ ...tdLaudo, color: '#94a3b8', textAlign: 'center' }}>Sem valores registrados</td></tr>
                    ) : Object.entries(valores).map(([campo, valor]: [string, any]) => {
                      const ref = valoresRef.find((v: any) => v.campo === campo);
                      const valorExibir = obterValor(valor);
                      const unidadeExibir = obterUnidade(valor, ref);
                      const referenciaExibir = obterReferencia(valor, ref);
                      const fora = ref && foraDaFaixa(ref, valorExibir);
                      return (
                        <tr key={campo}>
                          <td style={tdLaudo}>{campo}</td>
                          <td style={{ ...tdLaudo, fontWeight: 700, color: fora ? '#dc2626' : '#0a1f1e' }}>{String(valorExibir ?? '—')} {unidadeExibir} {fora && '⚠'}</td>
                          <td style={{ ...tdLaudo, color: '#64748b' }}>{referenciaExibir}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {item.resultado?.observacao && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>Obs: {item.resultado.observacao}</div>}
                {bio && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>Validado por {bio}{item.resultado?.validadoEm ? ` em ${horaBR(item.resultado.validadoEm)}` : ''}</div>}
              </div>
            );
          })}

          {/* Rodapé com autenticação */}
          <div style={{ marginTop: 30, borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 360, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0d9488', fontWeight: 600, marginBottom: 4 }}><ShieldCheck size={13} /> Documento autenticado eletronicamente</div>
              Código de autenticação:<br /><span style={{ fontFamily: 'monospace', color: '#334155' }}>{laudo.hashAutenticacao || '—'}</span><br />
              {laudo.liberadoEm && <>Emitido em {horaBR(laudo.liberadoEm)}<br /></>}
              Verifique a autenticidade pelo QR code ao lado.
            </div>
            {laudo.qrCodeUrl && <img src={laudo.qrCodeUrl} alt="QR de verificação" style={{ width: 96, height: 96 }} />}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .nao-imprime { display: none !important; }
          body * { visibility: hidden; }
          #laudo-folha, #laudo-folha * { visibility: visible; }
          #laudo-folha { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: '#334155' };
const btnVer: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a1f1e', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnGerar: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const overlayLaudo: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 300, overflowY: 'auto', padding: '0 0 40px' };
const barraAcoes: React.CSSProperties = { position: 'sticky', top: 0, width: '100%', maxWidth: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', zIndex: 10 };
const btnBarra: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
const btnBarraSec: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const folhaWrap: React.CSSProperties = { width: '100%', maxWidth: 800, padding: '0 16px' };
const folha: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,.2)', fontFamily: 'Outfit, sans-serif' };
const tLaudo: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e2e8f0' };
const tdLaudo: React.CSSProperties = { padding: '8px 12px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #f1f5f9' };
