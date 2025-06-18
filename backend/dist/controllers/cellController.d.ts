import { Request, Response } from 'express';
export declare const updateCell: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCell: (req: Request, res: Response) => Promise<void>;
export declare const getCellHistory: (req: Request, res: Response) => Promise<void>;
export declare const formatCells: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
