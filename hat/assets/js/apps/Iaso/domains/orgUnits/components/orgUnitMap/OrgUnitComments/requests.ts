import { getRequest, postRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

export const useGetComments = params => {
    const { orgUnitId, offset, limit } = params;
    const url = offset
        ? `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}&offset=${offset}`
        : `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}`;

    return useSnackQuery(
        ['comments', params],
        async () => getRequest(url),
        undefined,
        { enabled: Boolean(orgUnitId) },
    );
};

export const sendComment = async comment =>
    postRequest('/api/comments/', comment);
