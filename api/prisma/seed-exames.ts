/**
 * ════════════════════════════════════════════════════════════
 * SEED DE EXAMES — Catálogo padrão para laboratório municipal
 * ════════════════════════════════════════════════════════════
 *
 * Este arquivo popula o banco com os exames laboratoriais mais
 * praticados em laboratórios públicos municipais do Brasil,
 * já com categorias, materiais e valores de referência.
 *
 * COMO USAR:
 * 1. Salve este arquivo em: prisma/seed-exames.ts
 * 2. Rode no terminal (dentro de apps/api):
 *    npx ts-node prisma/seed-exames.ts SEU_LABORATORIO_ID
 *
 *    (Passe o ID do laboratório como argumento. Pegue ele com
 *     uma query no pgAdmin: SELECT id, nome FROM laboratorios;)
 *
 * Os valores de referência usados aqui são FAIXAS GERAIS de
 * adulto. Cada laboratório pode ajustar conforme seu método.
 * ════════════════════════════════════════════════════════════
 */

import { PrismaClient, CategoriaExame } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Carrega as variáveis do .env (DATABASE_URL)
dotenv.config();

// Prisma 7 exige o adapter-pg com a connection string
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Catálogo de exames com seus valores de referência.
 * Estrutura: cada exame tem dados básicos + lista de campos
 * (cada campo é um valor de referência).
 */
const CATALOGO_EXAMES = [
  // ─── HEMATOLOGIA ───────────────────────────────────────────
  {
    codigo: 'HEMOG',
    nome: 'Hemograma Completo',
    sigtap: '0202020380',
    material: 'Sangue total com EDTA',
    categoria: CategoriaExame.HEMATOLOGIA,
    metodo: 'Automação / Citometria de fluxo',
    prazoHoras: 24,
    instrucoes: 'Não é necessário jejum.',
    valores: [
      { campo: 'Hemoglobina', minimo: 12.0, maximo: 16.0, unidade: 'g/dL', sexo: 'FEMININO' as const },
      { campo: 'Hemoglobina', minimo: 13.0, maximo: 17.0, unidade: 'g/dL', sexo: 'MASCULINO' as const },
      { campo: 'Hematócrito', minimo: 36.0, maximo: 46.0, unidade: '%', sexo: 'FEMININO' as const },
      { campo: 'Hematócrito', minimo: 40.0, maximo: 52.0, unidade: '%', sexo: 'MASCULINO' as const },
      { campo: 'Hemácias', minimo: 4.0, maximo: 5.5, unidade: 'milhões/mm³' },
      { campo: 'Leucócitos', minimo: 4000, maximo: 11000, unidade: '/mm³' },
      { campo: 'Plaquetas', minimo: 150000, maximo: 450000, unidade: '/mm³' },
    ],
  },
  {
    codigo: 'VHS',
    nome: 'VHS - Velocidade de Hemossedimentação',
    sigtap: '0202020134',
    material: 'Sangue total com EDTA',
    categoria: CategoriaExame.HEMATOLOGIA,
    metodo: 'Westergren',
    prazoHoras: 24,
    valores: [
      { campo: 'VHS', minimo: 0, maximo: 20, unidade: 'mm/h', sexo: 'FEMININO' as const },
      { campo: 'VHS', minimo: 0, maximo: 15, unidade: 'mm/h', sexo: 'MASCULINO' as const },
    ],
  },

  // ─── BIOQUÍMICA ────────────────────────────────────────────
  {
    codigo: 'GLIC',
    nome: 'Glicemia de Jejum',
    sigtap: '0202010473',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático colorimétrico',
    prazoHoras: 12,
    instrucoes: 'Jejum de 8 a 12 horas.',
    valores: [
      { campo: 'Glicose', minimo: 70, maximo: 99, unidade: 'mg/dL', critico: true },
    ],
  },
  {
    codigo: 'COLT',
    nome: 'Colesterol Total',
    sigtap: '0202010295',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático colorimétrico',
    prazoHoras: 24,
    instrucoes: 'Jejum de 12 horas.',
    valores: [
      { campo: 'Colesterol Total', minimo: 0, maximo: 190, unidade: 'mg/dL' },
    ],
  },
  {
    codigo: 'HDL',
    nome: 'Colesterol HDL',
    sigtap: '0202010279',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático colorimétrico',
    prazoHoras: 24,
    instrucoes: 'Jejum de 12 horas.',
    valores: [
      { campo: 'HDL', minimo: 40, maximo: 999, unidade: 'mg/dL' },
    ],
  },
  {
    codigo: 'TRIG',
    nome: 'Triglicerídeos',
    sigtap: '0202010600',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático colorimétrico',
    prazoHoras: 24,
    instrucoes: 'Jejum de 12 horas.',
    valores: [
      { campo: 'Triglicerídeos', minimo: 0, maximo: 150, unidade: 'mg/dL' },
    ],
  },
  {
    codigo: 'UREIA',
    nome: 'Ureia',
    sigtap: '0202010619',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático UV',
    prazoHoras: 24,
    valores: [
      { campo: 'Ureia', minimo: 15, maximo: 45, unidade: 'mg/dL' },
    ],
  },
  {
    codigo: 'CREAT',
    nome: 'Creatinina',
    sigtap: '0202010287',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Cinético colorimétrico (Jaffé)',
    prazoHoras: 24,
    valores: [
      { campo: 'Creatinina', minimo: 0.6, maximo: 1.1, unidade: 'mg/dL', sexo: 'FEMININO' as const },
      { campo: 'Creatinina', minimo: 0.7, maximo: 1.3, unidade: 'mg/dL', sexo: 'MASCULINO' as const },
    ],
  },
  {
    codigo: 'TGO',
    nome: 'TGO / AST',
    sigtap: '0202010317',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Cinético UV',
    prazoHoras: 24,
    valores: [
      { campo: 'TGO/AST', minimo: 0, maximo: 35, unidade: 'U/L' },
    ],
  },
  {
    codigo: 'TGP',
    nome: 'TGP / ALT',
    sigtap: '0202010325',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Cinético UV',
    prazoHoras: 24,
    valores: [
      { campo: 'TGP/ALT', minimo: 0, maximo: 41, unidade: 'U/L' },
    ],
  },
  {
    codigo: 'ACURI',
    nome: 'Ácido Úrico',
    sigtap: '0202010260',
    material: 'Soro',
    categoria: CategoriaExame.BIOQUIMICA,
    metodo: 'Enzimático colorimétrico',
    prazoHoras: 24,
    valores: [
      { campo: 'Ácido Úrico', minimo: 2.4, maximo: 6.0, unidade: 'mg/dL', sexo: 'FEMININO' as const },
      { campo: 'Ácido Úrico', minimo: 3.4, maximo: 7.0, unidade: 'mg/dL', sexo: 'MASCULINO' as const },
    ],
  },

  // ─── URINÁLISE ─────────────────────────────────────────────
  {
    codigo: 'EAS',
    nome: 'Urina Tipo I (EAS)',
    sigtap: '0202050017',
    material: 'Urina (primeira da manhã)',
    categoria: CategoriaExame.URINANALISE,
    metodo: 'Tira reativa + Microscopia',
    prazoHoras: 24,
    instrucoes: 'Colher a primeira urina da manhã, jato médio, após higiene.',
    valores: [
      { campo: 'Densidade', minimo: 1.005, maximo: 1.030, unidade: '' },
      { campo: 'pH', minimo: 5.0, maximo: 7.0, unidade: '' },
      { campo: 'Proteínas', textoRef: 'Ausente', unidade: '' },
      { campo: 'Glicose', textoRef: 'Ausente', unidade: '' },
      { campo: 'Leucócitos', textoRef: 'Até 5 por campo', unidade: '/campo' },
    ],
  },

  // ─── MICROBIOLOGIA / PARASITOLOGIA ─────────────────────────
  {
    codigo: 'EPF',
    nome: 'Parasitológico de Fezes (EPF)',
    sigtap: '0202040038',
    material: 'Fezes',
    categoria: CategoriaExame.MICROBIOLOGIA,
    metodo: 'Hoffman / Sedimentação',
    prazoHoras: 48,
    instrucoes: 'Colher amostra em coletor limpo. Pode necessitar 3 amostras em dias alternados.',
    valores: [
      { campo: 'Resultado', textoRef: 'Ausência de parasitas', unidade: '' },
    ],
  },

  // ─── IMUNOLOGIA / SOROLOGIAS ───────────────────────────────
  {
    codigo: 'BHCG',
    nome: 'Beta HCG (Gravidez)',
    sigtap: '0202030334',
    material: 'Soro',
    categoria: CategoriaExame.IMUNOLOGIA,
    metodo: 'Quimioluminescência',
    prazoHoras: 24,
    valores: [
      { campo: 'Beta HCG', textoRef: 'Não reagente (< 5 mUI/mL)', unidade: 'mUI/mL' },
    ],
  },
  {
    codigo: 'HIV',
    nome: 'Anti-HIV (Teste Rápido)',
    sigtap: '0202030369',
    material: 'Sangue / Soro',
    categoria: CategoriaExame.SOROLOGIAS,
    metodo: 'Imunocromatografia',
    prazoHoras: 2,
    valores: [
      { campo: 'Resultado', textoRef: 'Não reagente', unidade: '' },
    ],
  },
  {
    codigo: 'VDRL',
    nome: 'VDRL (Sífilis)',
    sigtap: '0202031179',
    material: 'Soro',
    categoria: CategoriaExame.SOROLOGIAS,
    metodo: 'Floculação',
    prazoHoras: 24,
    valores: [
      { campo: 'Resultado', textoRef: 'Não reagente', unidade: '' },
    ],
  },

  // ─── HORMÔNIOS ─────────────────────────────────────────────
  {
    codigo: 'TSH',
    nome: 'TSH - Hormônio Tireoestimulante',
    sigtap: '0202060217',
    material: 'Soro',
    categoria: CategoriaExame.HORMONIOS,
    metodo: 'Quimioluminescência',
    prazoHoras: 48,
    valores: [
      { campo: 'TSH', minimo: 0.4, maximo: 4.0, unidade: 'µUI/mL' },
    ],
  },
  {
    codigo: 'T4L',
    nome: 'T4 Livre',
    sigtap: '0202060098',
    material: 'Soro',
    categoria: CategoriaExame.HORMONIOS,
    metodo: 'Quimioluminescência',
    prazoHoras: 48,
    valores: [
      { campo: 'T4 Livre', minimo: 0.7, maximo: 1.8, unidade: 'ng/dL' },
    ],
  },
];

/**
 * Função principal — popula o banco.
 */
async function main() {
  // Pega o laboratorioId do argumento da linha de comando
  const laboratorioId = process.argv[2];

  if (!laboratorioId) {
    console.error('❌ ERRO: informe o ID do laboratório.');
    console.error('   Uso: npx ts-node prisma/seed-exames.ts SEU_LAB_ID');
    console.error('   Pegue o ID com: SELECT id, nome FROM laboratorios;');
    process.exit(1);
  }

  // Confirma que o laboratório existe
  const lab = await prisma.laboratorio.findUnique({
    where: { id: laboratorioId },
  });
  if (!lab) {
    console.error(`❌ Laboratório ${laboratorioId} não encontrado.`);
    process.exit(1);
  }

  console.log(`🏥 Populando exames para: ${lab.nome}`);
  console.log('');

  let criados = 0;
  let pulados = 0;

  for (const exameData of CATALOGO_EXAMES) {
    const { valores, ...dadosExame } = exameData;

    // Verifica se o exame já existe (evita duplicar se rodar 2x)
    const existente = await prisma.exameCatalogo.findFirst({
      where: { laboratorioId, codigo: dadosExame.codigo },
    });

    if (existente) {
      console.log(`⏭️  ${dadosExame.nome} (já existe)`);
      pulados++;
      continue;
    }

    // Cria o exame + seus valores de referência
    await prisma.exameCatalogo.create({
      data: {
        ...dadosExame,
        laboratorioId,
        valoresRef: {
          create: valores.map((v) => ({
            campo: v.campo,
            minimo: 'minimo' in v ? v.minimo : null,
            maximo: 'maximo' in v ? v.maximo : null,
            textoRef: 'textoRef' in v ? v.textoRef : null,
            unidade: v.unidade,
            sexo: 'sexo' in v ? v.sexo : null,
            critico: 'critico' in v ? v.critico : false,
          })),
        },
      },
    });

    console.log(`✅ ${dadosExame.nome} (${valores.length} valores de ref.)`);
    criados++;
  }

  console.log('');
  console.log(`🎉 Concluído! ${criados} exames criados, ${pulados} já existiam.`);
}

main()
  .catch((e) => {
    console.error('Erro ao popular exames:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });