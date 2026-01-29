import { Application, Router } from 'express';

declare module 'express-ws' {
  interface ExpressWs {
    (app: Application): Application & { ws: any };
    (router: Router): Router & { ws: any };
  }
  
  const expressWs: ExpressWs;
  export default expressWs;
}

declare module 'express' {
  interface Router {
    ws?: (path: string, handler: (ws: any, req: any) => void) => void;
  }
}


