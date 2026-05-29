"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLaboratorioDto = void 0;
const class_validator_1 = require("class-validator");
class CreateLaboratorioDto {
    nome;
    cnes;
    municipio;
    uf;
    cnpj;
    responsavelTecnico;
    crbm;
}
exports.CreateLaboratorioDto = CreateLaboratorioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome do laboratório é obrigatório' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'CNES é obrigatório' }),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'CNES deve ter 7 dígitos numéricos' }),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "cnes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Município é obrigatório' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "municipio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2, { message: 'UF deve ter exatamente 2 letras (ex: PB)' }),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "uf", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos' }),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "responsavelTecnico", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateLaboratorioDto.prototype, "crbm", void 0);
//# sourceMappingURL=create-laboratorio.dto.js.map