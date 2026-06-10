/**
 * comprovante-html.template.ts
 *
 * HTML do comprovante de atendimento entregue ao paciente ao criar a OS.
 * Contém o protocolo + QR code que leva ao Portal do Paciente, onde ele
 * acompanha o andamento e baixa o laudo (protocolo + data de nascimento).
 */

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface DadosComprovante {
  protocolo: string;
  paciente: string;
  dataNascimento?: string;
  laboratorio: string;
  municipio: string;
  unidade?: string;
  exames: string[];
  criadoEm: string;
  qrCodeUrl: string | null;
  urlPortal: string;
}

export function montarComprovanteHtml(d: DadosComprovante): string {
  const listaExames = d.exames.length
    ? d.exames.map((e) => `<li>${esc(e)}</li>`).join('')
    : '<li>—</li>';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a1f1e; font-size: 13px; }

  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 20px; }
  .lab-nome { font-size: 18px; font-weight: 800; }
  .lab-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  .doc-tipo { text-align: right; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

  .protocolo-box { background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 20px; }
  .protocolo-label { font-size: 11px; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; }
  .protocolo-num { font-size: 26px; font-weight: 800; font-family: 'Courier New', monospace; color: #0d9488; margin-top: 4px; letter-spacing: 1px; }

  .corpo { display: flex; gap: 24px; }
  .dados { flex: 1; }
  .linha { margin-bottom: 8px; }
  .rotulo { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
  .valor { font-size: 14px; color: #0a1f1e; font-weight: 500; }

  .exames { margin-top: 14px; }
  .exames-tit { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
  .exames ul { list-style: none; }
  .exames li { font-size: 13px; padding: 4px 0 4px 16px; position: relative; border-bottom: 1px solid #f1f5f9; }
  .exames li:before { content: '•'; color: #0d9488; position: absolute; left: 0; }

  .qr-area { width: 200px; text-align: center; border-left: 1px dashed #cbd5e1; padding-left: 24px; }
  .qr-area img { width: 160px; height: 160px; }
  .qr-titulo { font-size: 13px; font-weight: 700; color: #0a1f1e; margin-bottom: 10px; }
  .qr-instr { font-size: 11px; color: #64748b; margin-top: 10px; line-height: 1.5; }

  .como { margin-top: 24px; background: #f8fafc; border-radius: 10px; padding: 16px 18px; }
  .como-tit { font-size: 12px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
  .como ol { margin-left: 18px; font-size: 12.5px; color: #334155; line-height: 1.7; }

  .rodape { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
</style></head>
<body>
  <div class="head">
    <div>
      <div class="lab-nome">${esc(d.laboratorio)}</div>
      <div class="lab-sub">${esc(d.municipio)}</div>
    </div>
    <div class="doc-tipo">Comprovante de<br/>Atendimento</div>
  </div>

  <div class="protocolo-box">
    <div class="protocolo-label">Protocolo de acesso</div>
    <div class="protocolo-num">${esc(d.protocolo)}</div>
  </div>

  <div class="corpo">
    <div class="dados">
      <div class="linha"><div class="rotulo">Paciente</div><div class="valor">${esc(d.paciente)}</div></div>
      ${d.unidade ? `<div class="linha"><div class="rotulo">Unidade</div><div class="valor">${esc(d.unidade)}</div></div>` : ''}
      <div class="linha"><div class="rotulo">Data do atendimento</div><div class="valor">${esc(d.criadoEm)}</div></div>

      <div class="exames">
        <div class="exames-tit">Exames solicitados</div>
        <ul>${listaExames}</ul>
      </div>
    </div>

    <div class="qr-area">
      <div class="qr-titulo">Acompanhe pelo celular</div>
      ${d.qrCodeUrl ? `<img src="${d.qrCodeUrl}" alt="QR Code"/>` : '<div style="color:#94a3b8;font-size:11px">QR indisponível</div>'}
      <div class="qr-instr">Aponte a câmera do celular para o QR code e acompanhe seus exames.</div>
    </div>
  </div>

  <div class="como">
    <div class="como-tit">Como consultar seus resultados</div>
    <ol>
      <li>Escaneie o QR code ou acesse: <strong>${esc(d.urlPortal)}</strong></li>
      <li>Informe o <strong>protocolo</strong> acima e sua <strong>data de nascimento</strong></li>
      <li>Acompanhe o andamento e baixe o laudo quando estiver pronto</li>
    </ol>
  </div>

  <div class="rodape">
    Guarde este comprovante. O protocolo e a data de nascimento são necessários para acessar seus resultados.
  </div>
</body></html>`;
}
