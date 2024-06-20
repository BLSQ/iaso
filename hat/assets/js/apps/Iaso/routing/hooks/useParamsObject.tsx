import { useParamsObject as useLibraryParams } from 'bluesquare-components';
import { useParamsConfig } from '../routing';

/**
 * @description a wrapper to the hook from bluesquare-components. It passes the configs from iaso to the library hook, so it can be used in iaso by only passing the url
 * @param baseUrl the url of which the params should be retrieved
 * @returns a dictionary with all the params values as strings, so `array` and `object` params may require additional parsing
 */

export type ParamsWithAccountId = { accountId: string } & Record<
    string,
    string
>;

export const useParamsObject = (baseUrl: string): ParamsWithAccountId => {
    const configs = useParamsConfig();
    return useLibraryParams(baseUrl, configs) as ParamsWithAccountId;
};
