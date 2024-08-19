import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export type Config = {
    host: string;
    slug: string;
    whitelist: { fields: any[] };
    account: number;
    root_orgunit: number;
    source_version: number;
    data_source: number;
    app_id: string;
};

export const useGetRegistryConfig = (
    registrySlug: string,
): UseQueryResult<Config, Error> => {
    const url = `/api/public/registry/config/?registry_slug=${registrySlug}`;
    return useSnackQuery({
        queryKey: ['registry-config', registrySlug],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            enabled: Boolean(registrySlug),
        },
    });
};
