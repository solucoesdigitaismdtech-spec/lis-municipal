"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarCpf = normalizarCpf;
exports.validarCpf = validarCpf;
exports.formatarCpf = formatarCpf;
exports.mascararCpf = mascararCpf;
function normalizarCpf(cpf) {
    return cpf.replace(/\D/g, '');
}
function validarCpf(cpf) {
    const cpfLimpo = normalizarCpf(cpf);
    if (cpfLimpo.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo))
        return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11)
        resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9)))
        return false;
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11)
        resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10)))
        return false;
    return true;
}
function formatarCpf(cpf) {
    const limpo = normalizarCpf(cpf);
    if (limpo.length !== 11)
        return cpf;
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function mascararCpf(cpf) {
    const limpo = normalizarCpf(cpf);
    if (limpo.length !== 11)
        return '***.***.***-**';
    return `${limpo.slice(0, 3)}.***.**${limpo.slice(8, 9)}-${limpo.slice(9)}`;
}
//# sourceMappingURL=cpf.util.js.map