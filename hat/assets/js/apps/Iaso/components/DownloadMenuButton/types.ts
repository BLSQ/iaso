import { ReactNode } from 'react';

export type DownloadOption = {
    // also used as the extension of the file when the server doesn't name it
    key: string;
    label: string;
    url: string;
    icon?: ReactNode;
    // extension of the file when different from the key (ex: several parquet options)
    extension?: string;
};

export type DownloadFormat =
    | 'csv'
    | 'xlsx'
    | 'gpkg'
    | 'parquet'
    | 'parquet_simplified_geom';
