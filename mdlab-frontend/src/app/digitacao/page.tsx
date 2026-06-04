'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileEdit, Loader2, ClipboardList, User, Clock, ChevronRight, X, Save,
  FlaskConical, Check, AlertCircle, AlertTriangle, ClipboardPen, Printer,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { resultadosApi } from '@/lib/api';

const PRIO: Record<string, { label: string; cor: string; bg: string }> = {
  NORMAL: { label: 'Normal', cor: '#64748b', bg: '#f1f5f9' },
  URGENTE: { label: 'Urgente', cor: '#b45309', bg: '#fffbeb' },
  CRITICO: { label: 'Crítico', cor: '#dc2626', bg: '#fef2f2' },
};

/**
 * Normaliza a fila vinda do backend para uma lista de OS únicas.
 * Funciona tanto se o backend já agrupa por ordem quanto se devolve
 * uma linha por exame (caso em que agrupamos aqui, evitando keys duplicadas).
 */
function agruparPorOrdem(bruto: any[]): any[] {
  if (!Array.isArray(bruto) || bruto.length === 0) return [];

  // Caso o backend já mande agrupado (tem 'exames' ou 'ordemId' único), dedup por ordemId
  const mapa = new Map<string, any>();

  for (const linha of bruto) {
    // Descobre o id da ordem em qualquer formato possível
    const oid = linha.ordemId || linha.ordem?.id || linha.ordemServicoId || linha.id;
    if (!oid) continue;

    if (!mapa.has(oid)) {
      mapa.set(oid, {
        ordemId: oid,
        protocolo: linha.protocolo || linha.ordem?.protocolo || '—',
        prioridade: linha.prioridade || linha.ordem?.prioridade || 'NORMAL',
        paciente: linha.paciente?.nome || linha.paciente || linha.ordem?.paciente?.nome || '—',
        unidade: linha.unidade?.nome || linha.unidade || linha.ordem?.unidade?.nome || '—',
        exames: [],
        totalExames: 0,
      });
    }

    const grupo = mapa.get(oid);

    // Se a linha já traz a lista de exames (backend agrupado), usa ela
    if (Array.isArray(linha.exames)) {
      grupo.exames = linha.exames;
      grupo.totalExames = linha.totalExames ?? linha.exames.length;
    } else {
      // Senão, cada linha é um exame: acumula
      grupo.exames.push({
        itemId: linha.itemId || linha.id,
        status: linha.status,
        exame: linha.exame,
        resultadoStatus: linha.resultado?.status ?? linha.resultadoStatus ?? null,
      });
      grupo.totalExames = grupo.exames.length;
    }
  }

  return Array.from(mapa.values());
}

export default function DigitacaoPage() {
  const [fila, setFila] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordemSel, setOrdemSel] = useState<string | null>(null);
  const [mapaOrdens, setMapaOrdens] = useState<any[] | null>(null); // OS detalhadas p/ o mapa
  const [gerandoMapa, setGerandoMapa] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await resultadosApi.pendentes();
      const bruto = Array.isArray(resp) ? resp : resp?.dados ?? [];
      setFila(agruparPorOrdem(bruto));
    } catch {
      setFila([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Busca o detalhe completo (exames + valores de referência) de uma ou mais OS
  // e abre a view do mapa de trabalho.
  async function gerarMapa(ordemIds: string[]) {
    if (ordemIds.length === 0) return;
    setGerandoMapa(true);
    try {
      const detalhes = await Promise.all(
        ordemIds.map((id) => resultadosApi.detalheOrdem(id).then((r: any) => r?.ordem ?? r?.dados ?? r).catch(() => null)),
      );
      const validas = detalhes.filter(Boolean);
      if (validas.length > 0) setMapaOrdens(validas);
    } finally {
      setGerandoMapa(false);
    }
  }

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Digitação de Resultados</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Exames coletados aguardando lançamento</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fila.length > 0 && (
            <button onClick={() => gerarMapa(fila.map((o) => o.ordemId))} disabled={gerandoMapa} style={btnMapaDia}>
              {gerandoMapa ? <Loader2 size={16} className="spin" /> : <Printer size={16} />} Imprimir mapa do dia
            </button>
          )}
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{fila.length} {fila.length === 1 ? 'ordem na fila' : 'ordens na fila'}</span>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : fila.length === 0 ? (
          <div style={vazio}>
            <ClipboardList size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>Fila vazia</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>Nenhum exame coletado aguardando digitação</span>
          </div>
        ) : (
          <div>
            {fila.map((os, idx) => {
              const p = PRIO[os.prioridade] || PRIO.NORMAL;
              const pendentes = os.exames?.filter((e: any) => e.status !== 'RESULTADO_DIGITADO').length ?? os.totalExames;
              return (
                <div key={os.ordemId || idx} onClick={() => setOrdemSel(os.ordemId)} style={linhaFila} className="linha-fila">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#0d9488', fontWeight: 600 }}>{os.protocolo}</span>
                      {os.prioridade !== 'NORMAL' && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: p.cor, background: p.bg }}>{p.label}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#334155' }}><User size={13} /> {os.paciente}</span>
                      <span>{os.unidade}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#b45309', background: '#fffbeb', padding: '5px 11px', borderRadius: 20 }}>{pendentes} a digitar</span>
                    <button onClick={(e) => { e.stopPropagation(); gerarMapa([os.ordemId]); }} title="Imprimir mapa de trabalho" style={btnMapaOS}>
                      <ClipboardPen size={15} /> Mapa
                    </button>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ordemSel && <PainelDigitacao ordemId={ordemSel} onFechar={() => setOrdemSel(null)} onSalvouTudo={() => { setOrdemSel(null); carregar(); }} />}
      {mapaOrdens && <MapaTrabalho ordens={mapaOrdens} onFechar={() => setMapaOrdens(null)} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}.linha-fila:hover{background:#f8fafc}`}</style>
    </AppLayout>
  );
}

// ─── Painel lateral de digitação de uma OS ───
function PainelDigitacao({ ordemId, onFechar, onSalvouTudo }: { ordemId: string; onFechar: () => void; onSalvouTudo: () => void }) {
  const [ordem, setOrdem] = useState<any>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    setErro('');
    resultadosApi.detalheOrdem(ordemId)
      .then((resp: any) => {
        // O backend pode devolver a OS direto ou dentro de { ordem } / { dados }
        const o = resp?.ordem ?? resp?.dados ?? resp;
        setOrdem(o || {});
      })
      .catch((e: any) => setErro(e?.message || 'Erro ao carregar a ordem. Verifique se a rota /resultados/ordem existe no backend.'));
  }, [ordemId]);
  useEffect(() => { carregar(); }, [carregar]);

  // Estado de erro — mostra o que houve em vez de carregar pra sempre
  if (erro) return (
    <div style={overlay} onClick={onFechar}>
      <div style={painel} onClick={(e) => e.stopPropagation()}>
        <div style={painelHeader}>
          <h2 style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Digitação</h2>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>
        <div style={{ padding: 30 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '14px 16px', borderRadius: 12, fontSize: 13.5 }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{erro}</div>
          </div>
          <button onClick={carregar} style={{ ...btnConcluir, marginTop: 16, background: '#0d9488' }}>Tentar novamente</button>
        </div>
      </div>
    </div>
  );

  if (!ordem) return (
    <div style={overlay} onClick={onFechar}><div style={painel} onClick={(e) => e.stopPropagation()}><div style={{ padding: 60, textAlign: 'center' }}><Loader2 size={26} className="spin" color="#0d9488" /></div></div></div>
  );

  // Itens da OS — tolera o backend devolver em itens / exames / resultados
  const listaItens = ordem.itens ?? ordem.exames ?? ordem.resultados ?? [];
  // Só mostra os itens que dá pra digitar (coletados, não validados).
  // Se nenhum status casar, mostra todos (fallback) — evita lista vazia por status divergente.
  const filtrados = listaItens.filter((i: any) => ['COLETADO', 'EM_ANALISE', 'RESULTADO_DIGITADO'].includes(i.status));
  const digitaveis = filtrados.length > 0 ? filtrados : listaItens;

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={painel} onClick={(e) => e.stopPropagation()}>
        <div style={painelHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{ordem.protocolo}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginTop: 4 }}>
              <User size={14} /> {ordem.paciente?.nome}
              <span style={{ color: '#cbd5e1' }}>•</span>
              {ordem.paciente?.sexo === 'FEMININO' ? 'Feminino' : ordem.paciente?.sexo === 'MASCULINO' ? 'Masculino' : 'Outro'}
            </div>
          </div>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {digitaveis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Nenhum exame para digitar nesta OS.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {digitaveis.map((item: any) => (
                <CardExame key={item.id} item={item} paciente={ordem.paciente} onSalvo={() => {}} />
              ))}
            </div>
          )}
        </div>

        <div style={painelFooter}>
          <button onClick={onSalvouTudo} style={btnConcluir}><Check size={17} /> Concluir e voltar à fila</button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de um exame para digitar ───
function CardExame({ item, paciente, onSalvo }: { item: any; paciente: any; onSalvo: () => void }) {
  const valoresRef = item.exame?.valoresRef || [];
  const jaDigitado = item.status === 'RESULTADO_DIGITADO';

  // Monta o estado inicial dos campos com base nos valores de referência.
  // Extrai o .valor caso o salvo venha como objeto { valor, unidade, ... }.
  const extrair = (v: any) => (v && typeof v === 'object' && 'valor' in v ? String(v.valor ?? '') : (v ?? ''));
  const camposIniciais = () => {
    const init: Record<string, string> = {};
    const salvos = item.resultado?.valores || {};
    if (valoresRef.length > 0) {
      valoresRef.forEach((v: any) => { init[v.campo] = extrair(salvos[v.campo]); });
    } else {
      // Sem valores de referência: um único campo "Resultado"
      init['Resultado'] = extrair(salvos['Resultado']);
    }
    return init;
  };

  const [valores, setValores] = useState<Record<string, string>>(camposIniciais);
  const [observacao, setObservacao] = useState(item.resultado?.observacao || '');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(jaDigitado);
  const [erro, setErro] = useState('');

  const setCampo = (campo: string, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setSalvo(false);
  };

  // Verifica se um valor está fora da faixa de referência
  const foraDaFaixa = (ref: any, valorStr: string) => {
    const n = parseFloat(valorStr?.replace(',', '.'));
    if (isNaN(n)) return false;
    if (ref.minimo != null && n < ref.minimo) return true;
    if (ref.maximo != null && n > ref.maximo) return true;
    return false;
  };

  async function salvar() {
    setErro('');
    const algumPreenchido = Object.values(valores).some((v) => String(v).trim() !== '');
    if (!algumPreenchido) { setErro('Preencha ao menos um valor.'); return; }
    setSalvando(true);
    try {
      // O backend analisa os valores e marca crítico/fora de faixa sozinho.
      // Enviamos os valores como texto simples { campo: "valor" } + observação.
      await resultadosApi.digitar(item.id, { valores, observacao: observacao || undefined });
      setSalvo(true);
      onSalvo();
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ border: `1.5px solid ${salvo ? '#99f6e4' : '#e2e8f0'}`, borderRadius: 14, overflow: 'hidden', background: salvo ? '#f0fdfa' : '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: salvo ? 'transparent' : '#f8fafc' }}>
        <FlaskConical size={16} color="#0d9488" />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#0a1f1e' }}>{item.exame?.nome}</span>
        {salvo && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0f766e' }}><Check size={14} /> Digitado</span>}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.keys(valores).map((campo) => {
          const ref = valoresRef.find((v: any) => v.campo === campo);
          const fora = ref && foraDaFaixa(ref, valores[campo]);
          return (
            <div key={campo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{campo}</label>
                {ref && (
                  <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                    Ref: {ref.textoRef ? ref.textoRef : `${ref.minimo ?? '—'}–${ref.maximo ?? '—'}`} {ref.unidade}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  value={valores[campo]}
                  onChange={(e) => setCampo(campo, e.target.value)}
                  placeholder={ref?.unidade ? `Valor em ${ref.unidade}` : 'Resultado'}
                  style={{ ...inp, ...(fora ? { borderColor: '#fca5a5', background: '#fef2f2', paddingRight: 38 } : {}) }}
                />
                {fora && <AlertTriangle size={16} color="#dc2626" style={{ position: 'absolute', right: 12, top: 13 }} />}
              </div>
              {fora && <span style={{ fontSize: 11.5, color: '#dc2626', marginTop: 3, display: 'block' }}>⚠ Fora da faixa de referência{ref.critico ? ' (crítico)' : ''}</span>}
            </div>
          );
        })}

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 5 }}>Observação</label>
          <textarea value={observacao} onChange={(e) => { setObservacao(e.target.value); setSalvo(false); }} placeholder="Opcional" style={{ ...inp, minHeight: 48, resize: 'vertical' }} />
        </div>

        {erro && <div style={erroBox}><AlertCircle size={14} /> {erro}</div>}

        <button onClick={salvar} disabled={salvando} style={{ ...btnSalvarExame, ...(salvo ? { background: '#f0fdfa', color: '#0d9488', border: '1.5px solid #99f6e4' } : {}) }}>
          {salvando ? <><Loader2 size={15} className="spin" /> Salvando...</> : salvo ? <><Check size={15} /> Salvo — clique para atualizar</> : <><Save size={15} /> Salvar resultado</>}
        </button>
      </div>
    </div>
  );
}

// ─── Mapa de Trabalho imprimível ───
function MapaTrabalho({ ordens, onFechar }: { ordens: any[]; onFechar: () => void }) {
  const dataBR = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const idade = (d: string) => d ? Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000)) : '';
  const hojeStr = new Date().toLocaleDateString('pt-BR');

  function imprimir() { window.print(); }

  return (
    <div style={overlayMapa} onClick={onFechar}>
      {/* Barra de ações (não imprime) */}
      <div style={barraMapa} className="nao-imprime" onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} style={btnBarraSecMapa}><X size={16} /> Fechar</button>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
          Mapa de Trabalho — {ordens.length === 1 ? '1 paciente' : `${ordens.length} pacientes`}
        </span>
        <button onClick={imprimir} style={btnBarraMapa}><Printer size={16} /> Imprimir</button>
      </div>

      {/* Folhas — uma por OS/paciente */}
      <div style={folhaWrapMapa} onClick={(e) => e.stopPropagation()}>
        <div id="mapa-print">
          {ordens.map((ordem, i) => {
            const itens = ordem.itens || [];
            const pac = ordem.paciente || {};
            return (
              <div key={ordem.id || i} style={{ ...folhaMapa, pageBreakAfter: i < ordens.length - 1 ? 'always' : 'auto' }} className="folha-mapa">
                {/* Cabeçalho */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0a1f1e', paddingBottom: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Mapa de Trabalho</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Documento interno — anotação de resultados</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#0a1f1e', fontWeight: 700 }}>{ordem.protocolo}</div>
                    <div>Emissão: {hojeStr}</div>
                  </div>
                </div>

                {/* Dados do paciente */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12.5 }}>
                  <div><strong>Paciente:</strong> {pac.nome}</div>
                  <div><strong>Idade:</strong> {idade(pac.dataNascimento)} anos</div>
                  <div><strong>Sexo:</strong> {pac.sexo === 'FEMININO' ? 'F' : pac.sexo === 'MASCULINO' ? 'M' : '-'}</div>
                </div>

                {/* Exames com espaço para anotar + valores de referência */}
                {itens.map((item: any) => {
                  const valoresRef = item.exame?.valoresRef || [];
                  return (
                    <div key={item.id} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
                      <div style={{ background: '#0a1f1e', color: '#fff', padding: '6px 12px', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: 700 }}>
                        {item.exame?.nome}{item.exame?.material ? ` · ${item.exame.material}` : ''}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', borderTop: 'none' }}>
                        <thead><tr style={{ background: '#f1f5f9' }}>
                          <th style={thMapa}>Parâmetro</th>
                          <th style={{ ...thMapa, width: '30%' }}>Resultado (anotar)</th>
                          <th style={thMapa}>Valores de referência</th>
                        </tr></thead>
                        <tbody>
                          {valoresRef.length === 0 ? (
                            <tr>
                              <td style={tdMapa}>{item.exame?.nome}</td>
                              <td style={{ ...tdMapa, height: 32 }}></td>
                              <td style={tdMapa}>—</td>
                            </tr>
                          ) : valoresRef.map((ref: any) => (
                            <tr key={ref.id}>
                              <td style={tdMapa}>{ref.campo}</td>
                              <td style={{ ...tdMapa, height: 32, background: '#fffef5' }}></td>
                              <td style={{ ...tdMapa, color: '#64748b' }}>
                                {ref.textoRef ? ref.textoRef : `${ref.minimo ?? '—'} a ${ref.maximo ?? '—'}`} {ref.unidade || ''}
                                {ref.sexo ? ` (${ref.sexo === 'FEMININO' ? 'F' : 'M'})` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* Rodapé para assinatura do responsável */}
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4, width: '45%', textAlign: 'center' }}>Responsável pela análise</div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 4, width: '30%', textAlign: 'center' }}>Data / Hora</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media print {
          .nao-imprime { display: none !important; }
          body * { visibility: hidden; }
          #mapa-print, #mapa-print * { visibility: visible; }
          #mapa-print { position: absolute; left: 0; top: 0; width: 100%; }
          .folha-mapa { box-shadow: none !important; margin: 0 !important; padding: 12mm !important; }
        }
      `}</style>
    </div>
  );
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const btnMapaDia: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#0a1f1e', color: '#fff', border: 'none', borderRadius: 11, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, fontFamily: 'Sora, sans-serif', cursor: 'pointer' };
const btnMapaOS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0d9488', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#99f6e4', borderRadius: 9, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, fontFamily: 'Outfit, sans-serif', cursor: 'pointer' };
const overlayMapa: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 300, overflowY: 'auto', padding: '0 0 40px' };
const barraMapa: React.CSSProperties = { position: 'sticky', top: 0, width: '100%', maxWidth: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', zIndex: 10 };
const btnBarraMapa: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
const btnBarraSecMapa: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const folhaWrapMapa: React.CSSProperties = { width: '100%', maxWidth: 800, padding: '0 16px' };
const folhaMapa: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,.2)', fontFamily: 'Outfit, sans-serif', marginBottom: 16 };
const thMapa: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #cbd5e1' };
const tdMapa: React.CSSProperties = { padding: '6px 10px', fontSize: 12, color: '#0a1f1e', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const linhaFila: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderTop: '1px solid #f1f5f9', cursor: 'pointer' };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 200 };
const painel: React.CSSProperties = { background: '#fff', width: '100%', maxWidth: 560, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,.1)' };
const painelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const painelFooter: React.CSSProperties = { padding: 16, borderTop: '1px solid #f1f5f9', background: '#f8fafc' };
const btnX: React.CSSProperties = { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderWidth: 1.5, borderStyle: 'solid', borderColor: '#e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff', boxSizing: 'border-box' };
const erroBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 13px', borderRadius: 10, fontSize: 12.5 };
const btnSalvarExame: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
const btnConcluir: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#0a1f1e', color: '#fff', border: 'none', borderRadius: 11, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
