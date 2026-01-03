import { Server } from 'http';
export interface ServerOptions {
    port: number;
    projectRoot: string;
    distDir: string;
    dataPath: string;
}
/**
 * Start the Express server for serving the visualizer webapp
 */
export declare function startServer(options: ServerOptions): Promise<Server>;
//# sourceMappingURL=server.d.ts.map