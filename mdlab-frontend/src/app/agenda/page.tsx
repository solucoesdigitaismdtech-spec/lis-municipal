'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Loader2, CalendarDays, Search, Check, CheckCheck, FlaskConical, User,
  Trash2, AlertCircle, Lock, QrCode,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { ordensApi, pacientesApi, unidadesApi, examesApi } from '@/lib/api';

const STATUS: Record<string, { label: string; cor: string; bg: string }> = {
  AGENDADA: { label: 'Agendada', cor: '#0369a1', bg: '#e0f2fe' },
  ABERTA: { label: 'Aberta', cor: '#0369a1', bg: '#e0f2fe' },
  COLETA_REALIZADA: { label: 'Coletada', cor: '#7c3aed', bg: '#f3e8ff' },
  EM_COLETA: { label: 'Em coleta', cor: '#7c3aed', bg: '#f3e8ff' },
  EM_DIGITACAO: { label: 'Em digitação', cor: '#4f46e5', bg: '#eef2ff' },
  EM_ANALISE: { label: 'Em análise', cor: '#b45309', bg: '#fffbeb' },
  LIBERADA: { label: 'Liberada', cor: '#0f766e', bg: '#f0fdfa' },
  CONCLUIDA: { label: 'Concluída', cor: '#0f766e', bg: '#f0fdfa' },
  CANCELADA: { label: 'Cancelada', cor: '#dc2626', bg: '#fef2f2' },
};

export default function AgendaPage() {
  const hoje = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(hoje);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalOS, setModalOS] = useState(false);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [todas, setTodas] = useState<any[]>([]); // todas as ordens carregadas
  const [filtrarData, setFiltrarData] = useState(true); // filtra pela data selecionada?
  const [filtroStatus, setFiltroStatus] = useState('todos'); // todos | nao_coletados | coletados

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      // Backend tem GET /ordens (paginado). Buscamos um lote grande e filtramos no front.
      const resp = await ordensApi.listar('limite=100');
      const lista = resp?.dados ?? (Array.isArray(resp) ? resp : []);
      setTodas(lista);
    } catch {
      setTodas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Filtra por data E por status (combinados)
  useEffect(() => {
    let lista = todas;

    // 1. Filtro de data (quando ligado)
    if (filtrarData) {
      lista = lista.filter((o) => {
        const d = o.createdAt || o.dataAgendamento;
        if (!d) return false;
        return new Date(d).toISOString().split('T')[0] === data;
      });
    }

    // 2. Filtro de status
    if (filtroStatus === 'nao_coletados') {
      // OS que ainda têm coleta pendente (em aberto)
      lista = lista.filter((o) => ['AGENDADA', 'ABERTA', 'EM_COLETA'].includes(o.status));
    } else if (filtroStatus === 'coletados') {
      // OS que já passaram da coleta
      lista = lista.filter((o) => !['AGENDADA', 'ABERTA', 'CANCELADA'].includes(o.status));
    }

    setOrdens(lista);
  }, [todas, data, filtrarData, filtroStatus]);

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Agenda & Coleta</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Ordens de serviço e coleta</p>
        </div>
        <button onClick={() => setModalOS(true)} style={btnNovo}><Plus size={18} /> Nova ordem</button>
      </div>

      {/* Seletor de data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ ...dataBox, opacity: filtrarData ? 1 : 0.5 }}>
          <CalendarDays size={18} color="#0d9488" />
          <input type="date" value={data} disabled={!filtrarData} onChange={(e) => { setData(e.target.value); setFiltrarData(true); }} style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Outfit, sans-serif', color: '#0a1f1e', background: 'transparent' }} />
        </div>
        <button onClick={() => { setData(hoje); setFiltrarData(true); }} style={{ ...chip, ...(filtrarData && data === hoje ? chipAtivo : {}) }}>Hoje</button>
        <button onClick={() => setFiltrarData(false)} style={{ ...chip, ...(!filtrarData ? chipAtivo : {}) }}>Ver todas</button>
        <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />
        <button onClick={() => setFiltroStatus('todos')} style={{ ...chip, ...(filtroStatus === 'todos' ? chipAtivo : {}) }}>Todos status</button>
        <button onClick={() => setFiltroStatus('nao_coletados')} style={{ ...chip, ...(filtroStatus === 'nao_coletados' ? chipAtivoAmbar : {}) }}>Não coletados</button>
        <button onClick={() => setFiltroStatus('coletados')} style={{ ...chip, ...(filtroStatus === 'coletados' ? chipAtivo : {}) }}>Coletados</button>
        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>{ordens.length} {ordens.length === 1 ? 'ordem' : 'ordens'}</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : ordens.length === 0 ? (
          <div style={vazio}>
            <CalendarDays size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>Nenhuma ordem nesta data</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>Crie uma nova ordem de serviço</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                {['Protocolo', 'Paciente', 'Coleta', 'Exames', 'Status', 'Ação'].map((h, i) => <th key={i} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ordens.map((o) => {
                  const s = STATUS[o.status] || { label: o.status, cor: '#64748b', bg: '#f1f5f9' };
                  const coletavel = ['AGENDADA', 'ABERTA', 'EM_COLETA'].includes(o.status);
                  // Data da coleta: pega de algum item coletado, ou da própria OS
                  const dataColeta = (() => {
                    const itemComColeta = (o.itens || []).find((i: any) => i.coletadoEm);
                    const d = itemComColeta?.coletadoEm || o.coletadoEm;
                    return d ? new Date(d).toLocaleDateString('pt-BR') : null;
                  })();
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#0d9488', cursor: 'pointer' }} onClick={() => setDetalhe(o.id)}>{o.protocolo}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#0a1f1e' }}>{o.paciente?.nome || '—'}</td>
                      <td style={td}>
                        {dataColeta
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#0f766e', fontSize: 13 }}><Check size={13} /> {dataColeta}</span>
                          : <span style={{ color: '#94a3b8', fontSize: 13 }}>Não coletada</span>}
                      </td>
                      <td style={td}>{o._count?.itens ?? o.itens?.length ?? '—'}</td>
                      <td style={td}><span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: s.cor, background: s.bg, whiteSpace: 'nowrap' }}>{s.label}</span></td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {coletavel ? (
                            <BotaoColeta ordemId={o.id} onColetado={() => carregar()} />
                          ) : (
                            <button onClick={() => setDetalhe(o.id)} style={btnVer}>Ver</button>
                          )}
                          <button onClick={() => ordensApi.comprovante(o.id)} title="Comprovante com QR" style={btnComprovante}>
                            <QrCode size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOS && <ModalNovaOS onFechar={() => setModalOS(false)} onSalvo={() => { setModalOS(false); carregar(); }} />}
      {detalhe && <ModalDetalhe ordemId={detalhe} onFechar={() => setDetalhe(null)} onMudou={() => carregar()} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );
}

// ─── Botão de coletar tudo ───
function BotaoColeta({ ordemId, onColetado }: { ordemId: string; onColetado: () => void }) {
  const [carregando, setCarregando] = useState(false);
  async function coletar() {
    setCarregando(true);
    try { await ordensApi.coletarTudo(ordemId); onColetado(); }
    catch { setCarregando(false); }
  }
  return (
    <button onClick={coletar} disabled={carregando} style={btnColeta}>
      {carregando ? <Loader2 size={14} className="spin" /> : <CheckCheck size={14} />} Coletar
    </button>
  );
}

// ─── Modal nova OS ───
function ModalNovaOS({ onFechar, onSalvo }: { onFechar: () => void; onSalvo: () => void }) {
  const [etapa, setEtapa] = useState(1);
  const [pacBusca, setPacBusca] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacSel, setPacSel] = useState<any>(null);
  const [exames, setExames] = useState<any[]>([]);
  const [exSel, setExSel] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('');
  const [medico, setMedico] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    examesApi.listar().then((e) => setExames(Array.isArray(e) ? e : e?.dados ?? [])).catch(() => {});
    unidadesApi.listar().then((u) => {
      const l = Array.isArray(u) ? u : u?.dados ?? [];
      setUnidades(l); if (l[0]) setUnidadeId(l[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      pacientesApi.listar(pacBusca, 1, 8).then((r) => setPacientes(r?.dados ?? [])).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [pacBusca]);

  const toggleExame = (id: string) => setExSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  async function salvar() {
    setErro('');
    if (!pacSel) { setErro('Selecione um paciente.'); return; }
    if (exSel.length === 0) { setErro('Selecione ao menos um exame.'); return; }
    if (!unidadeId) { setErro('Selecione a unidade.'); return; }
    setSalvando(true);
    try {
      const nova = await ordensApi.criar({ pacienteId: pacSel.id, unidadeId, exameIds: exSel, medicoSolicitante: medico || undefined });
      // Abre o comprovante com QR automaticamente após criar
      const novaId = nova?.id || nova?.dados?.id;
      if (novaId) {
        try { await ordensApi.comprovante(novaId); } catch {}
      }
      onSalvo();
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar ordem.');
      setSalvando(false);
    }
  }

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={{ ...modal, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: 18, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Nova ordem de serviço</h2>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Passo 1: paciente */}
          <div>
            <label style={lbl}>1. Paciente *</label>
            {pacSel ? (
              <div style={pacienteSel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={avatarMini}>{pacSel.nome[0]}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{pacSel.nome}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{pacSel.cpf}</div></div>
                </div>
                <button onClick={() => setPacSel(null)} style={btnX}><X size={16} /></button>
              </div>
            ) : (
              <>
                <div style={buscaMini}><Search size={16} color="#94a3b8" /><input value={pacBusca} onChange={(e) => setPacBusca(e.target.value)} placeholder="Buscar paciente por nome..." style={inpBusca} /></div>
                {pacientes.length > 0 && (
                  <div style={listaSugestao}>
                    {pacientes.map((p) => (
                      <button key={p.id} onClick={() => { setPacSel(p); setPacientes([]); }} style={itemSugestao}>
                        <div style={avatarMini}>{p.nome[0]}</div>
                        <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 600, fontSize: 13 }}>{p.nome}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{p.cpf}</div></div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Passo 2: exames */}
          <div>
            <label style={lbl}>2. Exames * <span style={{ color: '#94a3b8', fontWeight: 400 }}>({exSel.length} selecionados)</span></label>
            <div style={listaExames}>
              {exames.length === 0 ? (
                <div style={{ padding: 14, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Nenhum exame no catálogo. Cadastre exames primeiro.</div>
              ) : exames.map((ex) => {
                const sel = exSel.includes(ex.id);
                return (
                  <button key={ex.id} onClick={() => toggleExame(ex.id)} style={{ ...itemExame, ...(sel ? itemExameSel : {}) }}>
                    <div style={{ ...checkBox, ...(sel ? checkBoxSel : {}) }}>{sel && <Check size={12} color="#fff" />}</div>
                    <FlaskConical size={15} color={sel ? '#0d9488' : '#94a3b8'} />
                    <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400 }}>{ex.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passo 3: unidade + médico */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>3. Unidade *</label>
              <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} style={inp}>
                <option value="">Selecione...</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Médico solicitante</label>
              <input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Opcional" style={inp} />
            </div>
          </div>

          {erro && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>{erro}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onFechar} style={btnCancelar}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} style={btnSalvar}>
              {salvando ? <><Loader2 size={16} className="spin" /> Criando...</> : 'Criar ordem'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal detalhe da OS ───
function ModalDetalhe({ ordemId, onFechar, onMudou }: { ordemId: string; onFechar: () => void; onMudou: () => void }) {
  const [ordem, setOrdem] = useState<any>(null);
  const [acao, setAcao] = useState<string | null>(null); // id do item em processamento
  const [erro, setErro] = useState('');
  const [addAberto, setAddAberto] = useState(false);
  const [exames, setExames] = useState<any[]>([]);
  const [exBusca, setExBusca] = useState('');

  const carregar = useCallback(() => {
    ordensApi.detalhar(ordemId).then(setOrdem).catch(() => {});
  }, [ordemId]);
  useEffect(() => { carregar(); }, [carregar]);

  // Carrega o catálogo de exames só quando abrir o "adicionar"
  useEffect(() => {
    if (addAberto && exames.length === 0) {
      examesApi.listar().then((e) => setExames(Array.isArray(e) ? e : e?.dados ?? [])).catch(() => {});
    }
  }, [addAberto]);

  const itemColetado = (item: any) => !['AGUARDANDO_COLETA'].includes(item.status);

  async function coletarItem(itemId: string) {
    setErro(''); setAcao(itemId);
    try { await ordensApi.coletarItem(ordemId, itemId); carregar(); onMudou(); }
    catch (e: any) { setErro(e.message || 'Erro ao coletar exame.'); }
    finally { setAcao(null); }
  }

  async function removerItem(itemId: string) {
    setErro(''); setAcao(itemId);
    try { await ordensApi.removerItem(ordemId, itemId); carregar(); onMudou(); }
    catch (e: any) { setErro(e.message || 'Erro ao remover exame.'); }
    finally { setAcao(null); }
  }

  async function adicionarExame(exameId: string) {
    setErro(''); setAcao('add-' + exameId);
    try { await ordensApi.adicionarItem(ordemId, exameId); carregar(); onMudou(); setAddAberto(false); setExBusca(''); }
    catch (e: any) { setErro(e.message || 'Erro ao adicionar exame.'); }
    finally { setAcao(null); }
  }

  if (!ordem) return (
    <div style={overlay} onClick={onFechar}><div style={modal} onClick={(e) => e.stopPropagation()}><div style={{ padding: 60, textAlign: 'center' }}><Loader2 size={26} className="spin" color="#0d9488" /></div></div></div>
  );

  const s = STATUS[ordem.status] || { label: ordem.status, cor: '#64748b', bg: '#f1f5f9' };
  const itens = ordem.itens || [];
  const coletados = itens.filter(itemColetado).length;
  // Só dá pra editar exames enquanto a OS não começou a coleta (ABERTA)
  const editavel = ['ABERTA', 'AGENDADA'].includes(ordem.status);
  // IDs de exames já na OS (pra não oferecer duplicado)
  const idsNaOS = new Set(itens.map((i: any) => i.exameId || i.exame?.id));
  const examesDisponiveis = exames
    .filter((e) => !idsNaOS.has(e.id))
    .filter((e) => !exBusca || e.nome?.toLowerCase().includes(exBusca.toLowerCase()));

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{ordem.protocolo}</h2>
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, color: s.cor, background: s.bg }}>{s.label}</span>
          </div>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Paciente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 12 }}>
            <User size={18} color="#0d9488" />
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{ordem.paciente?.nome}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{ordem.unidade?.nome}</div></div>
          </div>

          {/* Progresso da coleta */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Coleta: {coletados} de {itens.length}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{itens.length ? Math.round((coletados / itens.length) * 100) : 0}%</span>
            </div>
            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${itens.length ? (coletados / itens.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #14b8a6, #0d9488)', borderRadius: 20, transition: 'width .3s' }} />
            </div>
          </div>

          {erro && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}><AlertCircle size={15} /> {erro}</div>}

          {/* Lista de exames */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Exames</span>
            {editavel && !addAberto && (
              <button onClick={() => setAddAberto(true)} style={btnAddMini}><Plus size={14} /> Adicionar exame</button>
            )}
          </div>

          {/* Painel de adicionar exame */}
          {addAberto && (
            <div style={{ border: '1.5px solid #99f6e4', background: '#f0fdfa', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Search size={15} color="#0d9488" />
                <input autoFocus value={exBusca} onChange={(e) => setExBusca(e.target.value)} placeholder="Buscar exame..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontFamily: 'Outfit, sans-serif' }} />
                <button onClick={() => { setAddAberto(false); setExBusca(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={15} color="#94a3b8" /></button>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {examesDisponiveis.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#94a3b8', padding: 8, textAlign: 'center' }}>Nenhum exame disponível</div>
                ) : examesDisponiveis.map((ex) => (
                  <button key={ex.id} onClick={() => adicionarExame(ex.id)} disabled={acao === 'add-' + ex.id} style={itemAddExame}>
                    <FlaskConical size={14} color="#0d9488" />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>{ex.nome}</span>
                    {acao === 'add-' + ex.id ? <Loader2 size={13} className="spin" /> : <Plus size={14} color="#0d9488" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Itens da OS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itens.map((item: any) => {
              const coletado = itemColetado(item);
              const processando = acao === item.id;
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid #f1f5f9', borderRadius: 12, background: coletado ? '#f0fdfa' : '#fff' }}>
                  <FlaskConical size={16} color={coletado ? '#0f766e' : '#94a3b8'} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: coletado ? 600 : 400, color: coletado ? '#0f766e' : '#334155' }}>{item.exame?.nome || 'Exame'}</span>

                  {coletado ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0f766e' }}><Check size={14} /> Coletado</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => coletarItem(item.id)} disabled={processando} style={btnColeta}>
                        {processando ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Coletar
                      </button>
                      {editavel && (
                        <button onClick={() => removerItem(item.id)} disabled={processando} title="Remover exame" style={btnRemover}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aviso quando não dá mais pra editar */}
          {!editavel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: 12.5, color: '#64748b' }}>
              <Lock size={14} /> A coleta já foi iniciada — os exames não podem mais ser alterados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const btnNovo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 18px', fontSize: 14, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer', boxShadow: '0 6px 18px rgba(13,148,136,.25)' };
const dataBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' };
const chip: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const chipAtivo: React.CSSProperties = { background: '#f0fdfa', borderColor: '#2dd4bf', color: '#0d9488' };
const chipAtivoAmbar: React.CSSProperties = { background: '#fffbeb', borderColor: '#fcd34d', color: '#b45309' };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 };
const td: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: '#334155' };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const btnColeta: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#0d9488', color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnRemover: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9, padding: '7px 9px', cursor: 'pointer' };
const btnAddMini: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: 9, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const itemAddExame: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: '#fff', border: '1px solid #ccfbf1', borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnVer: React.CSSProperties = { background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnComprovante: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#0d9488', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#99f6e4', borderRadius: 9, width: 32, height: 32, cursor: 'pointer' };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const btnX: React.CSSProperties = { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 };
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 11, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff' };
const buscaMini: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e2e8f0', borderRadius: 11, padding: '10px 14px' };
const inpBusca: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Outfit, sans-serif' };
const listaSugestao: React.CSSProperties = { marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' };
const itemSugestao: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 10, width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer' };
const pacienteSel: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12 };
const avatarMini: React.CSSProperties = { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #14b8a6, #4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 };
const listaExames: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 11, padding: 8 };
const itemExame: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 9, border: '1px solid transparent', background: '#f8fafc', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'Outfit, sans-serif' };
const itemExameSel: React.CSSProperties = { background: '#f0fdfa', borderColor: '#99f6e4' };
const checkBox: React.CSSProperties = { width: 18, height: 18, borderRadius: 5, border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const checkBoxSel: React.CSSProperties = { background: '#0d9488', borderColor: '#0d9488' };
const btnCancelar: React.CSSProperties = { flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnSalvar: React.CSSProperties = { flex: 2, padding: 12, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
