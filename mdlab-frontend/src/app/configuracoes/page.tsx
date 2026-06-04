'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Users, Loader2, Plus, X, Pencil, Check, AlertCircle,
  Power, Save, Shield, FlaskConical, UserCog, Database, Wifi, WifiOff, RefreshCw,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { unidadesApi, usersApi, laboratoriosApi, esusApi, tokenStorage } from '@/lib/api';

const ABAS = [
  { id: 'lab', label: 'Laboratório', icone: Building2 },
  { id: 'unidades', label: 'Unidades de Saúde', icone: MapPin },
  { id: 'usuarios', label: 'Usuários', icone: Users },
  { id: 'esus', label: 'Integração e-SUS', icone: Database },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState('lab');
  const [perfil, setPerfil] = useState('');

  useEffect(() => { setPerfil(tokenStorage.getUser()?.role || ''); }, []);
  const ehAdmin = perfil === 'ADMIN';

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Configurações</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Laboratório, unidades de saúde e usuários do sistema</p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {ABAS.map((a) => {
          const Icone = a.icone;
          const ativa = aba === a.id;
          return (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', border: 'none',
              background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'Outfit, sans-serif', color: ativa ? '#0d9488' : '#64748b',
              borderBottom: ativa ? '2px solid #0d9488' : '2px solid transparent', marginBottom: -1,
            }}>
              <Icone size={16} /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === 'lab' && <AbaLaboratorio ehAdmin={ehAdmin} />}
      {aba === 'unidades' && <AbaUnidades ehAdmin={ehAdmin} />}
      {aba === 'usuarios' && <AbaUsuarios ehAdmin={ehAdmin} />}
      {aba === 'esus' && <AbaEsus ehAdmin={ehAdmin} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );
}

// ═══════════════════════ ABA LABORATÓRIO ═══════════════════════
function AbaLaboratorio({ ehAdmin }: { ehAdmin: boolean }) {
  const [lab, setLab] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: string; texto: string } | null>(null);

  useEffect(() => {
    laboratoriosApi.meu().then((l: any) => {
      setLab(l);
      setForm({
        nome: l.nome || '', cnes: l.cnes || '', municipio: l.municipio || '', uf: l.uf || '',
        cnpj: l.cnpj || '', responsavelTecnico: l.responsavelTecnico || '', crbm: l.crbm || '',
      });
    }).catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar o laboratório.' }))
      .finally(() => setCarregando(false));
  }, []);

  const set = (c: string, v: string) => setForm((f: any) => ({ ...f, [c]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setSalvando(true);
    try {
      await laboratoriosApi.editar(lab.id, form);
      setMsg({ tipo: 'ok', texto: 'Dados do laboratório atualizados!' });
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Erro ao salvar.' });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>;

  return (
    <div style={cartao}>
      <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Campo label="Nome do laboratório *"><input value={form.nome} onChange={(e) => set('nome', e.target.value)} disabled={!ehAdmin} style={inp} /></Campo>
        <div style={grid2}>
          <Campo label="CNES *"><input value={form.cnes} onChange={(e) => set('cnes', e.target.value)} disabled={!ehAdmin} style={inp} placeholder="7 dígitos" /></Campo>
          <Campo label="CNPJ"><input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} disabled={!ehAdmin} style={inp} placeholder="Opcional" /></Campo>
        </div>
        <div style={grid2}>
          <Campo label="Município *"><input value={form.municipio} onChange={(e) => set('municipio', e.target.value)} disabled={!ehAdmin} style={inp} /></Campo>
          <Campo label="UF *"><input value={form.uf} onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))} disabled={!ehAdmin} style={inp} maxLength={2} placeholder="PB" /></Campo>
        </div>
        <div style={grid2}>
          <Campo label="Responsável técnico"><input value={form.responsavelTecnico} onChange={(e) => set('responsavelTecnico', e.target.value)} disabled={!ehAdmin} style={inp} placeholder="Nome do biomédico responsável" /></Campo>
          <Campo label="CRBM"><input value={form.crbm} onChange={(e) => set('crbm', e.target.value)} disabled={!ehAdmin} style={inp} placeholder="Registro profissional" /></Campo>
        </div>

        <div style={{ fontSize: 12.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Estes dados aparecem no cabeçalho dos laudos impressos.
        </div>

        {msg && <div style={msg.tipo === 'ok' ? msgOk : erroBox}>{msg.tipo === 'ok' ? <Check size={15} /> : <AlertCircle size={15} />} {msg.texto}</div>}

        {ehAdmin && (
          <button type="submit" disabled={salvando} style={{ ...btnPrimario, alignSelf: 'flex-start' }}>
            {salvando ? <><Loader2 size={16} className="spin" /> Salvando...</> : <><Save size={16} /> Salvar alterações</>}
          </button>
        )}
        {!ehAdmin && <div style={{ fontSize: 13, color: '#94a3b8' }}>Apenas administradores podem editar estes dados.</div>}
      </form>
    </div>
  );
}

// ═══════════════════════ ABA UNIDADES ═══════════════════════
const TIPOS_UNIDADE = [
  { v: 'UBS', l: 'UBS' }, { v: 'UPA', l: 'UPA' }, { v: 'HOSPITAL', l: 'Hospital' },
  { v: 'POSTO_SAUDE', l: 'Posto de Saúde' }, { v: 'LABORATORIO', l: 'Laboratório' },
];

function AbaUnidades({ ehAdmin }: { ehAdmin: boolean }) {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ aberto: boolean; unidade: any | null }>({ aberto: false, unidade: null });

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await unidadesApi.listar();
      setUnidades(Array.isArray(resp) ? resp : resp?.dados ?? []);
    } catch { setUnidades([]); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function toggle(u: any) {
    try { await unidadesApi.toggleAtiva(u.id, !(u.ativa ?? true)); carregar(); } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>{unidades.length} {unidades.length === 1 ? 'unidade' : 'unidades'}</span>
        {ehAdmin && <button onClick={() => setModal({ aberto: true, unidade: null })} style={btnPrimario}><Plus size={16} /> Nova unidade</button>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        : unidades.length === 0 ? <div style={vazio}><MapPin size={34} color="#cbd5e1" /><span style={{ marginTop: 10, color: '#334155', fontWeight: 600 }}>Nenhuma unidade cadastrada</span></div>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr style={{ background: '#f8fafc' }}>{['Nome', 'Tipo', 'CNES', 'Status', ''].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {unidades.map((u) => {
                  const ativa = u.ativa ?? true;
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>{u.nome}</td>
                      <td style={td}>{TIPOS_UNIDADE.find((t) => t.v === u.tipo)?.l || u.tipo}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{u.cnes || '—'}</td>
                      <td style={td}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: ativa ? '#0f766e' : '#94a3b8', background: ativa ? '#f0fdfa' : '#f1f5f9' }}>{ativa ? 'Ativa' : 'Inativa'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {ehAdmin && <>
                          <button onClick={() => setModal({ aberto: true, unidade: u })} title="Editar" style={btnIcon}><Pencil size={15} color="#64748b" /></button>
                          <button onClick={() => toggle(u)} title={ativa ? 'Desativar' : 'Ativar'} style={btnIcon}><Power size={15} color={ativa ? '#dc2626' : '#0d9488'} /></button>
                        </>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.aberto && <ModalUnidade unidade={modal.unidade} onFechar={() => setModal({ aberto: false, unidade: null })} onSalvo={() => { setModal({ aberto: false, unidade: null }); carregar(); }} />}
    </div>
  );
}

function ModalUnidade({ unidade, onFechar, onSalvo }: { unidade: any; onFechar: () => void; onSalvo: () => void }) {
  const editando = !!unidade;
  const [form, setForm] = useState({ nome: unidade?.nome || '', cnes: unidade?.cnes || '', endereco: unidade?.endereco || '', tipo: unidade?.tipo || 'UBS' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (c: string, v: string) => setForm((f) => ({ ...f, [c]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.nome) { setErro('Nome é obrigatório.'); return; }
    if (form.cnes && !/^\d{7}$/.test(form.cnes)) { setErro('CNES deve ter 7 dígitos numéricos.'); return; }
    setSalvando(true);
    try {
      const dados: any = { nome: form.nome, tipo: form.tipo };
      if (form.cnes) dados.cnes = form.cnes;
      if (form.endereco) dados.endereco = form.endereco;
      if (editando) await unidadesApi.editar(unidade.id, dados);
      else await unidadesApi.criar(dados);
      onSalvo();
    } catch (err: any) { setErro(err.message || 'Erro ao salvar.'); setSalvando(false); }
  }

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: 18, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{editando ? 'Editar unidade' : 'Nova unidade'}</h2>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>
        <form onSubmit={salvar} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo label="Nome da unidade *"><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inp} placeholder="UBS Centro" /></Campo>
          <div style={grid2}>
            <Campo label="Tipo *">
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} style={inp}>
                {TIPOS_UNIDADE.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </Campo>
            <Campo label="CNES"><input value={form.cnes} onChange={(e) => set('cnes', e.target.value)} style={inp} placeholder="7 dígitos" /></Campo>
          </div>
          <Campo label="Endereço"><input value={form.endereco} onChange={(e) => set('endereco', e.target.value)} style={inp} placeholder="Opcional" /></Campo>
          {erro && <div style={erroBox}><AlertCircle size={15} /> {erro}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onFechar} style={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={salvando} style={{ ...btnPrimario, flex: 2, justifyContent: 'center' }}>{salvando ? <><Loader2 size={16} className="spin" /> Salvando...</> : (editando ? 'Salvar' : 'Cadastrar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════ ABA USUÁRIOS ═══════════════════════
const ROLES = [
  { v: 'ADMIN', l: 'Administrador', cor: '#7c3aed', bg: '#f3e8ff', icone: Shield },
  { v: 'BIOMEDICO', l: 'Biomédico', cor: '#0d9488', bg: '#f0fdfa', icone: UserCog },
  { v: 'TECNICO', l: 'Técnico', cor: '#2563eb', bg: '#eff6ff', icone: FlaskConical },
];
const roleInfo = (v: string) => ROLES.find((r) => r.v === v) || ROLES[2];

function AbaUsuarios({ ehAdmin }: { ehAdmin: boolean }) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await usersApi.listar();
      setUsuarios(Array.isArray(resp) ? resp : resp?.dados ?? []);
    } catch { setUsuarios([]); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function toggle(u: any) {
    try { await usersApi.toggleAtivo(u.id, !(u.active ?? u.ativo ?? true)); carregar(); } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>{usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}</span>
        {ehAdmin && <button onClick={() => setModalAberto(true)} style={btnPrimario}><Plus size={16} /> Novo usuário</button>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        : usuarios.length === 0 ? <div style={vazio}><Users size={34} color="#cbd5e1" /><span style={{ marginTop: 10, color: '#334155', fontWeight: 600 }}>Nenhum usuário</span></div>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr style={{ background: '#f8fafc' }}>{['Nome', 'E-mail', 'Perfil', 'Status', ''].map((h, i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {usuarios.map((u) => {
                  const ri = roleInfo(u.role);
                  const Icone = ri.icone;
                  const ativo = u.active ?? u.ativo ?? true;
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>{u.name}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: ri.cor, background: ri.bg }}><Icone size={12} /> {ri.l}</span></td>
                      <td style={td}><span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: ativo ? '#0f766e' : '#94a3b8', background: ativo ? '#f0fdfa' : '#f1f5f9' }}>{ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {ehAdmin && <button onClick={() => toggle(u)} title={ativo ? 'Desativar' : 'Ativar'} style={btnIcon}><Power size={15} color={ativo ? '#dc2626' : '#0d9488'} /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && <ModalUsuario onFechar={() => setModalAberto(false)} onSalvo={() => { setModalAberto(false); carregar(); }} />}
    </div>
  );
}

function ModalUsuario({ onFechar, onSalvo }: { onFechar: () => void; onSalvo: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TECNICO' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (c: string, v: string) => setForm((f) => ({ ...f, [c]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.name || form.name.length < 3) { setErro('Nome deve ter ao menos 3 caracteres.'); return; }
    if (!form.email) { setErro('E-mail é obrigatório.'); return; }
    if (form.password.length < 8) { setErro('Senha deve ter ao menos 8 caracteres.'); return; }
    setSalvando(true);
    try {
      await usersApi.criar(form);
      onSalvo();
    } catch (err: any) { setErro(err.message || 'Erro ao criar usuário.'); setSalvando(false); }
  }

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: 18, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Novo usuário</h2>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>
        <form onSubmit={salvar} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo label="Nome completo *"><input value={form.name} onChange={(e) => set('name', e.target.value)} style={inp} /></Campo>
          <Campo label="E-mail *"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inp} placeholder="usuario@lab.local" /></Campo>
          <div style={grid2}>
            <Campo label="Senha *"><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} style={inp} placeholder="Mín. 8 caracteres" /></Campo>
            <Campo label="Perfil *">
              <select value={form.role} onChange={(e) => set('role', e.target.value)} style={inp}>
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </Campo>
          </div>
          {erro && <div style={erroBox}><AlertCircle size={15} /> {erro}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onFechar} style={btnSecundario}>Cancelar</button>
            <button type="submit" disabled={salvando} style={{ ...btnPrimario, flex: 2, justifyContent: 'center' }}>{salvando ? <><Loader2 size={16} className="spin" /> Criando...</> : 'Criar usuário'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════ ABA INTEGRAÇÃO e-SUS ═══════════════════════
function AbaEsus({ ehAdmin }: { ehAdmin: boolean }) {
  const [status, setStatus] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({ host: '', porta: '5432', banco: 'esus', usuario: '', senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: string; texto: string } | null>(null);

  const carregarStatus = useCallback(() => {
    setCarregando(true);
    esusApi.status()
      .then((s: any) => setStatus(s))
      .catch(() => setStatus(null))
      .finally(() => setCarregando(false));
  }, []);
  useEffect(() => { carregarStatus(); }, [carregarStatus]);

  const set = (c: string, v: string) => setForm((f) => ({ ...f, [c]: v }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.host || !form.usuario || !form.senha) {
      setMsg({ tipo: 'erro', texto: 'Host, usuário e senha são obrigatórios.' });
      return;
    }
    setSalvando(true);
    try {
      const dados: any = { host: form.host, usuario: form.usuario, senha: form.senha };
      if (form.porta) dados.porta = parseInt(form.porta);
      if (form.banco) dados.banco = form.banco;
      const resp = await esusApi.configurar(dados);
      // O backend testa ao salvar — reflete o resultado
      setMsg({ tipo: 'ok', texto: 'Conexão salva e testada com sucesso!' });
      setForm((f) => ({ ...f, senha: '' })); // limpa a senha do campo após salvar
      carregarStatus();
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Falha ao salvar/testar a conexão. Verifique as credenciais.' });
    } finally {
      setSalvando(false);
    }
  }

  async function reTestar() {
    setMsg(null); setTestando(true);
    try {
      await esusApi.testar();
      setMsg({ tipo: 'ok', texto: 'Conexão testada com sucesso!' });
      carregarStatus();
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err.message || 'Falha no teste de conexão.' });
      carregarStatus();
    } finally {
      setTestando(false);
    }
  }

  if (!ehAdmin) {
    return <div style={cartao}><div style={{ fontSize: 14, color: '#94a3b8' }}>Apenas administradores podem configurar a integração e-SUS.</div></div>;
  }

  // Determina se está conectado a partir do status retornado
  const conectado = status && (status.statusConexao === 'OK' || status.statusConexao === 'CONECTADO' || status.ativa === true && !status.erroConexao);
  const jaConfigurado = status && (status.host || status.statusConexao || status.ultimoTesteEm);

  return (
    <div>
      {/* Painel de status */}
      <div style={{ ...cartao, marginBottom: 16, maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: conectado ? '#f0fdfa' : jaConfigurado ? '#fef2f2' : '#f1f5f9', flexShrink: 0 }}>
            {carregando ? <Loader2 size={24} className="spin" color="#0d9488" /> : conectado ? <Wifi size={24} color="#0d9488" /> : jaConfigurado ? <WifiOff size={24} color="#dc2626" /> : <Database size={24} color="#94a3b8" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>
              {carregando ? 'Verificando...' : conectado ? 'Conectado ao e-SUS' : jaConfigurado ? 'Conexão com problema' : 'e-SUS não configurado'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {jaConfigurado && status?.ultimoTesteEm ? `Último teste: ${new Date(status.ultimoTesteEm).toLocaleString('pt-BR')}` : 'Configure a conexão abaixo com os dados fornecidos pelo município.'}
              {status?.erroConexao && <span style={{ color: '#dc2626', display: 'block', marginTop: 2 }}>{status.erroConexao}</span>}
            </div>
          </div>
          {jaConfigurado && (
            <button onClick={reTestar} disabled={testando} style={btnSecundario2}>
              {testando ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} Testar
            </button>
          )}
        </div>
      </div>

      {/* Formulário de credenciais */}
      <div style={{ ...cartao, maxWidth: 720 }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0a1f1e', marginBottom: 4 }}>
          {jaConfigurado ? 'Atualizar credenciais' : 'Configurar conexão'}
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Use o usuário de leitura (ex: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>esus_leitura</code>) fornecido pelo município.
        </p>

        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <Campo label="Host / IP do servidor *"><input value={form.host} onChange={(e) => set('host', e.target.value)} style={inp} placeholder="192.168.1.100" /></Campo>
            <Campo label="Porta"><input value={form.porta} onChange={(e) => set('porta', e.target.value)} style={inp} placeholder="5432" /></Campo>
            <Campo label="Banco"><input value={form.banco} onChange={(e) => set('banco', e.target.value)} style={inp} placeholder="esus" /></Campo>
          </div>
          <div style={grid2}>
            <Campo label="Usuário do banco *"><input value={form.usuario} onChange={(e) => set('usuario', e.target.value)} style={inp} placeholder="esus_leitura" autoComplete="off" /></Campo>
            <Campo label="Senha *"><input type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)} style={inp} placeholder="••••••••" autoComplete="new-password" /></Campo>
          </div>

          <div style={{ fontSize: 12.5, color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} /> As credenciais são criptografadas antes de serem salvas. Recomenda-se um usuário com permissão somente de leitura.
          </div>

          {msg && <div style={msg.tipo === 'ok' ? msgOk : erroBox}>{msg.tipo === 'ok' ? <Check size={15} /> : <AlertCircle size={15} />} {msg.texto}</div>}

          <button type="submit" disabled={salvando} style={{ ...btnPrimario, alignSelf: 'flex-start' }}>
            {salvando ? <><Loader2 size={16} className="spin" /> Salvando e testando...</> : <><Database size={16} /> Salvar e testar conexão</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers visuais ───
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</label>{children}</div>;
}

const cartao: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, maxWidth: 720 };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', color: '#94a3b8', fontSize: 14 };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: '#334155' };
const btnIcon: React.CSSProperties = { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 };
const btnPrimario: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, padding: '10px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' };
const btnSecundario: React.CSSProperties = { flex: 1, padding: 11, background: '#f1f5f9', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnSecundario2: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', flexShrink: 0 };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const btnX: React.CSSProperties = { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 11, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff', boxSizing: 'border-box' };
const erroBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 };
const msgOk: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', padding: '10px 14px', borderRadius: 10, fontSize: 13 };
