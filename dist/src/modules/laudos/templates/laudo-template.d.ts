interface DadosLaudo {
    laboratorio: {
        nome: string;
        municipio: string;
        uf: string;
        cnes: string;
        cnpj?: string;
        responsavelTecnico?: string;
        crbm?: string;
        logoUrl?: string;
    };
    paciente: {
        nome: string;
        dataNascimento: Date;
        sexo: string;
    };
    protocolo: string;
    dataEmissao: string;
    unidade: string;
    medicoSolicitante?: string;
    gruposExames: {
        categoria: string;
        exames: {
            nome: string;
            metodo?: string;
            material: string;
            valores: {
                campo: string;
                valor: any;
                situacao: string;
                referencia: string;
                unidade: string;
            }[];
            parecer?: string;
        }[];
    }[];
    hashAutenticacao: string;
    qrCodeDataUrl: string;
    corPrimaria?: string;
}
export declare function gerarHtmlLaudo(dados: DadosLaudo): string;
export {};
