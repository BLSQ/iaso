export type PostArg = {
    url: string;
    data: Record<string, any>;
    fileData?: Record<string, Blob | Blob[]>;
    signal?: AbortSignal | null;
};
