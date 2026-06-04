/**
 * Utilitário de validação e normalização de CPF.
 *
 * O CPF brasileiro tem 11 dígitos com 2 dígitos verificadores.
 * Essas funções garantem que só CPFs válidos entrem no sistema.
 */

/**
 * Remove tudo que não é número.
 * "123.456.789-00" → "12345678900"
 */
export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida um CPF brasileiro usando o algoritmo dos dígitos verificadores.
 *
 * @param cpf — CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCpf(cpf: string): boolean {
  const cpfLimpo = normalizarCpf(cpf);

  // Precisa ter exatamente 11 dígitos
  if (cpfLimpo.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  // São matematicamente válidos mas inexistentes na prática
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

  return true;
}

/**
 * Formata um CPF para exibição.
 * "12345678900" → "123.456.789-00"
 */
export function formatarCpf(cpf: string): string {
  const limpo = normalizarCpf(cpf);
  if (limpo.length !== 11) return cpf;
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Mascara um CPF para exibição parcial (LGPD).
 * "12345678900" → "123.***.**9-00" (mostra início e fim)
 */
export function mascararCpf(cpf: string): string {
  const limpo = normalizarCpf(cpf);
  if (limpo.length !== 11) return '***.***.***-**';
  return `${limpo.slice(0, 3)}.***.**${limpo.slice(8, 9)}-${limpo.slice(9)}`;
}
