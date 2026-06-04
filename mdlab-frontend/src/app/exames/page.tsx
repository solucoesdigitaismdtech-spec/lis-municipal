'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Plus, X, Loader2, Search, Pencil, Trash2, SlidersHorizontal,
  AlertCircle, Clock, Beaker, Tag,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { examesApi } from '@/lib/api';
import { tokenStorage } from '@/lib/api';

const CATEGORIAS = [
  { v: 'HEMATOLOGIA', l: 'Hematologia', cor: '#dc2626', bg: '#fef2f2' },
  { v: 'BIOQUIMICA', l: 'Bioquímica', cor: '#0d9488', bg: '#f0fdfa' },
  { v: 'URINANALISE', l: 'Urinálise', cor: '#ca8a04', bg: '#fefce8' },
  { v: 'MICROBIOLOGIA', l: 'Microbiologia', cor: '#7c3aed', bg: '#f3e8ff' },
  { v: 'IMUNOLOGIA', l: 'Imunologia', cor: '#2563eb', bg: '#eff6ff' },
  { v: 'HORMONIOS', l: 'Hormônios', cor: '#db2777', bg: '#fdf2f8' },
  { v: 'SOROLOGIAS', l: 'Sorologias', cor: '#0891b2', bg: '#ecfeff' },
  { v: 'OUTROS', l: 'Outros', cor: '#64748b', bg: '#f1f5f9' },
];
const catInfo = (v: string) => CATEGORIAS.find((c) => c.v === v) || CATEGORIAS[7];

export default function ExamesPage() {
  const [exames, setExames] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modal, setModal] = useState<{ aberto: boolean; id: string | null }>({ aberto: false, id: null });
  const [valoresDe, setValoresDe] = useState<string | null>(null);
  const [perfil, setPerfil] = useState('');

  useEffect(() => { setPerfil(tokenStorage.getUser()?.role || ''); }, []);
  const podeEditar = ['ADMIN', 'BIOMEDICO'].includes(perfil);
  const podeRemover = perfil === 'ADMIN';

  const carregar = useCallback(async (termo = busca, cat = categoria) => {
    setCarregando(true);
    try {
      const resp = await examesApi.listar(termo, cat);
      setExames(Array.isArray(resp) ? resp : resp?.dados ?? []);
    } catch {
      setExames([]);
    } finally {
      setCarregando(false);
    }
  }, [busca, categoria]);

  useEffect(() => { carregar('', ''); }, []);
  useEffect(() => {
    const t = setTimeout(() => carregar(busca, categoria), 400);
    return () => clearTimeout(t);
  }, [busca, categoria]);

  const fechar = () => setModal({ aberto: false, id: null });

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Catálogo de Exames</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{exames.length} {exames.length === 1 ? 'exame cadastrado' : 'exames cadastrados'}</p>
        </div>
        {podeEditar && <button onClick={() => setModal({ aberto: true, id: null })} style={btnNovo}><Plus size={18} /> Novo exame</button>}
      </div>

      {/* Busca + filtro categoria */}
      <div style={buscaBox}>
        <Search size={18} color="#94a3b8" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou código..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Outfit, sans-serif' }} />
        {busca && <button onClick={() => setBusca('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={16} color="#94a3b8" /></button>}
      </div>

      {/* Chips de categoria */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setCategoria('')} style={{ ...chipCat, ...(categoria === '' ? { background: '#0a1f1e', color: '#fff', borderColor: '#0a1f1e' } : {}) }}>Todas</button>
        {CATEGORIAS.map((c) => (
          <button key={c.v} onClick={() => setCategoria(categoria === c.v ? '' : c.v)} style={{ ...chipCat, ...(categoria === c.v ? { background: c.cor, color: '#fff', borderColor: c.cor } : {}) }}>{c.l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : exames.length === 0 ? (
          <div style={vazio}>
            <FlaskConical size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>{busca || categoria ? 'Nenhum exame encontrado' : 'Nenhum exame cadastrado'}</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>{busca || categoria ? 'Tente outro filtro' : 'Cadastre o primeiro exame do catálogo'}</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                {['Código', 'Exame', 'Categoria', 'Material', 'Prazo', ''].map((h, i) => <th key={i} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {exames.map((ex) => {
                  const ci = catInfo(ex.categoria);
                  return (
                    <tr key={ex.id} style={{ borderTop: '1px solid #f1f5f9' }} className="linha-ex">
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12.5, color: '#0d9488', fontWeight: 600 }}>{ex.codigo}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>{ex.nome}{ex.sigtap && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>SIGTAP {ex.sigtap}</span>}</td>
                      <td style={td}><span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: ci.cor, background: ci.bg, whiteSpace: 'nowrap' }}>{ci.l}</span></td>
                      <td style={td}>{ex.material}</td>
                      <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 13 }}><Clock size={13} /> {ex.prazoHoras || 24}h</span></td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setValoresDe(ex.id)} title="Valores de referência" style={btnIcon}><SlidersHorizontal size={15} color="#0d9488" /></button>
                        {podeEditar && <button onClick={() => setModal({ aberto: true, id: ex.id })} title="Editar" style={btnIcon}><Pencil size={15} color="#64748b" /></button>}
                        {podeRemover && <BotaoRemover exameId={ex.id} nome={ex.nome} onRemovido={() => carregar(busca, categoria)} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.aberto && <ModalExame exameId={modal.id} onFechar={fechar} onSalvo={() => { fechar(); carregar(busca, categoria); }} />}
      {valoresDe && <ModalValores exameId={valoresDe} podeEditar={podeEditar} onFechar={() => setValoresDe(null)} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}.linha-ex:hover{background:#f8fafc}`}</style>
    </AppLayout>
  );
}

// ─── Botão remover com confirmação ───
function BotaoRemover({ exameId, nome, onRemovido }: { exameId: string; nome: string; onRemovido: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  async function remover() {
    setRemovendo(true);
    try { await examesApi.remover(exameId); onRemovido(); }
    catch { setRemovendo(false); setConfirmar(false); }
  }
  if (confirmar) {
    return (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <button onClick={remover} disabled={removendo} style={{ ...btnIcon, background: '#fef2f2' }} title="Confirmar remoção">
          {removendo ? <Loader2 size={14} className="spin" color="#dc2626" /> : <Trash2 size={15} color="#dc2626" />}
        </button>
        <button onClick={() => setConfirmar(false)} style={btnIcon} title="Cancelar"><X size={15} color="#64748b" /></button>
      </span>
    );
  }
  return <button onClick={() => setConfirmar(true)} title="Remover" style={btnIcon}><Trash2 size={15} color="#cbd5e1" /></button>;
}

// ─── Modal criar/editar exame ───
function ModalExame({ exameId, onFechar, onSalvo }: { exameId: string | null; onFechar: () => void; onSalvo: () => void }) {
  const editando = !!exameId;
  const [form, setForm] = useState({ codigo: '', nome: '', sigtap: '', metodo: '', material: '', categoria: 'BIOQUIMICA', prazoHoras: '24', instrucoes: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(editando);

  useEffect(() => {
    if (editando) {
      examesApi.detalhar(exameId!).then((ex: any) => {
        setForm({
          codigo: ex.codigo || '', nome: ex.nome || '', sigtap: ex.sigtap || '',
          metodo: ex.metodo || '', material: ex.material || '', categoria: ex.categoria || 'BIOQUIMICA',
          prazoHoras: String(ex.prazoHoras || 24), instrucoes: ex.instrucoes || '',
        });
      }).catch(() => setErro('Erro ao carregar exame.')).finally(() => setCarregandoDados(false));
    }
  }, [exameId]);

  const set = (c: string, v: string) => setForm((f) => ({ ...f, [c]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.codigo || !form.nome || !form.material) {
      setErro('Preencha código, nome e material.');
      return;
    }
    setSalvando(true);
    try {
      const dados: any = { ...form, prazoHoras: parseInt(form.prazoHoras) || 24 };
      // limpa campos vazios opcionais
      ['sigtap', 'metodo', 'instrucoes'].forEach((k) => { if (!dados[k]) delete dados[k]; });
      if (editando) {
        const { codigo, ...semCodigo } = dados; // código não muda na edição
        await examesApi.editar(exameId!, semCodigo);
      } else {
        await examesApi.criar(dados);
      }
      onSalvo();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar exame.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={{ ...modal, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: 18, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{editando ? 'Editar exame' : 'Novo exame'}</h2>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>
        {carregandoDados ? (
          <div style={{ padding: 60, textAlign: 'center' }}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : (
          <form onSubmit={salvar} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <Campo label={editando ? 'Código (fixo)' : 'Código *'}><input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} disabled={editando} style={{ ...inp, ...(editando ? { background: '#f1f5f9', color: '#94a3b8' } : {}) }} placeholder="HEM001" /></Campo>
              <Campo label="Nome do exame *"><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inp} placeholder="Hemograma Completo" /></Campo>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Categoria *">
                <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} style={inp}>
                  {CATEGORIAS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </Campo>
              <Campo label="Material *"><input value={form.material} onChange={(e) => set('material', e.target.value)} style={inp} placeholder="Sangue / Urina / Soro" /></Campo>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Campo label="SIGTAP"><input value={form.sigtap} onChange={(e) => set('sigtap', e.target.value)} style={inp} placeholder="0202..." /></Campo>
              <Campo label="Método"><input value={form.metodo} onChange={(e) => set('metodo', e.target.value)} style={inp} placeholder="Opcional" /></Campo>
              <Campo label="Prazo (horas)"><input type="number" min="1" value={form.prazoHoras} onChange={(e) => set('prazoHoras', e.target.value)} style={inp} /></Campo>
            </div>
            <Campo label="Instruções de preparo"><textarea value={form.instrucoes} onChange={(e) => set('instrucoes', e.target.value)} style={{ ...inp, minHeight: 64, resize: 'vertical' }} placeholder="Ex: Jejum de 8 horas. Opcional." /></Campo>

            {erro && <div style={erroBox}><AlertCircle size={15} /> {erro}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onFechar} style={btnCancelar}>Cancelar</button>
              <button type="submit" disabled={salvando} style={btnSalvar}>{salvando ? <><Loader2 size={16} className="spin" /> Salvando...</> : (editando ? 'Salvar alterações' : 'Cadastrar exame')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal valores de referência ───
function ModalValores({ exameId, podeEditar, onFechar }: { exameId: string; podeEditar: boolean; onFechar: () => void }) {
  const [exame, setExame] = useState<any>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [form, setForm] = useState({ campo: '', unidade: '', minimo: '', maximo: '', textoRef: '', sexo: '', faixaIdade: '', critico: false });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    examesApi.detalhar(exameId).then(setExame).catch(() => {});
  }, [exameId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.campo || !form.unidade) { setErro('Campo e unidade são obrigatórios.'); return; }
    setSalvando(true);
    try {
      const dados: any = { campo: form.campo, unidade: form.unidade, critico: form.critico };
      if (form.minimo) dados.minimo = parseFloat(form.minimo);
      if (form.maximo) dados.maximo = parseFloat(form.maximo);
      if (form.textoRef) dados.textoRef = form.textoRef;
      if (form.sexo) dados.sexo = form.sexo;
      if (form.faixaIdade) dados.faixaIdade = form.faixaIdade;
      await examesApi.addValorRef(exameId, dados);
      setForm({ campo: '', unidade: '', minimo: '', maximo: '', textoRef: '', sexo: '', faixaIdade: '', critico: false });
      setNovoAberto(false);
      carregar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao adicionar.');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(valorId: string) {
    try { await examesApi.removerValorRef(exameId, valorId); carregar(); } catch {}
  }

  const setF = (c: string, v: any) => setForm((f) => ({ ...f, [c]: v }));
  const valores = exame?.valoresRef || [];

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={{ ...modal, maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Valores de referência</h2>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{exame?.nome || '...'}</span>
          </div>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          {!exame ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={26} className="spin" color="#0d9488" /></div>
          ) : (
            <>
              {valores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <Beaker size={32} color="#cbd5e1" />
                  <div style={{ marginTop: 8, fontSize: 13.5 }}>Nenhum valor de referência ainda</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {valores.map((v: any) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid #f1f5f9', borderRadius: 12, background: v.critico ? '#fef2f2' : '#fff' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0a1f1e' }}>{v.campo} {v.critico && <span style={{ fontSize: 10.5, color: '#dc2626', fontWeight: 700, marginLeft: 4 }}>CRÍTICO</span>}</div>
                        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                          {v.textoRef ? v.textoRef : `${v.minimo ?? '—'} a ${v.maximo ?? '—'}`} {v.unidade}
                          {v.sexo && <span style={{ marginLeft: 6, color: '#94a3b8' }}>· {v.sexo === 'FEMININO' ? '♀' : v.sexo === 'MASCULINO' ? '♂' : '⚲'}</span>}
                          {v.faixaIdade && <span style={{ marginLeft: 6, color: '#94a3b8' }}>· {v.faixaIdade}</span>}
                        </div>
                      </div>
                      {podeEditar && <button onClick={() => remover(v.id)} style={btnIcon}><Trash2 size={14} color="#cbd5e1" /></button>}
                    </div>
                  ))}
                </div>
              )}

              {podeEditar && !novoAberto && (
                <button onClick={() => setNovoAberto(true)} style={{ ...btnAddMini, width: '100%', justifyContent: 'center', padding: 10 }}><Plus size={15} /> Adicionar valor de referência</button>
              )}

              {novoAberto && (
                <form onSubmit={adicionar} style={{ border: '1.5px solid #99f6e4', background: '#f0fdfa', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <input value={form.campo} onChange={(e) => setF('campo', e.target.value)} placeholder="Campo (ex: Hemoglobina)" style={inpMini} />
                    <input value={form.unidade} onChange={(e) => setF('unidade', e.target.value)} placeholder="Unidade (g/dL)" style={inpMini} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input type="number" step="any" value={form.minimo} onChange={(e) => setF('minimo', e.target.value)} placeholder="Mínimo" style={inpMini} />
                    <input type="number" step="any" value={form.maximo} onChange={(e) => setF('maximo', e.target.value)} placeholder="Máximo" style={inpMini} />
                  </div>
                  <input value={form.textoRef} onChange={(e) => setF('textoRef', e.target.value)} placeholder="Ou texto de referência (ex: Não reagente)" style={inpMini} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <select value={form.sexo} onChange={(e) => setF('sexo', e.target.value)} style={inpMini}>
                      <option value="">Ambos os sexos</option><option value="FEMININO">Feminino</option><option value="MASCULINO">Masculino</option>
                    </select>
                    <input value={form.faixaIdade} onChange={(e) => setF('faixaIdade', e.target.value)} placeholder="Faixa idade (18+)" style={inpMini} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.critico} onChange={(e) => setF('critico', e.target.checked)} /> Valor crítico (alerta)
                  </label>
                  {erro && <div style={erroBox}><AlertCircle size={14} /> {erro}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => { setNovoAberto(false); setErro(''); }} style={{ ...btnCancelar, padding: 9 }}>Cancelar</button>
                    <button type="submit" disabled={salvando} style={{ ...btnSalvar, padding: 9 }}>{salvando ? <Loader2 size={15} className="spin" /> : 'Adicionar'}</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</label>{children}</div>;
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const btnNovo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer', boxShadow: '0 6px 18px rgba(13,148,136,.25)' };
const buscaBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 12 };
const chipCat: React.CSSProperties = { padding: '7px 14px', borderRadius: 20, borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', background: '#fff', fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: '#334155' };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const btnIcon: React.CSSProperties = { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const btnX: React.CSSProperties = { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 11, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff', boxSizing: 'border-box' };
const inpMini: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #ccfbf1', borderRadius: 9, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff', boxSizing: 'border-box' };
const erroBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 };
const btnCancelar: React.CSSProperties = { flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnSalvar: React.CSSProperties = { flex: 2, padding: 12, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
const btnAddMini: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
