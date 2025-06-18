import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const me: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const inviteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const activateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
