import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusOS, StatusItem } from '@prisma/client';

/**
 * PortalService
 *
 * Lógica do Portal do Paciente — acesso PÚBLICO (sem login de usuário).
 *
 * Segurança: o paciente se identifica com PROTOCOLO + DATA DE NASCIMENTO.
 * Os dois juntos funcionam como uma chave: o protocolo é único e a data
 * de nascimento confirma que é a pessoa certa (alguém com o protocolo
 * de outra pessoa não saberia a data de nascimento dela).
 *
 * O portal NUNCA expõe CPF, nome da mãe ou outros dados sensíveis.
 */
@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Consulta o andamento de uma ordem pelo protocolo + data de nascimento.
   *
   * @param protocolo — o número do protocolo (ex: LAB-20260531-00001)
   * @param dataNascimento — data no formato AAAA-MM-DD
   */
  async consultar(protocolo: string, dataNascimento: string) {
    // Busca a ordem pelo protocolo
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { protocolo: protocolo.trim().toUpperCase() },
      include: {
        paciente: { select: { nome: true, dataNascimento: true } },
        laboratorio: { select: { nome: true, municipio: true, uf: true } },
        itens: {
          include: {
            exame: { select: { nome: true } },
            resultado: { select: { status: true } },
          },
        },
        laudo: { select: { status: true, hashAutenticacao: true } },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Protocolo não encontrado');
    }

    // Confere a data de nascimento (segurança)
    const dataPaciente = ordem.paciente.dataNascimento
      .toISOString()
      .split('T')[0];
    if (dataPaciente !== dataNascimento) {
      throw new UnauthorizedException(
        'Data de nascimento não confere com o protocolo',
      );
    }

    // Monta a situação de cada exame (sem expor o resultado em si)
    const exames = ordem.itens.map((item) => ({
      nome: item.exame.nome,
      status: this.traduzirStatusItem(item.status, item.resultado?.status),
      pronto: item.resultado?.status === 'ASSINADO',
    }));

    const laudoPronto =
      ordem.laudo?.status === 'LIBERADO' &&
      (ordem.status === StatusOS.LIBERADA || ordem.status === StatusOS.CONCLUIDA);

    return {
      protocolo: ordem.protocolo,
      paciente: this.mascaraNome(ordem.paciente.nome),
      laboratorio: ordem.laboratorio.nome,
      municipio: `${ordem.laboratorio.municipio}/${ordem.laboratorio.uf}`,
      statusGeral: this.traduzirStatusOrdem(ordem.status),
      exames,
      laudoPronto,
      // Se o laudo está pronto, fornece o hash para baixar o PDF público
      hashLaudo: laudoPronto ? ordem.laudo?.hashAutenticacao : null,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private traduzirStatusItem(statusItem: string, statusResultado?: string): string {
    if (statusResultado === 'ASSINADO') return 'Pronto';
    if (statusItem === StatusItem.AGUARDANDO_COLETA) return 'Aguardando coleta';
    if (statusItem === StatusItem.COLETADO) return 'Em análise';
    if (statusItem === StatusItem.RESULTADO_DIGITADO) return 'Em análise';
    if (statusItem === StatusItem.VALIDADO) return 'Em conferência';
    if (statusItem === StatusItem.LIBERADO) return 'Pronto';
    return 'Em andamento';
  }

  private traduzirStatusOrdem(status: string): string {
    const mapa: Record<string, string> = {
      AGENDADA: 'Agendado',
      COLETA_REALIZADA: 'Coleta realizada',
      EM_DIGITACAO: 'Em análise',
      EM_ANALISE: 'Em conferência',
      LIBERADA: 'Pronto para retirada',
      CONCLUIDA: 'Pronto para retirada',
      CANCELADA: 'Cancelado',
      ABERTA: 'Em andamento',
      EM_COLETA: 'Coleta realizada',
    };
    return mapa[status] || 'Em andamento';
  }

  private mascaraNome(nome: string): string {
    const partes = nome.split(' ');
    return partes.map((p, i) => (i === 0 ? p : p.charAt(0) + '*')).join(' ');
  }
}
