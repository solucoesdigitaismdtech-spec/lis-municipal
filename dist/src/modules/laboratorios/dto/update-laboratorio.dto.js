"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLaboratorioDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_laboratorio_dto_1 = require("./create-laboratorio.dto");
class UpdateLaboratorioDto extends (0, mapped_types_1.PartialType)(create_laboratorio_dto_1.CreateLaboratorioDto) {
}
exports.UpdateLaboratorioDto = UpdateLaboratorioDto;
//# sourceMappingURL=update-laboratorio.dto.js.map