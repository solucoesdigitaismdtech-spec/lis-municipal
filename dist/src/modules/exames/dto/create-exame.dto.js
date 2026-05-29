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
exports.CreateExameDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateExameDto {
    codigo;
    nome;
    sigtap;
    metodo;
    material;
    categoria;
    prazoHoras;
    instrucoes;
}
exports.CreateExameDto = CreateExameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Código do exame é obrigatório' }),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateExameDto.prototype, "codigo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome do exame é obrigatório' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateExameDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateExameDto.prototype, "sigtap", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateExameDto.prototype, "metodo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Material biológico é obrigatório (ex: Sangue)' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateExameDto.prototype, "material", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CategoriaExame, {
        message: 'Categoria inválida. Ex: HEMATOLOGIA, BIOQUIMICA, URINANALISE...',
    }),
    __metadata("design:type", String)
], CreateExameDto.prototype, "categoria", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateExameDto.prototype, "prazoHoras", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateExameDto.prototype, "instrucoes", void 0);
//# sourceMappingURL=create-exame.dto.js.map