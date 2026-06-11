/**
 * relatorio-html.template.ts
 *
 * HTML dos relatórios gerenciais para conversão em PDF (Puppeteer).
 * Cabeçalho formal com identidade do laboratório, para anexar em
 * prestação de contas / processos.
 *
 * Pode renderizar o relatório GERAL (todas as seções) ou uma seção
 * individual (produção, exames ou produtividade).
 */

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dataBR(iso: string): string {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

interface DadosRelatorio {
  laboratorio: any;       // { nome, cnes, municipio, uf, responsavelTecnico, crbm }
  periodo: { inicio: string; fim: string };
  resumo?: any;
  producao?: any[];
  exames?: any[];
  produtividade?: any[];
  detalhado?: any[];
  // quais seções incluir
  secoes: ('resumo' | 'producao' | 'exames' | 'produtividade' | 'detalhado')[];
  titulo: string;
}

function traduzPerfil(role: string) {
  return role === 'ADMIN' ? 'Administrador' : role === 'BIOMEDICO' ? 'Biomédico' : role === 'TECNICO' ? 'Técnico' : role;
}

export function montarRelatorioHtml(d: DadosRelatorio): string {
  const lab = d.laboratorio || {};
  const emissao = new Date().toLocaleString('pt-BR');

  // ── Seção: Resumo (cards) ──
  const secResumo = d.secoes.includes('resumo') && d.resumo ? `
    <div class="secao">
      <div class="secao-tit">Resumo do período</div>
      <div class="cards">
        <div class="card"><div class="card-val">${d.resumo.totalOS ?? 0}</div><div class="card-lbl">Ordens de serviço</div></div>
        <div class="card"><div class="card-val">${d.resumo.totalExames ?? 0}</div><div class="card-lbl">Exames realizados</div></div>
        <div class="card"><div class="card-val">${d.resumo.osConcluidas ?? 0}</div><div class="card-lbl">OS concluídas</div></div>
        <div class="card"><div class="card-val">${d.resumo.laudosEmitidos ?? 0}</div><div class="card-lbl">Laudos emitidos</div></div>
      </div>
    </div>` : '';

  // ── Seção: Produção por dia ──
  const linhasProducao = (d.producao || []).map((p) => `
    <tr><td>${dataBR(p.dia)}</td><td class="num">${p.os}</td><td class="num">${p.exames}</td></tr>`).join('');
  const totalOS = (d.producao || []).reduce((s, p) => s + p.os, 0);
  const totalEx = (d.producao || []).reduce((s, p) => s + p.exames, 0);
  const secProducao = d.secoes.includes('producao') ? `
    <div class="secao">
      <div class="secao-tit">Produção por dia</div>
      ${(d.producao || []).length === 0 ? '<div class="vazio">Sem dados no período.</div>' : `
      <table>
        <thead><tr><th>Data</th><th class="num">Ordens</th><th class="num">Exames</th></tr></thead>
        <tbody>${linhasProducao}</tbody>
        <tfoot><tr><td><strong>Total</strong></td><td class="num"><strong>${totalOS}</strong></td><td class="num"><strong>${totalEx}</strong></td></tr></tfoot>
      </table>`}
    </div>` : '';

  // ── Seção: Exames mais solicitados ──
  const linhasExames = (d.exames || []).map((e, i) => `
    <tr><td>${i + 1}º</td><td>${esc(e.exame)}</td><td class="num">${e.quantidade}</td></tr>`).join('');
  const secExames = d.secoes.includes('exames') ? `
    <div class="secao">
      <div class="secao-tit">Exames mais solicitados</div>
      ${(d.exames || []).length === 0 ? '<div class="vazio">Sem dados no período.</div>' : `
      <table>
        <thead><tr><th style="width:60px">Posição</th><th>Exame</th><th class="num">Quantidade</th></tr></thead>
        <tbody>${linhasExames}</tbody>
      </table>`}
    </div>` : '';

  // ── Seção: Produtividade ──
  const linhasProd = (d.produtividade || []).map((p) => `
    <tr><td>${esc(p.profissional)}</td><td>${traduzPerfil(p.perfil)}</td><td class="num">${p.resultados}</td></tr>`).join('');
  const secProdutividade = d.secoes.includes('produtividade') ? `
    <div class="secao">
      <div class="secao-tit">Produtividade por profissional</div>
      ${(d.produtividade || []).length === 0 ? '<div class="vazio">Sem resultados validados no período.</div>' : `
      <table>
        <thead><tr><th>Profissional</th><th>Perfil</th><th class="num">Resultados validados</th></tr></thead>
        <tbody>${linhasProd}</tbody>
      </table>`}
    </div>` : '';

  // ── Seção: Detalhado (bloco por paciente com exames) ──
  const statusCor = (s: string) => {
    if (s === 'Liberado') return '#0f766e';
    if (s === 'Validado' || s === 'Digitado') return '#2563eb';
    if (s === 'Aguardando coleta') return '#b45309';
    return '#64748b';
  };
  const blocosPacientes = (d.detalhado || []).map((o) => {
    const linhasExames = (o.exames || []).map((ex: any) => `
      <tr>
        <td>${esc(ex.nome)}</td>
        <td><span class="status-pill" style="color:${statusCor(ex.status)}">${esc(ex.status)}</span></td>
        <td class="num">${ex.dataColeta ? dataBR(ex.dataColeta) : '—'}</td>
      </tr>`).join('');
    return `
      <div class="pac-bloco">
        <div class="pac-head">
          <div class="pac-nome">${esc(o.paciente)}</div>
          <div class="pac-meta">${esc(o.protocolo)} · ${esc(o.unidade)} · ${dataBR(o.data)}</div>
        </div>
        <table class="tab-exames">
          <thead><tr><th>Exame</th><th style="width:130px">Status</th><th class="num" style="width:90px">Coleta</th></tr></thead>
          <tbody>${linhasExames || '<tr><td colspan="3" class="vazio">Sem exames</td></tr>'}</tbody>
        </table>
      </div>`;
  }).join('');
  const totalPac = (d.detalhado || []).length;
  const totalExDet = (d.detalhado || []).reduce((s, o) => s + (o.exames?.length || 0), 0);
  const secDetalhado = d.secoes.includes('detalhado') ? `
    <div class="secao">
      <div class="secao-tit">Relatório detalhado por paciente</div>
      <div class="det-resumo">${totalPac} atendimento(s) · ${totalExDet} exame(s) no período</div>
      ${totalPac === 0 ? '<div class="vazio">Nenhum atendimento no período.</div>' : blocosPacientes}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a1f1e; font-size: 12px; }

  .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 8px; }
  .lab-nome { font-size: 18px; font-weight: 800; }
  .lab-info { font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.5; }
  .doc-tipo { text-align: right; }
  .doc-tipo .t { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .doc-tipo .nome-doc { font-size: 15px; font-weight: 700; color: #0d9488; margin-top: 2px; }

  .periodo { font-size: 12px; color: #334155; margin-bottom: 20px; padding: 8px 0; }
  .periodo strong { color: #0a1f1e; }

  .secao { margin-bottom: 24px; page-break-inside: avoid; }
  .secao-tit { font-size: 14px; font-weight: 700; color: #0a1f1e; border-left: 3px solid #0d9488; padding-left: 10px; margin-bottom: 12px; }

  .cards { display: flex; gap: 12px; }
  .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .card-val { font-size: 24px; font-weight: 800; color: #0d9488; }
  .card-lbl { font-size: 10px; color: #64748b; margin-top: 4px; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 10px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .3px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  td { padding: 7px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  td.num, th.num { text-align: right; }
  tfoot td { border-top: 1.5px solid #cbd5e1; background: #f8fafc; }
  .vazio { color: #94a3b8; font-size: 12px; padding: 10px; font-style: italic; }

  /* Seção detalhada por paciente */
  .det-resumo { font-size: 12px; color: #64748b; margin-bottom: 14px; }
  .pac-bloco { margin-bottom: 14px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .pac-head { background: #f8fafc; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  .pac-nome { font-size: 13px; font-weight: 700; color: #0a1f1e; }
  .pac-meta { font-size: 10.5px; color: #64748b; font-family: 'Courier New', monospace; margin-top: 2px; }
  .tab-exames { width: 100%; }
  .tab-exames th { background: #fff; font-size: 9px; padding: 6px 12px; }
  .tab-exames td { padding: 6px 12px; font-size: 11.5px; }
  .status-pill { font-size: 10.5px; font-weight: 600; }

  .rodape { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
  .assinatura { border-top: 1px solid #94a3b8; padding-top: 5px; width: 55%; text-align: center; font-size: 11px; color: #64748b; }
  .emissao { font-size: 10px; color: #94a3b8; }
</style></head>
<body>
  <div class="cabecalho">
    <div>
      <div class="lab-nome">${esc(lab.nome || 'Laboratório')}</div>
      <div class="lab-info">
        ${lab.municipio ? `${esc(lab.municipio)}/${esc(lab.uf || '')}` : ''}${lab.cnes ? ` · CNES: ${esc(lab.cnes)}` : ''}<br/>
        ${lab.responsavelTecnico ? `Resp. Técnico: ${esc(lab.responsavelTecnico)}` : ''}${lab.crbm ? ` · CRBM: ${esc(lab.crbm)}` : ''}
      </div>
    </div>
    <div class="doc-tipo">
      <div class="t">Relatório</div>
      <div class="nome-doc">${esc(d.titulo)}</div>
    </div>
  </div>

  <div class="periodo">
    Período: <strong>${dataBR(d.periodo.inicio)}</strong> a <strong>${dataBR(d.periodo.fim)}</strong>
  </div>

  ${secResumo}
  ${secProducao}
  ${secExames}
  ${secProdutividade}
  ${secDetalhado}

  <div class="rodape">
    <div class="assinatura">${esc(lab.responsavelTecnico || 'Responsável Técnico')}${lab.crbm ? ` — CRBM ${esc(lab.crbm)}` : ''}</div>
    <div class="emissao">Emitido em ${emissao}</div>
  </div>
</body></html>`;
}
