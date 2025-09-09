import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { File, ShortFile } from '../../instances/types/instance';

const getFiles = params => {
    const queryString = new URLSearchParams({
        ...params,
        image_only: 'true',
    }).toString();
    return getRequest(`/api/instances/attachments/?${queryString}`);
};

export const useGetImages = (params): UseQueryResult<ShortFile[], Error> => {
    return useSnackQuery({
        queryKey: ['files', params],
        queryFn: () => getFiles(params),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
            select: data => {
                return data.map((file: File) => ({
                    itemId: file.id,
                    createdAt: file.created_at,
                    path: file.file,
                    file_type: file.file_type,
                }));
            },
        },
    });
};
