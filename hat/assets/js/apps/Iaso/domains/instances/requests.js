import snackMessages from '../../components/snackBars/messages';
import { getRequest } from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';
import { getFileUrl, getFileCountUrl } from './utils';

export const fetchFormDetailsForInstance = formId =>
    getRequest(
        `/api/forms/${formId}/?fields=name,period_type,label_keys,id,org_unit_type_ids`,
    );

export const fetchInstancesAsDict = url => getRequest(url);

export const fetchInstancesAsSmallDict = url => getRequest(url);

export const useGetInstancesFiles = (params, rowsPerPage, page, type) =>
    useSnackQuery(
        ['instances', 'files', params, type],
        () => getRequest(getFileUrl(params, rowsPerPage, page, type)),
        snackMessages.fetchInstanceLocationError,
        {
            // enabled: params.tab === 'files',
            select: data => {
                // Django pagination start at 1 but Material UI at 0
                if (page !== data.page - 1) {
                    console.warn(`Possible error in page handling`);
                }
                return {
                    count: data.count,
                    page: data.page,
                    limit: data.limit,
                    // Respect the format used in InstancesFilesList
                    results: data.results.map(instanceFile => ({
                        itemId: instanceFile.instance_id,
                        createdAt: instanceFile.created_at,
                        path: instanceFile.file,
                    })),
                };
            },
        },
    );

export const useGetInstancesFilesCount = params =>
    useSnackQuery({
        queryKey: ['instances', 'files', 'count', params],
        queryFn: () => getRequest(getFileCountUrl(params)),
        snackMessage: snackMessages.fetchInstanceLocationError,
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
