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
exports.CreateUnidadeDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateUnidadeDto {
    nome;
    cnes;
    endereco;
    tipo;
}
exports.CreateUnidadeDto = CreateUnidadeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome da unidade é obrigatório' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateUnidadeDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'CNES deve ter 7 dígitos numéricos' }),
    __metadata("design:type", String)
], CreateUnidadeDto.prototype, "cnes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateUnidadeDto.prototype, "endereco", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TipoUnidade, {
        message: 'Tipo inválido. Use: UBS, UPA, HOSPITAL, POSTO_SAUDE ou LABORATORIO',
    }),
    __metadata("design:type", String)
], CreateUnidadeDto.prototype, "tipo", void 0);
//# sourceMappingURL=create-unidade.dto.js.map