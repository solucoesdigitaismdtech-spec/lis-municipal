"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarHtmlLaudo = gerarHtmlLaudo;
function rotuloCategoria(cat) {
    const mapa = {
        HEMATOLOGIA: 'Hematologia',
        BIOQUIMICA: 'Bioquímica',
        URINANALISE: 'Urinálise',
        MICROBIOLOGIA: 'Microbiologia',
        IMUNOLOGIA: 'Imunologia',
        HORMONIOS: 'Hormônios',
        SOROLOGIAS: 'Sorologias',
        OUTROS: 'Outros Exames',
    };
    return mapa[cat] || cat;
}
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate()))
        idade--;
    return idade;
}
function gerarHtmlLaudo(dados) {
    const cor = dados.corPrimaria || '#0d9488';
    const idade = calcularIdade(dados.paciente.dataNascimento);
    const logoHtml = dados.laboratorio.logoUrl
        ? `<img src="${dados.laboratorio.logoUrl}" alt="logo" style="max-height:60px;max-width:140px;" />`
        : `<div style="width:60px;height:60px;border-radius:50%;background:${cor};display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:bold;">🏥</div>`;
    const secoesExames = dados.gruposExames
        .map((grupo) => `
    <div class="categoria">
      <div class="categoria-titulo">${rotuloCategoria(grupo.categoria)}</div>
      ${grupo.exames
        .map((exame) => `
        <div class="exame">
          <div class="exame-nome">${exame.nome}</div>
          <div class="exame-metodo">Material: ${exame.material}${exame.metodo ? ` &nbsp;•&nbsp; Método: ${exame.metodo}` : ''}</div>
          <table class="tabela-resultados">
            <thead>
              <tr>
                <th style="width:35%">Parâmetro</th>
                <th style="width:20%">Resultado</th>
                <th style="width:15%">Unidade</th>
                <th style="width:30%">Valores de Referência</th>
              </tr>
            </thead>
            <tbody>
              ${exame.valores
        .map((v) => {
        const alterado = v.situacao && v.situacao !== 'NORMAL';
        const seta = v.situacao === 'ALTO' ? ' ↑' : v.situacao === 'BAIXO' ? ' ↓' : '';
        return `
                  <tr>
                    <td>${v.campo}</td>
                    <td class="${alterado ? 'alterado' : ''}">${v.valor}${seta}</td>
                    <td>${v.unidade || '-'}</td>
                    <td class="referencia">${v.referencia || '-'}</td>
                  </tr>`;
    })
        .join('')}
            </tbody>
          </table>
          ${exame.parecer ? `<div class="parecer"><strong>Parecer:</strong> ${exame.parecer}</div>` : ''}
        </div>`)
        .join('')}
    </div>`)
        .join('');
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1f2937;
    font-size: 11px;
    line-height: 1.5;
  }

  /* Cabeçalho */
  .cabecalho {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 3px solid ${cor};
  }
  .cabecalho-info { flex: 1; }
  .cabecalho-info h1 {
    font-size: 18px;
    color: ${cor};
    margin-bottom: 2px;
  }
  .cabecalho-info p {
    font-size: 10px;
    color: #6b7280;
  }

  /* Título do documento */
  .titulo-doc {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
    margin: 16px 0;
    color: #374151;
  }

  /* Dados do paciente */
  .dados-paciente {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 18px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 20px;
    font-size: 10.5px;
  }
  .dados-paciente .campo { display: flex; gap: 6px; }
  .dados-paciente .label { color: #6b7280; font-weight: 600; }

  /* Categoria de exames */
  .categoria { margin-bottom: 18px; }
  .categoria-titulo {
    background: ${cor};
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    padding: 5px 12px;
    border-radius: 4px 4px 0 0;
  }
  .exame { padding: 10px 4px; border-bottom: 1px solid #f3f4f6; }
  .exame-nome { font-size: 12px; font-weight: bold; color: #111827; }
  .exame-metodo { font-size: 9px; color: #9ca3af; margin-bottom: 6px; }

  /* Tabela de resultados */
  .tabela-resultados {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
  }
  .tabela-resultados th {
    background: #f3f4f6;
    color: #374151;
    text-align: left;
    padding: 5px 8px;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .tabela-resultados td {
    padding: 5px 8px;
    border-bottom: 1px solid #f3f4f6;
  }
  .tabela-resultados td.alterado {
    color: #dc2626;
    font-weight: bold;
  }
  .tabela-resultados td.referencia { color: #6b7280; font-size: 10px; }

  .parecer {
    margin-top: 6px;
    padding: 6px 10px;
    background: #fffbeb;
    border-left: 3px solid #f59e0b;
    font-size: 10px;
  }

  /* Rodapé */
  .rodape {
    margin-top: 30px;
    padding-top: 14px;
    border-top: 2px solid ${cor};
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .rodape-assinatura { text-align: center; flex: 1; }
  .rodape-assinatura .linha {
    border-top: 1px solid #374151;
    width: 200px;
    margin: 0 auto 4px;
    padding-top: 4px;
  }
  .rodape-assinatura .nome { font-weight: bold; font-size: 11px; }
  .rodape-assinatura .crbm { font-size: 9px; color: #6b7280; }
  .rodape-qr { text-align: center; }
  .rodape-qr img { width: 80px; height: 80px; }
  .rodape-qr .texto { font-size: 7px; color: #9ca3af; max-width: 90px; }

  .autenticacao {
    text-align: center;
    font-size: 8px;
    color: #9ca3af;
    margin-top: 10px;
  }
</style>
</head>
<body>

  <div class="cabecalho">
    ${logoHtml}
    <div class="cabecalho-info">
      <h1>${dados.laboratorio.nome}</h1>
      <p>${dados.laboratorio.municipio}/${dados.laboratorio.uf} &nbsp;•&nbsp; CNES: ${dados.laboratorio.cnes}${dados.laboratorio.cnpj ? ` &nbsp;•&nbsp; CNPJ: ${dados.laboratorio.cnpj}` : ''}</p>
    </div>
  </div>

  <div class="titulo-doc">LAUDO LABORATORIAL</div>

  <div class="dados-paciente">
    <div class="campo"><span class="label">Paciente:</span> <span>${dados.paciente.nome}</span></div>
    <div class="campo"><span class="label">Protocolo:</span> <span>${dados.protocolo}</span></div>
    <div class="campo"><span class="label">Sexo:</span> <span>${dados.paciente.sexo}</span></div>
    <div class="campo"><span class="label">Idade:</span> <span>${idade} anos</span></div>
    <div class="campo"><span class="label">Unidade:</span> <span>${dados.unidade}</span></div>
    <div class="campo"><span class="label">Emissão:</span> <span>${dados.dataEmissao}</span></div>
    ${dados.medicoSolicitante ? `<div class="campo"><span class="label">Solicitante:</span> <span>${dados.medicoSolicitante}</span></div>` : ''}
  </div>

  ${secoesExames}

  <div class="rodape">
    <div class="rodape-assinatura">
      <div class="linha"></div>
      <div class="nome">${dados.laboratorio.responsavelTecnico || 'Responsável Técnico'}</div>
      <div class="crbm">${dados.laboratorio.crbm ? `CRBM: ${dados.laboratorio.crbm}` : 'Biomédico Responsável'}</div>
    </div>
    <div class="rodape-qr">
      <img src="${dados.qrCodeDataUrl}" alt="QR" />
      <div class="texto">Valide a autenticidade</div>
    </div>
  </div>

  <div class="autenticacao">
    Código de autenticação: ${dados.hashAutenticacao}<br>
    Este documento foi assinado digitalmente e pode ser validado pelo QR Code acima.
  </div>

</body>
</html>`;
}
//# sourceMappingURL=laudo-template.js.map