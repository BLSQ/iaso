import React, { useCallback } from 'react';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import PublicIcon from '@mui/icons-material/Public';
import { CsvSvg, ExcellSvg, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { DownloadFormat, DownloadOption } from '../types';

/** the usual formats, with their label and icon */
export const useDownloadOption = (): ((
    format: DownloadFormat,
    url: string,
) => DownloadOption) => {
    const { formatMessage } = useSafeIntl();
    return useCallback(
        (format: DownloadFormat, url: string) => {
            switch (format) {
                case 'csv':
                    return { key: format, url, label: 'CSV', icon: <CsvSvg /> };
                case 'xlsx':
                    return {
                        key: format,
                        url,
                        label: 'XLSX',
                        icon: <ExcellSvg />,
                    };
                case 'gpkg':
                    return {
                        key: format,
                        url,
                        label: 'GPKG',
                        icon: <PublicIcon />,
                    };
                case 'parquet':
                    return {
                        key: format,
                        url,
                        label: 'Parquet',
                        icon: <DatasetOutlinedIcon />,
                    };
                case 'parquet_simplified_geom':
                    return {
                        key: format,
                        url,
                        extension: 'parquet',
                        label: formatMessage(MESSAGES.parquetSimplifiedGeom),
                        icon: <DatasetOutlinedIcon />,
                    };
                default:
                    throw new Error(`Unknown download format ${format}`);
            }
        },
        [formatMessage],
    );
};
