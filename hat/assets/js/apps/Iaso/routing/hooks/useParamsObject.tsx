import { useParamsObject as useLibraryParams } from 'bluesquare-components';
import { useParamsConfig } from '../routing';

export const useParamsObject = (
    baseUrl: string,
): Record<string, string | Record<string, unknown> | undefined> => {
    const configs = useParamsConfig();
    return useLibraryParams(baseUrl, configs);
};
