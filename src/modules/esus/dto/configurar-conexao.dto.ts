import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * ConfigurarConexaoDto
 *
 * Dados que o admin envia para configurar a conexão e-SUS.
 * As credenciais (host, usuario, senha) chegam em texto puro
 * e são criptografadas no service antes de salvar no banco.
 */
export class ConfigurarConexaoDto {
  @IsString()
  @IsNotEmpty({ message: 'Host é obrigatório (ex: 192.168.1.100)' })
  @MaxLength(255)
  host: string;

  @IsString()
  @IsNotEmpty({ message: 'Usuário do banco e-SUS é obrigatório' })
  @MaxLength(100)
  usuario: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha do banco e-SUS é obrigatória' })
  @MaxLength(255)
  senha: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535, { message: 'Porta inválida' })
  porta?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  banco?: string;
}
