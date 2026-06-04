/**
 * laudo-html.template.ts
 *
 * Gera o HTML do laudo que o Puppeteer converte em PDF.
 * Mantém o mesmo layout que desenhamos no frontend (cabeçalho do
 * laboratório, dados do paciente, tabela de exames com valores de
 * referência, assinatura do biomédico, rodapé com hash + QR code).
 *
 * Recebe a OS completa (com laboratorio, paciente, itens, resultados)
 * e devolve uma string HTML pronta para impressão A4.
 */

// Extrai o valor independente do formato (texto simples ou objeto)
function obterValor(valor: any): string {
  if (valor && typeof valor === 'object' && 'valor' in valor) return String(valor.valor ?? '');
  return String(valor ?? '');
}
function obterUnidade(valor: any, ref: any): string {
  if (valor && typeof valor === 'object' && valor.unidade) return valor.unidade;
  return ref?.unidade || '';
}
function obterReferencia(valor: any, ref: any): string {
  if (valor && typeof valor === 'object' && valor.referencia) return valor.referencia;
  if (!ref) return '—';
  return ref.textoRef ? ref.textoRef : `${ref.minimo ?? '—'} a ${ref.maximo ?? '—'} ${ref.unidade || ''}`;
}
function foraDaFaixa(ref: any, valorStr: string): boolean {
  const n = parseFloat(String(valorStr).replace(',', '.'));
  if (isNaN(n) || !ref) return false;
  if (ref.minimo != null && n < ref.minimo) return true;
  if (ref.maximo != null && n > ref.maximo) return true;
  return false;
}
function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function dataBR(d: any): string {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
}
function horaBR(d: any): string {
  return d ? new Date(d).toLocaleString('pt-BR') : '—';
}
function idade(d: any): string {
  return d ? String(Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000))) : '';
}

export function montarLaudoHtml(ordem: any): string {
  const lab = ordem.laboratorio || {};
  const laudo = ordem.laudo || {};
  const pac = ordem.paciente || {};
  const sexo = pac.sexo === 'FEMININO' ? 'Feminino' : pac.sexo === 'MASCULINO' ? 'Masculino' : 'Outro';

  const blocosExames = (ordem.itens || []).map((item: any) => {
    const valores = item.resultado?.valores || {};
    const valoresRef = item.exame?.valoresRef || [];
    const bio = item.resultado?.biomedico?.name;

    const linhas = Object.keys(valores).length === 0
      ? `<tr><td colspan="3" class="vazio">Sem valores registrados</td></tr>`
      : Object.entries(valores).map(([campo, valor]: [string, any]) => {
          const v = obterValor(valor);
          const uni = obterUnidade(valor, valoresRef.find((r: any) => r.campo === campo));
          const refObj = valoresRef.find((r: any) => r.campo === campo);
          const ref = obterReferencia(valor, refObj);
          const fora = foraDaFaixa(refObj, v);
          return `<tr>
            <td>${esc(campo)}</td>
            <td class="valor ${fora ? 'fora' : ''}">${esc(v)} ${esc(uni)} ${fora ? '⚠' : ''}</td>
            <td class="ref">${esc(ref)}</td>
          </tr>`;
        }).join('');

    return `
      <div class="exame">
        <div class="exame-tit">${esc(item.exame?.nome || 'Exame')}${item.exame?.material ? ` · ${esc(item.exame.material)}` : ''}</div>
        <table class="res">
          <thead><tr><th>Parâmetro</th><th>Resultado</th><th>Valores de referência</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
        ${item.resultado?.observacao ? `<div class="obs">Obs: ${esc(item.resultado.observacao)}</div>` : ''}
        ${bio ? `<div class="assin">Validado por ${esc(bio)}${item.resultado?.validadoEm ? ` em ${horaBR(item.resultado.validadoEm)}` : ''}</div>` : ''}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a1f1e; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 18px; }
  .lab-nome { font-size: 18px; font-weight: 800; color: #0a1f1e; }
  .lab-sub { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.5; }
  .tipo { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
  .proto { font-size: 15px; font-weight: 700; font-family: monospace; color: #0d9488; margin-top: 2px; text-align: right; }
  .pac { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px 14px; border-radius: 8px; margin-bottom: 18px; font-size: 12px; }
  .pac strong { color: #334155; }
  .exame { margin-bottom: 18px; page-break-inside: avoid; }
  .exame-tit { background: #0d9488; color: #fff; padding: 7px 14px; border-radius: 6px 6px 0 0; font-size: 13px; font-weight: 700; }
  table.res { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; }
  .res th { text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .res td { padding: 7px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .res .valor { font-weight: 700; color: #0a1f1e; }
  .res .valor.fora { color: #dc2626; }
  .res .ref { color: #64748b; }
  .res .vazio { color: #94a3b8; text-align: center; }
  .obs { font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic; }
  .assin { font-size: 10px; color: #94a3b8; margin-top: 4px; text-align: right; }
  .foot { margin-top: 26px; border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .auth { font-size: 10px; color: #94a3b8; max-width: 380px; line-height: 1.6; }
  .auth .tit { color: #0d9488; font-weight: 600; margin-bottom: 4px; }
  .hash { font-family: monospace; color: #334155; }
  .qr { width: 92px; height: 92px; }
</style></head>
<body>
  <div class="head">
    <div>
      <div class="lab-nome">${esc(lab.nome || 'Laboratório')}</div>
      <div class="lab-sub">
        ${esc(lab.municipio || '')}/${esc(lab.uf || '')} ${lab.cnes ? `· CNES ${esc(lab.cnes)}` : ''}<br/>
        ${lab.responsavelTecnico ? `Resp. Técnico: ${esc(lab.responsavelTecnico)}` : ''}${lab.crbm ? ` · CRBM ${esc(lab.crbm)}` : ''}
      </div>
    </div>
    <div>
      <div class="tipo">Laudo de Análises</div>
      <div class="proto">${esc(ordem.protocolo)}</div>
    </div>
  </div>

  <div class="pac">
    <div><strong>Paciente:</strong> ${esc(pac.nome)}</div>
    <div><strong>Sexo:</strong> ${sexo}</div>
    <div><strong>Nascimento:</strong> ${dataBR(pac.dataNascimento)} ${idade(pac.dataNascimento) ? `(${idade(pac.dataNascimento)} anos)` : ''}</div>
    <div><strong>Unidade:</strong> ${esc(ordem.unidade?.nome)}</div>
  </div>

  ${blocosExames}

  <div class="foot">
    <div class="auth">
      <div class="tit">✓ Documento autenticado eletronicamente</div>
      Código de autenticação:<br/>
      <span class="hash">${esc(laudo.hashAutenticacao || '—')}</span><br/>
      ${laudo.liberadoEm ? `Emitido em ${horaBR(laudo.liberadoEm)}<br/>` : ''}
      Verifique a autenticidade pelo QR code ao lado.
    </div>
    ${laudo.qrCodeUrl ? `<img class="qr" src="${laudo.qrCodeUrl}" alt="QR"/>` : ''}
  </div>
</body></html>`;
}
