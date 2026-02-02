import { Application, Router } from 'express';

declare module 'express-ws' {
  interface ExpressWs {
    (app: Application): Application & { ws: (path: string, handler: (ws: any, req: any) => void) => void };
    (router: Router): Router & { ws: (path: string, handler: (ws: any, req: any) => void) => void };
  }
  
  const expressWs: ExpressWs;
  export default expressWs;
}

declare module 'express' {
  interface Application {
    ws?: (path: string, handler: (ws: any, req: any) => void) => void;
  }
  
  interface Router {
    ws?: (path: string, handler: (ws: any, req: any) => void) => void;
  }
}


