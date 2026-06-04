'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserPlus, X, Loader2, User, ChevronLeft, ChevronRight, Pencil,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { pacientesApi, unidadesApi } from '@/lib/api';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [paginacao, setPaginacao] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<{ aberto: boolean; pacienteId: string | null }>({ aberto: false, pacienteId: null });

  const carregar = useCallback(async (pagina = 1, termo = busca) => {
    setCarregando(true);
    try {
      const resp = await pacientesApi.listar(termo, pagina);
      setPacientes(resp?.dados ?? []);
      setPaginacao({
        pagina: resp?.paginacao?.pagina ?? 1,
        totalPaginas: resp?.paginacao?.totalPaginas ?? 1,
        total: resp?.paginacao?.total ?? 0,
      });
    } catch {
      setPacientes([]);
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => { carregar(1, ''); }, []);
  useEffect(() => {
    const t = setTimeout(() => carregar(1, busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  const idade = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / (365.25 * 24 * 3600 * 1000));
  const fechar = () => setModal({ aberto: false, pacienteId: null });
  const salvo = () => { fechar(); carregar(paginacao.pagina, busca); };

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Pacientes</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
            {paginacao.total} {paginacao.total === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
          </p>
        </div>
        <button onClick={() => setModal({ aberto: true, pacienteId: null })} style={btnNovo}>
          <UserPlus size={18} /> Novo paciente
        </button>
      </div>

      <div style={buscaBox}>
        <Search size={18} color="#94a3b8" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Outfit, sans-serif' }} />
        {busca && <button onClick={() => setBusca('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={16} color="#94a3b8" /></button>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /><span style={{ marginTop: 10 }}>Carregando...</span></div>
        ) : pacientes.length === 0 ? (
          <div style={vazio}>
            <User size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>{busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>{busca ? 'Tente outro termo de busca' : 'Cadastre o primeiro paciente'}</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nome', 'CPF', 'Nascimento', 'Sexo', 'Telefone', ''].map((h, i) => <th key={i} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id} onClick={() => setModal({ aberto: true, pacienteId: p.id })} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }} className="linha-pac">
                    <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarMini}>{p.nome?.[0]?.toUpperCase()}</div>{p.nome}
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{p.cpf}</td>
                    <td style={td}>{new Date(p.dataNascimento).toLocaleDateString('pt-BR')} <span style={{ color: '#94a3b8', fontSize: 12 }}>({idade(p.dataNascimento)}a)</span></td>
                    <td style={td}>{p.sexo === 'FEMININO' ? 'Feminino' : p.sexo === 'MASCULINO' ? 'Masculino' : 'Outro'}</td>
                    <td style={td}>{p.telefone || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}><Pencil size={15} color="#94a3b8" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paginacao.totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={() => carregar(paginacao.pagina - 1)} disabled={paginacao.pagina <= 1} style={btnPag(paginacao.pagina <= 1)}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Página {paginacao.pagina} de {paginacao.totalPaginas}</span>
          <button onClick={() => carregar(paginacao.pagina + 1)} disabled={paginacao.pagina >= paginacao.totalPaginas} style={btnPag(paginacao.pagina >= paginacao.totalPaginas)}><ChevronRight size={16} /></button>
        </div>
      )}

      {modal.aberto && <ModalPaciente pacienteId={modal.pacienteId} onFechar={fechar} onSalvo={salvo} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}.linha-pac:hover{background:#f8fafc}`}</style>
    </AppLayout>
  );
}

// ─── Modal: cria (sem id) ou edita (com id) ───
function ModalPaciente({ pacienteId, onFechar, onSalvo }: { pacienteId: string | null; onFechar: () => void; onSalvo: () => void }) {
  const editando = !!pacienteId;
  const [form, setForm] = useState({
    nome: '', cpf: '', cns: '', dataNascimento: '', sexo: 'FEMININO',
    nomeMae: '', telefone: '',
    rua: '', numero: '', bairro: '', cidade: '', uf: '', cep: '',
  });
  const [unidadeId, setUnidadeId] = useState(''); // escondido — preenchido com a 1ª unidade
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(editando);

  useEffect(() => {
    // Pega a 1ª unidade ativa do laboratório (enviada automaticamente, sem aparecer na tela)
    unidadesApi.listar().then((u) => {
      const lista = Array.isArray(u) ? u : (u?.dados ?? []);
      const ativas = lista.filter((x: any) => x.ativa ?? true);
      const escolhida = (ativas[0] || lista[0]);
      if (escolhida) setUnidadeId(escolhida.id);
    }).catch(() => {});

    if (editando) {
      pacientesApi.detalhar(pacienteId!).then((p: any) => {
        const end = p.endereco || {};
        setForm({
          nome: p.nome || '',
          cpf: p.cpf || '', // vem mascarado — campo fica travado na edição
          cns: p.cns || '',
          dataNascimento: p.dataNascimento ? new Date(p.dataNascimento).toISOString().split('T')[0] : '',
          sexo: p.sexo || 'FEMININO',
          nomeMae: p.nomeMae || '',
          telefone: p.telefone || '',
          rua: end.rua || '', numero: end.numero || '', bairro: end.bairro || '',
          cidade: end.cidade || '', uf: end.uf || '', cep: end.cep || '',
        });
        if (p.unidade?.id) setUnidadeId(p.unidade.id);
      }).catch(() => setErro('Erro ao carregar dados do paciente.'))
        .finally(() => setCarregandoDados(false));
    }
  }, [pacienteId]);

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  // Monta o objeto de endereço só com o que foi preenchido
  function montarEndereco() {
    const e: Record<string, string> = {};
    if (form.rua) e.rua = form.rua;
    if (form.numero) e.numero = form.numero;
    if (form.bairro) e.bairro = form.bairro;
    if (form.cidade) e.cidade = form.cidade;
    if (form.uf) e.uf = form.uf;
    if (form.cep) e.cep = form.cep;
    return Object.keys(e).length > 0 ? e : undefined;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.nome || !form.dataNascimento) {
      setErro('Preencha nome e data de nascimento.');
      return;
    }
    if (!unidadeId) {
      setErro('Nenhuma unidade de saúde cadastrada. Cadastre uma em Configurações antes.');
      return;
    }
    if (form.cns && !/^\d{15}$/.test(form.cns.replace(/\D/g, ''))) {
      setErro('CNS deve ter 15 dígitos.');
      return;
    }
    setSalvando(true);
    try {
      const endereco = montarEndereco();
      if (editando) {
        // Na edição não enviamos o CPF (vem mascarado e não muda)
        const dados: any = {
          nome: form.nome, dataNascimento: form.dataNascimento, sexo: form.sexo, unidadeId,
          nomeMae: form.nomeMae || undefined, telefone: form.telefone || undefined,
          cns: form.cns || undefined, endereco,
        };
        await pacientesApi.editar(pacienteId!, dados);
      } else {
        if (!form.cpf) { setErro('Preencha o CPF.'); setSalvando(false); return; }
        const dados: any = {
          nome: form.nome, cpf: form.cpf, dataNascimento: form.dataNascimento, sexo: form.sexo, unidadeId,
          nomeMae: form.nomeMae || undefined, telefone: form.telefone || undefined,
          cns: form.cns || undefined, endereco,
        };
        await pacientesApi.criar(dados);
      }
      onSalvo();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar paciente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: 18, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{editando ? 'Editar paciente' : 'Novo paciente'}</h2>
          <button onClick={onFechar} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        {carregandoDados ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : (
          <form onSubmit={salvar} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Nome completo *"><input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inp} placeholder="Maria da Silva" /></Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label={editando ? 'CPF (não editável)' : 'CPF *'}>
                <input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} disabled={editando} style={{ ...inp, ...(editando ? { background: '#f1f5f9', color: '#94a3b8' } : {}) }} placeholder="000.000.000-00" />
              </Campo>
              <Campo label="CNS (Cartão SUS)"><input value={form.cns} onChange={(e) => set('cns', e.target.value)} style={inp} placeholder="15 dígitos (opcional)" /></Campo>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Data de nascimento *"><input type="date" value={form.dataNascimento} onChange={(e) => set('dataNascimento', e.target.value)} style={inp} /></Campo>
              <Campo label="Sexo *">
                <select value={form.sexo} onChange={(e) => set('sexo', e.target.value)} style={inp}>
                  <option value="FEMININO">Feminino</option><option value="MASCULINO">Masculino</option><option value="OUTRO">Outro</option>
                </select>
              </Campo>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Nome da mãe"><input value={form.nomeMae} onChange={(e) => set('nomeMae', e.target.value)} style={inp} placeholder="Opcional" /></Campo>
              <Campo label="Telefone"><input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} style={inp} placeholder="Opcional" /></Campo>
            </div>

            {/* Endereço (todos opcionais) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Endereço (opcional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12, marginBottom: 12 }}>
                <Campo label="Rua"><input value={form.rua} onChange={(e) => set('rua', e.target.value)} style={inp} placeholder="Rua / logradouro" /></Campo>
                <Campo label="Nº"><input value={form.numero} onChange={(e) => set('numero', e.target.value)} style={inp} /></Campo>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: 12, marginBottom: 12 }}>
                <Campo label="Bairro"><input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} style={inp} /></Campo>
                <Campo label="Cidade"><input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} style={inp} /></Campo>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <Campo label="UF"><input value={form.uf} onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))} style={inp} maxLength={2} placeholder="PB" /></Campo>
                <Campo label="CEP"><input value={form.cep} onChange={(e) => set('cep', e.target.value)} style={inp} placeholder="00000-000" /></Campo>
              </div>
            </div>

            {erro && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>{erro}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onFechar} style={btnCancelar}>Cancelar</button>
              <button type="submit" disabled={salvando} style={btnSalvar}>
                {salvando ? <><Loader2 size={16} className="spin" /> Salvando...</> : (editando ? 'Salvar alterações' : 'Cadastrar paciente')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const btnNovo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer', boxShadow: '0 6px 18px rgba(13,148,136,.25)' };
const buscaBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 16 };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: '#334155' };
const avatarMini: React.CSSProperties = { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #14b8a6, #4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const btnPag = (disabled: boolean): React.CSSProperties => ({ width: 38, height: 38, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: disabled ? '#cbd5e1' : '#475569', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 11, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff' };
const btnCancelar: React.CSSProperties = { flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnSalvar: React.CSSProperties = { flex: 2, padding: 12, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
