import type { Response } from 'express';
import { MapaTrabalhoService } from './mapa-trabalho.service';
export declare class MapaTrabalhoController {
    private readonly mapaService;
    constructor(mapaService: MapaTrabalhoService);
    porOrdem(ordemId: string, laboratorioId: string, res: Response): Promise<void>;
    doDia(laboratorioId: string, res: Response, data?: string): Promise<void>;
}
