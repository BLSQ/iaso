import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { ASSIGNMENTS_API_URL } from '../../../constants';
import { Assignment } from './types';

export const useAssignments = (
    planningId: string,
): UseQueryResult<Assignment[]> =>
    useSnackQuery({
        queryKey: ['planningAssignments', planningId],
        queryFn: () =>
            getRequest(
                makeUrlWithParams(ASSIGNMENTS_API_URL, {
                    planning: planningId,
                }),
            ),
        options: { enabled: Boolean(planningId) },
    });
