'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Loader2, User, X, Check, FlaskConical, AlertCircle,
  ChevronRight, ClipboardCheck, AlertTriangle,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { resultadosApi } from '@/lib/api';

/**
 * Normaliza a fila para OS únicas (defensivo contra backend não-agrupado).
 */
function agruparPorOrdem(bruto: any[]): any[] {
  if (!Array.isArray(bruto) || bruto.length === 0) return [];
  const mapa = new Map<string, any>();
  for (const linha of bruto) {
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
    if (Array.isArray(linha.exames)) {
      grupo.exames = linha.exames;
      grupo.totalExames = linha.totalExames ?? linha.exames.length;
    } else {
      grupo.exames.push({ itemId: linha.itemId || linha.id, status: linha.status, exame: linha.exame });
      grupo.totalExames = grupo.exames.length;
    }
  }
  return Array.from(mapa.values());
}

export default function ValidacaoPage() {
  const [fila, setFila] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordemSel, setOrdemSel] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await resultadosApi.aguardandoValidacao();
      const bruto = Array.isArray(resp) ? resp : resp?.dados ?? [];
      setFila(agruparPorOrdem(bruto));
    } catch {
      setFila([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <AppLayout>
      <div style={cab}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>Validação de Resultados</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Resultados digitados aguardando assinatura</p>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{fila.length} {fila.length === 1 ? 'ordem na fila' : 'ordens na fila'}</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <div style={vazio}><Loader2 size={26} className="spin" color="#0d9488" /></div>
        ) : fila.length === 0 ? (
          <div style={vazio}>
            <ClipboardCheck size={36} color="#cbd5e1" />
            <span style={{ marginTop: 12, fontWeight: 600, color: '#334155' }}>Fila vazia</span>
            <span style={{ fontSize: 13, marginTop: 4 }}>Nenhum resultado aguardando validação</span>
          </div>
        ) : (
          <div>
            {fila.map((os, idx) => (
              <div key={os.ordemId || idx} onClick={() => setOrdemSel(os.ordemId)} style={linhaFila} className="linha-fila">
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0d9488', fontWeight: 600, marginBottom: 4 }}>{os.protocolo}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#334155' }}><User size={13} /> {os.paciente}</span>
                    <span>{os.unidade}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '5px 11px', borderRadius: 20 }}>{os.totalExames} a validar</span>
                  <ChevronRight size={18} color="#cbd5e1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ordemSel && <PainelValidacao ordemId={ordemSel} onFechar={() => setOrdemSel(null)} onConcluiu={() => { setOrdemSel(null); carregar(); }} />}

      <style>{`.spin{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}.linha-fila:hover{background:#f8fafc}`}</style>
    </AppLayout>
  );
}

function PainelValidacao({ ordemId, onFechar, onConcluiu }: { ordemId: string; onFechar: () => void; onConcluiu: () => void }) {
  const [ordem, setOrdem] = useState<any>(null);

  const carregar = useCallback(() => {
    resultadosApi.detalheOrdem(ordemId).then(setOrdem).catch(() => {});
  }, [ordemId]);
  useEffect(() => { carregar(); }, [carregar]);

  if (!ordem) return (
    <div style={overlay} onClick={onFechar}><div style={painel} onClick={(e) => e.stopPropagation()}><div style={{ padding: 60, textAlign: 'center' }}><Loader2 size={26} className="spin" color="#0d9488" /></div></div></div>
  );

  const validaveis = (ordem.itens || []).filter((i: any) => i.status === 'RESULTADO_DIGITADO');
  const restantes = validaveis.length;

  return (
    <div style={overlay} onClick={onFechar}>
      <div style={painel} onClick={(e) => e.stopPropagation()}>
        <div style={painelHeader}>
          <div>
            <h2 style={{ fontSize: 16, fontFamily: 'Sora, sans-serif', color: '#0a1f1e' }}>{ordem.protocolo}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginTop: 4 }}>
              <User size={14} /> {ordem.paciente?.nome}
            </div>
          </div>
          <button onClick={onFechar} style={btnX}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {restantes === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#0f766e' }}>
              <Check size={40} /><div style={{ marginTop: 8, fontWeight: 600 }}>Todos validados!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {validaveis.map((item: any) => (
                <CardValidacao key={item.id} item={item} onMudou={() => { carregar(); }} />
              ))}
            </div>
          )}
        </div>

        <div style={painelFooter}>
          <button onClick={onConcluiu} style={btnVoltar}>Voltar à fila</button>
        </div>
      </div>
    </div>
  );
}

function CardValidacao({ item, onMudou }: { item: any; onMudou: () => void }) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const valoresRef = item.exame?.valoresRef || [];
  const valores = item.resultado?.valores || {};

  const foraDaFaixa = (ref: any, valorStr: string) => {
    const n = parseFloat(String(valorStr)?.replace(',', '.'));
    if (isNaN(n)) return false;
    if (ref.minimo != null && n < ref.minimo) return true;
    if (ref.maximo != null && n > ref.maximo) return true;
    return false;
  };

  // Valores podem vir como texto simples ou objeto { valor, unidade, ... }
  const obterValor = (valor: any) =>
    valor && typeof valor === 'object' && 'valor' in valor ? valor.valor : valor;
  const obterUnidade = (valor: any, ref: any) =>
    valor && typeof valor === 'object' && valor.unidade ? valor.unidade : (ref?.unidade || '');

  // Fluxo do backend: validar (DIGITADO→VALIDADO) e depois assinar (VALIDADO→ASSINADO/LIBERADO).
  // Fazemos os dois em sequência: o biomédico confere e libera de uma vez.
  async function validarEAssinar() {
    setErro(''); setProcessando(true);
    try {
      await resultadosApi.validar(item.id);
      await resultadosApi.assinar(item.id);
      onMudou();
    } catch (e: any) {
      setErro(e.message || 'Erro ao validar/assinar.');
      setProcessando(false);
    }
  }

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <FlaskConical size={16} color="#0d9488" />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#0a1f1e' }}>{item.exame?.nome}</span>
        {item.resultado?.critico && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 9px', borderRadius: 20 }}><AlertTriangle size={12} /> CRÍTICO</span>}
      </div>

      <div style={{ padding: 16 }}>
        {/* Tabela de valores digitados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {Object.keys(valores).length === 0 ? (
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Sem valores registrados.</span>
          ) : Object.entries(valores).map(([campo, valor]: [string, any]) => {
            const ref = valoresRef.find((v: any) => v.campo === campo);
            const valorExibir = obterValor(valor);
            const unidadeExibir = obterUnidade(valor, ref);
            const fora = ref && foraDaFaixa(ref, valorExibir);
            return (
              <div key={campo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: fora ? '#fef2f2' : '#f8fafc', borderRadius: 9 }}>
                <span style={{ fontSize: 13, color: '#334155' }}>{campo}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: fora ? '#dc2626' : '#0a1f1e' }}>{String(valorExibir ?? '—')} {unidadeExibir}</span>
                  {ref && <span style={{ fontSize: 11, color: '#94a3b8' }}>({ref.textoRef || `${ref.minimo ?? '—'}–${ref.maximo ?? '—'}`})</span>}
                  {fora && <AlertTriangle size={14} color="#dc2626" />}
                </span>
              </div>
            );
          })}
        </div>

        {item.resultado?.observacao && (
          <div style={{ fontSize: 12.5, color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: 9, marginBottom: 12 }}>
            <strong>Obs:</strong> {item.resultado.observacao}
          </div>
        )}

        {erro && <div style={{ ...erroBox, marginBottom: 12 }}><AlertCircle size={14} /> {erro}</div>}

        <button onClick={validarEAssinar} disabled={processando} style={btnValidar}>
          {processando ? <Loader2 size={15} className="spin" /> : <><ShieldCheck size={16} /> Validar e assinar</>}
        </button>
      </div>
    </div>
  );
}

const cab: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 };
const vazio: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 };
const linhaFila: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderTop: '1px solid #f1f5f9', cursor: 'pointer' };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,31,30,.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 200 };
const painel: React.CSSProperties = { background: '#fff', width: '100%', maxWidth: 560, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,.1)' };
const painelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' };
const painelFooter: React.CSSProperties = { padding: 16, borderTop: '1px solid #f1f5f9', background: '#f8fafc' };
const btnX: React.CSSProperties = { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', color: '#0a1f1e', background: '#fff', boxSizing: 'border-box' };
const erroBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '9px 13px', borderRadius: 10, fontSize: 12.5 };
const btnValidar: React.CSSProperties = { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
const btnRejeitar: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', color: '#b45309', border: '1.5px solid #fde68a', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnRejeitarConfirma: React.CSSProperties = { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnCancelar: React.CSSProperties = { flex: 1, padding: 11, background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' };
const btnVoltar: React.CSSProperties = { width: '100%', padding: 13, background: '#0a1f1e', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif' };
