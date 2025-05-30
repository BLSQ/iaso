import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { getRequest } from '../../../../../libs/Api';
import { Instance } from '../../../../instances/types/instance';

type QueryParams = {
    entityId?: string;
};
type QueryResult = {
    instances: Instance[];
};

export const useGetInstancesForEntity = ({
    entityId,
}: QueryParams): UseQueryResult<QueryResult, any> => {
    const params: {
        order: string;
        entityId?: string;
        with_descriptor?: 'true' | 'false';
    } = {
        order: 'source_created_at',
        with_descriptor: 'true',
    };
    if (entityId) {
        params.entityId = entityId;
    }

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['instances', params],
        () => getRequest(`/api/instances/?${queryString.toString()}`),
        undefined,
        { enabled: Boolean(entityId) },
    );
};
