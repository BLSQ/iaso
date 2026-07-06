import type { ApiApiImportListParams } from 'Iaso/api/apiImports';
import { Params } from 'Iaso/domains/apiimports/types/filters';

export const paramsToApiParams = (params: Params): ApiApiImportListParams => {
    return {
        order: params.order || '-created_at',
        import_type: params.importType,
        has_problem: params.hasProblem,
        app_id: params.appId,
        app_version: params.appVersion,
        from_date: params.fromDate,
        to_date: params.toDate,
        user_id: params.userId,
        limit: params.pageSize || 10,
        page: params.page || 1,
    };
};
