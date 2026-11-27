export type StatsAsset = {
    name: string;
    path: string;
    publicPath?: string;
};

export type ViteManifestChunk = {
    file: string;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
    isEntry?: boolean;
};