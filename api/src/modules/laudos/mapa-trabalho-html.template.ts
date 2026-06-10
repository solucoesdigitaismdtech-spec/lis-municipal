/**
 * mapa-trabalho-html.template.ts
 *
 * Gera o HTML do Mapa de Trabalho que o Puppeteer converte em PDF.
 * Documento OPERACIONAL interno: o biomédico imprime, leva à bancada
 * e anota os resultados à mão (com os valores de referência ao lado).
 *
 * Cada paciente sai numa página separada (page-break).
 */

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function calcularIdade(dataNascimento: any): number | string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

interface DadosMapa {
  pacientes: any[];      // [{ protocolo, paciente, unidade, itens }]
  laboratorio: any;      // { nome, municipio, uf }
  titulo: string;
}

export function montarMapaHtml({ pacientes, laboratorio, titulo }: DadosMapa): string {
  const hojeStr = new Date().toLocaleDateString('pt-BR');

  const folhas = pacientes.map((p) => {
    const idade = calcularIdade(p.paciente?.dataNascimento);
    const sexo = p.paciente?.sexo === 'FEMININO' ? 'F' : p.paciente?.sexo === 'MASCULINO' ? 'M' : '-';

    const blocosExames = (p.itens || []).map((item: any) => {
      const valoresRef = item.exame?.valoresRef || [];

      const linhas = valoresRef.length > 0
        ? valoresRef.map((ref: any) => {
            const referencia = ref.minimo != null
              ? `${ref.minimo} a ${ref.maximo} ${ref.unidade || ''}`
              : (ref.textoRef || '—');
            return `<tr>
              <td class="campo">${esc(ref.campo)}</td>
              <td class="anotar"></td>
              <td class="ref">${esc(referencia)}${ref.sexo ? ` (${ref.sexo === 'FEMININO' ? 'F' : 'M'})` : ''}</td>
            </tr>`;
          }).join('')
        : `<tr><td class="campo">Resultado</td><td class="anotar"></td><td class="ref">—</td></tr>`;

      return `
        <div class="exame">
          <div class="exame-tit">${esc(item.exame?.nome)}${item.exame?.material ? ` · ${esc(item.exame.material)}` : ''}${item.exame?.metodo ? ` <span class="metodo">(${esc(item.exame.metodo)})</span>` : ''}</div>
          <table class="res">
            <thead><tr><th>Parâmetro</th><th class="col-anotar">Resultado (anotar)</th><th>Valores de referência</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>`;
    }).join('');

    return `
      <div class="folha">
        <div class="head">
          <div>
            <div class="lab-nome">${esc(laboratorio?.nome || 'Laboratório')}</div>
            <div class="lab-sub">${esc(laboratorio?.municipio || '')}/${esc(laboratorio?.uf || '')}</div>
          </div>
          <div class="head-right">
            <div class="tipo">Mapa de Trabalho</div>
            <div class="proto">${esc(p.protocolo)}</div>
            <div class="emissao">Emissão: ${hojeStr}</div>
          </div>
        </div>

        <div class="pac">
          <div><strong>Paciente:</strong> ${esc(p.paciente?.nome)}</div>
          <div><strong>Idade:</strong> ${idade} anos</div>
          <div><strong>Sexo:</strong> ${sexo}</div>
          <div><strong>Unidade:</strong> ${esc(p.unidade?.nome || '—')}</div>
          <div class="data-coleta"><strong>Data da coleta:</strong> ____/____/______</div>
        </div>

        ${blocosExames}

        <div class="rodape">
          <div class="assinatura">Responsável pela análise (assinatura)</div>
          <div class="assinatura-data">Data / Hora</div>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a1f1e; font-size: 12px; }
  .folha { page-break-after: always; padding-bottom: 10px; }
  .folha:last-child { page-break-after: auto; }

  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; }
  .lab-nome { font-size: 17px; font-weight: 800; color: #0a1f1e; }
  .lab-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .head-right { text-align: right; }
  .tipo { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  .proto { font-size: 15px; font-weight: 700; font-family: 'Courier New', monospace; color: #0d9488; margin-top: 2px; }
  .emissao { font-size: 11px; color: #64748b; margin-top: 2px; }

  .pac { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 6px 12px; background: #f8fafc; padding: 12px 14px; border-radius: 8px; margin-bottom: 18px; font-size: 12px; }
  .pac strong { color: #334155; }
  .data-coleta { grid-column: 1 / -1; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px; }

  .exame { margin-bottom: 16px; page-break-inside: avoid; }
  .exame-tit { background: #0d9488; color: #fff; padding: 7px 14px; border-radius: 6px 6px 0 0; font-size: 13px; font-weight: 700; }
  .exame-tit .metodo { font-weight: 400; opacity: .85; font-size: 11px; }

  table.res { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; }
  .res th { text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .3px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .res td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  .res .col-anotar { width: 32%; }
  .res .campo { font-weight: 600; color: #0a1f1e; }
  .res .anotar { background: #fffef5; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
  .res .ref { color: #64748b; }

  .rodape { margin-top: 30px; display: flex; justify-content: space-between; }
  .assinatura { border-top: 1px solid #94a3b8; padding-top: 5px; width: 50%; text-align: center; font-size: 11px; color: #64748b; }
  .assinatura-data { border-top: 1px solid #94a3b8; padding-top: 5px; width: 30%; text-align: center; font-size: 11px; color: #64748b; }
</style></head>
<body>${folhas}</body></html>`;
}
