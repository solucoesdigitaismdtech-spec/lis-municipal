import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * CryptoService
 *
 * Responsável por toda criptografia do sistema.
 * Usado para proteger:
 *   - Credenciais de conexão e-SUS (host, usuário, senha)
 *   - CPF dos pacientes (LGPD)
 *   - Nome da mãe dos pacientes (LGPD)
 *   - Segredo 2FA dos usuários
 *
 * Algoritmo: AES-256-GCM
 *   - AES-256: chave de 256 bits (32 bytes) — padrão militar
 *   - GCM: modo que garante confidencialidade + autenticidade
 *     (detecta se alguém tentou adulterar o dado criptografado)
 *
 * A ENCRYPTION_KEY fica no .env e NUNCA vai para o banco.
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm = 'aes-256-gcm';

  // Tamanhos fixos do algoritmo AES-256-GCM
  private readonly IV_LENGTH = 16;   // Vetor de inicialização: 16 bytes
  private readonly TAG_LENGTH = 16;  // Tag de autenticação: 16 bytes

  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');

    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY não definida no .env!');
    }

    if (keyHex.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes). ' +
        'Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }

    // Converte a chave hex para Buffer de 32 bytes
    this.encryptionKey = Buffer.from(keyHex, 'hex');
    this.logger.log('🔐 CryptoService inicializado com sucesso');
  }

  /**
   * Criptografa um texto.
   *
   * Retorna uma string no formato: IV:TAG:DADO_CRIPTOGRAFADO
   * Todos em hexadecimal, separados por ":"
   *
   * O IV é gerado aleatoriamente a cada chamada — isso significa
   * que criptografar o mesmo texto duas vezes gera resultados
   * diferentes, o que é correto e seguro.
   *
   * @param text — texto puro a ser criptografado
   * @returns string criptografada para salvar no banco
   */
  encrypt(text: string): string {
    if (!text) return text;

    try {
      // Gera um IV aleatório único para cada operação
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Cria o cipher com a chave mestra e o IV único
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Criptografa o texto
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);

      // Tag de autenticação — garante integridade do dado
      const tag = cipher.getAuthTag();

      // Retorna tudo junto separado por ":" para salvar no banco
      // Formato: IV:TAG:DADO_CRIPTOGRAFADO (tudo em hex)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      this.logger.error('Erro ao criptografar dado', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografa um texto previamente criptografado por encrypt().
   *
   * @param encryptedText — string no formato IV:TAG:DADO (vinda do banco)
   * @returns texto original em claro
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      // Separa as três partes: IV, TAG e dado criptografado
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Formato inválido de dado criptografado');
      }

      const [ivHex, tagHex, encryptedHex] = parts;

      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      // Cria o decipher com a mesma chave e o IV original
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Define a tag de autenticação — se o dado foi adulterado,
      // isso vai lançar um erro antes de descriptografar
      decipher.setAuthTag(tag);

      // Descriptografa
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Erro ao descriptografar dado', error);
      throw new Error('Falha na descriptografia — dado pode estar corrompido');
    }
  }

  /**
   * Gera um hash SHA-256 de um texto.
   *
   * Usado para:
   *   - Indexar CPF no banco sem guardar em texto puro
   *   - Hash de integridade do snapshot e-SUS
   *
   * Hash é IRREVERSÍVEL — não dá para obter o CPF original a partir dele.
   * Mas o mesmo CPF sempre gera o mesmo hash, permitindo busca.
   *
   * @param text — texto a ser transformado em hash
   * @returns hash SHA-256 em hexadecimal (64 caracteres)
   */
  hash(text: string): string {
    if (!text) return text;
    return crypto
      .createHash('sha256')
      .update(text.trim().toLowerCase())
      .digest('hex');
  }

  /**
   * Gera um hash SHA-256 de um objeto JSON.
   * Usado para garantir integridade do snapshot e-SUS.
   *
   * @param data — objeto a ser hasheado
   * @returns hash SHA-256 do JSON serializado
   */
  hashObject(data: object): string {
    const json = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Mascara um CPF para exibição.
   * Ex: "12345678900" → "***456789**"
   *
   * Nunca retorna o CPF completo pela API.
   */
  maskCpf(cpf: string): string {
    if (!cpf || cpf.length < 11) return '***.***.***-**';
    const digits = cpf.replace(/\D/g, '');
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
}
