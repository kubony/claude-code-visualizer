import { Server } from 'http';
export interface ServerOptions {
    port: number;
    projectRoot: string;
    distDir: string;
    dataPath: string;
}
export interface ServerHandle {
    server: Server;
    forceShutdown: () => Promise<void>;
}
/**
 * Start the Express server for serving the visualizer webapp
 */
export declare function startServer(options: ServerOptions): Promise<ServerHandle>;
//# sourceMappingURL=server.d.ts.map