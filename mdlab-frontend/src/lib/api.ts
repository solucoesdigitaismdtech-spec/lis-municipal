/**
 * api.ts — Camada de comunicação com o backend MD Lab.
 *
 * Centraliza todas as chamadas à API. Cuida de:
 *  - Anexar o token JWT automaticamente
 *  - Tratar erros de forma consistente
 *  - Renovar o token quando expira (refresh)
 */

const API_BASE = '/api';

// ─── Gerenciamento de token (localStorage) ──────────────────────

export const tokenStorage = {
  getAccess: () => typeof window !== 'undefined' ? localStorage.getItem('mdlab_access') : null,
  getRefresh: () => typeof window !== 'undefined' ? localStorage.getItem('mdlab_refresh') : null,
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('mdlab_user');
    return u ? JSON.parse(u) : null;
  },
  set: (access: string, refresh: string, user: any) => {
    localStorage.setItem('mdlab_access', access);
    localStorage.setItem('mdlab_refresh', refresh);
    localStorage.setItem('mdlab_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('mdlab_access');
    localStorage.removeItem('mdlab_refresh');
    localStorage.removeItem('mdlab_user');
  },
};

// ─── Função central de requisição ───────────────────────────────

interface RequestOptions {
  method?: string;
  body?: any;
  auth?: boolean; // se true, anexa o token
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token expirou — tenta renovar uma vez
  if (resp.status === 401 && auth) {
    const renovou = await tentarRenovarToken();
    if (renovou) {
      // Refaz a requisição com o token novo
      headers['Authorization'] = `Bearer ${tokenStorage.getAccess()}`;
      const resp2 = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!resp2.ok) throw await montarErro(resp2);
      return resp2.json();
    } else {
      // Não conseguiu renovar — desloga
      tokenStorage.clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
  }

  if (!resp.ok) throw await montarErro(resp);

  // Algumas respostas podem não ter corpo JSON
  const texto = await resp.text();
  return texto ? JSON.parse(texto) : ({} as T);
}

async function montarErro(resp: Response): Promise<Error> {
  try {
    const dados = await resp.json();
    return new Error(dados.message || `Erro ${resp.status}`);
  } catch {
    return new Error(`Erro ${resp.status}`);
  }
}

async function tentarRenovarToken(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  try {
    const resp = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!resp.ok) return false;

    const dados = await resp.json();
    const user = tokenStorage.getUser();
    tokenStorage.set(dados.accessToken, dados.refreshToken || refresh, user);
    return true;
  } catch {
    return false;
  }
}

// ─── Funções específicas ────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
};

// ─── APIs do dashboard ──────────────────────────────────────────

export const ordensApi = {
  // Lista de ordens (com filtro opcional de status, paginação)
  listar: (params?: string) =>
    apiRequest(`/ordens${params ? `?${params}` : ''}`),
};

export const resultadosApi = {
  // Fila de digitação (técnico)
  pendentes: () => apiRequest('/resultados/pendentes'),
  // Fila de validação (biomédico)
  aguardandoValidacao: () => apiRequest('/resultados/aguardando-validacao'),
  // Detalhe de uma OS para digitar/validar (com valores de referência)
  detalheOrdem: (ordemId: string) => apiRequest(`/resultados/ordem/${ordemId}`),
  // Digitar resultado de um item (técnico)
  digitar: (itemId: string, dados: any) =>
    apiRequest(`/resultados/${itemId}/digitar`, { method: 'POST', body: dados }),
  // Validar resultado digitado (biomédico) — etapa 1
  validar: (itemId: string) =>
    apiRequest(`/resultados/${itemId}/validar`, { method: 'PATCH' }),
  // Assinar/liberar resultado validado (biomédico) — etapa 2 (final)
  assinar: (itemId: string, parecerTecnico?: string) =>
    apiRequest(`/resultados/${itemId}/assinar`, { method: 'PATCH', body: { parecerTecnico } }),
};

// ─── API de Pacientes ───────────────────────────────────────────

export const pacientesApi = {
  listar: (busca?: string, pagina = 1, limite = 20) =>
    apiRequest(`/pacientes?pagina=${pagina}&limite=${limite}${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`),
  buscarCpf: (cpf: string) =>
    apiRequest(`/pacientes/buscar-cpf/${cpf.replace(/\D/g, '')}`),
  criar: (dados: any) =>
    apiRequest('/pacientes', { method: 'POST', body: dados }),
};

export const unidadesApi = {
  listar: () => apiRequest('/unidades'),
  detalhar: (id: string) => apiRequest(`/unidades/${id}`),
  criar: (dados: any) => apiRequest('/unidades', { method: 'POST', body: dados }),
  editar: (id: string, dados: any) => apiRequest(`/unidades/${id}`, { method: 'PATCH', body: dados }),
  toggleAtiva: (id: string, ativa: boolean) =>
    apiRequest(`/unidades/${id}/toggle-active`, { method: 'PATCH', body: { ativa } }),
};

// ─── API de Usuários ────────────────────────────────────────────
export const usersApi = {
  listar: () => apiRequest('/users'),
  criar: (dados: any) => apiRequest('/users', { method: 'POST', body: dados }),
  toggleAtivo: (id: string, active: boolean) =>
    apiRequest(`/users/${id}/toggle-active`, { method: 'PATCH', body: { active } }),
};

// ─── API de Laboratório ─────────────────────────────────────────
export const laboratoriosApi = {
  meu: () => apiRequest('/laboratorios/meu'),
  editar: (id: string, dados: any) => apiRequest(`/laboratorios/${id}`, { method: 'PATCH', body: dados }),
};

// ─── API de Integração e-SUS ────────────────────────────────────
export const esusApi = {
  // Salva credenciais (criptografadas no backend) e testa ao salvar
  configurar: (dados: any) => apiRequest('/esus/conexao', { method: 'POST', body: dados }),
  // Status da conexão (sem expor credenciais)
  status: () => apiRequest('/esus/conexao/status'),
  // Re-testa a conexão já cadastrada
  testar: () => apiRequest('/esus/conexao/testar', { method: 'POST' }),
  // Busca paciente no e-SUS pelo CPF
  buscarPaciente: (cpf: string) => apiRequest(`/esus/buscar/${cpf.replace(/\D/g, '')}`),
};

// Editar paciente e buscar por id (adicionado para edição)
Object.assign(pacientesApi, {
  detalhar: (id: string) => apiRequest(`/pacientes/${id}`),
  editar: (id: string, dados: any) => apiRequest(`/pacientes/${id}`, { method: 'PATCH', body: dados }),
});

// ─── API de Exames (catálogo, para selecionar na OS) ────────────
export const examesApi = {
  listar: (busca?: string, categoria?: string) => {
    const p = new URLSearchParams();
    if (busca) p.set('busca', busca);
    if (categoria) p.set('categoria', categoria);
    const qs = p.toString();
    return apiRequest(`/exames${qs ? `?${qs}` : ''}`);
  },
  detalhar: (id: string) => apiRequest(`/exames/${id}`),
  criar: (dados: any) => apiRequest('/exames', { method: 'POST', body: dados }),
  editar: (id: string, dados: any) => apiRequest(`/exames/${id}`, { method: 'PATCH', body: dados }),
  remover: (id: string) => apiRequest(`/exames/${id}`, { method: 'DELETE' }),
  addValorRef: (exameId: string, dados: any) =>
    apiRequest(`/exames/${exameId}/valores-referencia`, { method: 'POST', body: dados }),
  removerValorRef: (exameId: string, valorId: string) =>
    apiRequest(`/exames/${exameId}/valores-referencia/${valorId}`, { method: 'DELETE' }),
};

// ─── Ordens: ações de agenda e coleta ───────────────────────────
Object.assign(ordensApi, {
  detalhar: (id: string) => apiRequest(`/ordens/${id}`),
  criar: (dados: any) => apiRequest('/ordens', { method: 'POST', body: dados }),
  coletarItem: (ordemId: string, itemId: string) =>
    apiRequest(`/ordens/${ordemId}/itens/${itemId}/coletar`, { method: 'PATCH' }),
  coletarTudo: (ordemId: string) =>
    apiRequest(`/ordens/${ordemId}/coletar-tudo`, { method: 'PATCH' }),
});

// Editar exames de uma OS (adicionado para correção de lançamento)
Object.assign(ordensApi, {
  adicionarItem: (ordemId: string, exameId: string) =>
    apiRequest(`/ordens/${ordemId}/itens`, { method: 'POST', body: { exameId } }),
  removerItem: (ordemId: string, itemId: string) =>
    apiRequest(`/ordens/${ordemId}/itens/${itemId}`, { method: 'DELETE' }),
  // Gera/abre o PDF do comprovante de atendimento (com QR do portal)
  comprovante: (ordemId: string) => baixarPdfComToken(`/api/ordens/${ordemId}/comprovante`, `comprovante-${ordemId}.pdf`),
});

// ─── API de Laudos ──────────────────────────────────────────────
export const laudosApi = {
  listar: () => apiRequest('/laudos'),
  dados: (ordemId: string) => apiRequest(`/laudos/ordem/${ordemId}`),
  gerar: (ordemId: string) => apiRequest(`/laudos/ordem/${ordemId}/gerar`, { method: 'POST' }),
  // Verificação pública (sem token) — usa fetch direto
  verificar: (hash: string) => apiRequest(`/publico/laudos/verificar/${hash}`, { auth: false }),
};

// ─── API do Mapa de Trabalho (gera PDF no backend) ──────────────
// As rotas devolvem um arquivo PDF, então baixamos via fetch com token.
async function baixarPdfComToken(url: string, nomeArquivo: string, opcoes?: { method?: string; body?: any }) {
  const token = tokenStorage.getAccess();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const init: RequestInit = { method: opcoes?.method || 'GET', headers };
  if (opcoes?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opcoes.body);
  }
  const resp = await fetch(url, init);
  if (!resp.ok) {
    // tenta ler mensagem de erro do backend
    let msg = 'Falha ao gerar o PDF.';
    try { const j = await resp.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  window.open(objUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
}

export const mapaTrabalhoApi = {
  porOrdem: (ordemId: string) => baixarPdfComToken(`/api/mapa-trabalho/ordem/${ordemId}`, `mapa-${ordemId}.pdf`),
  doDia: (data?: string) => baixarPdfComToken(`/api/mapa-trabalho/dia${data ? `?data=${data}` : ''}`, `mapa-dia.pdf`),
  lote: (ordemIds: string[]) => baixarPdfComToken('/api/mapa-trabalho/lote', 'mapa-lote.pdf', { method: 'POST', body: { ordemIds } }),
};

// ─── API do Portal do Paciente (público, sem login) ─────────────
export const portalApi = {
  consultar: (protocolo: string, nascimento: string) =>
    apiRequest(`/portal/consultar?protocolo=${encodeURIComponent(protocolo)}&nascimento=${nascimento}`, { auth: false }),
  // Baixa o PDF do laudo pelo hash (rota pública, sem token)
  baixarLaudo: (hash: string) => {
    window.open(`/api/publico/laudos/${hash}/pdf`, '_blank');
  },
};

// ─── API de Relatórios ──────────────────────────────────────────
function qsPeriodo(inicio?: string, fim?: string) {
  const p = new URLSearchParams();
  if (inicio) p.set('inicio', inicio);
  if (fim) p.set('fim', fim);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const relatoriosApi = {
  resumo: (inicio?: string, fim?: string) => apiRequest(`/relatorios/resumo${qsPeriodo(inicio, fim)}`),
  producao: (inicio?: string, fim?: string) => apiRequest(`/relatorios/producao${qsPeriodo(inicio, fim)}`),
  examesMaisSolicitados: (inicio?: string, fim?: string) => apiRequest(`/relatorios/exames-mais-solicitados${qsPeriodo(inicio, fim)}`),
  produtividade: (inicio?: string, fim?: string) => apiRequest(`/relatorios/produtividade${qsPeriodo(inicio, fim)}`),
  detalhado: (inicio?: string, fim?: string) => apiRequest(`/relatorios/detalhado${qsPeriodo(inicio, fim)}`),
  // Exportações em PDF (abrem em nova aba com token)
  pdfGeral: (inicio?: string, fim?: string) => baixarPdfComToken(`/api/relatorios/pdf${qsPeriodo(inicio, fim)}`, 'relatorio-geral.pdf'),
  pdfTipo: (tipo: string, inicio?: string, fim?: string) => baixarPdfComToken(`/api/relatorios/pdf/${tipo}${qsPeriodo(inicio, fim)}`, `relatorio-${tipo}.pdf`),
};
