import { Request, Response } from 'express';
export declare const createUserGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getGroups: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addUsersToGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeUsersFromGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const setGroupSheetAccess: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
