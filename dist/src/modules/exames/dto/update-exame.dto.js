"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExameDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_exame_dto_1 = require("./create-exame.dto");
class UpdateExameDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_exame_dto_1.CreateExameDto, ['codigo'])) {
}
exports.UpdateExameDto = UpdateExameDto;
//# sourceMappingURL=update-exame.dto.js.map