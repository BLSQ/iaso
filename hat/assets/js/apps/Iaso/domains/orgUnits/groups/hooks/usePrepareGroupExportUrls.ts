import { useMemo } from 'react';
import { getTableUrl } from 'bluesquare-components';
import { EXPORT_GROUPS_BASE_URL } from 'Iaso/domains/orgUnits/groups/constants';

type Params = {
    page?: string;
    search?: string;
    dataSource?: string;
    version?: string;
    project_ids?: string;
    accountId: string;
};

export const usePrepareGroupExportUrls = (params: Params) => {
    return useMemo(() => {
        const baseParams = {
            data_source_id: params.dataSource,
            project_ids: params.project_ids,
            search: params.search,
            source_version_id: params.version,
        };

        return {
            csvUrl: getTableUrl(EXPORT_GROUPS_BASE_URL, { ...baseParams, file_format: 'csv' }),
            xlsxUrl: getTableUrl(EXPORT_GROUPS_BASE_URL, { ...baseParams, file_format: 'xlsx' }),
        };
    }, [params.dataSource, params.project_ids, params.search, params.version]);
};
