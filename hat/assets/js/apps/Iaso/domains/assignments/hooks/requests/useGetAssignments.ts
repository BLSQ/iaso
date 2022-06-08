import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { AssignmentParams, AssignmentApi } from '../../types/assigment';

const getAssignments = async (
    options: AssignmentParams,
): Promise<AssignmentApi[]> => {
    const url = makeUrlWithParams('/api/microplanning/assignments', options);
    return getRequest(url) as Promise<AssignmentApi[]>;
};

export const useGetAssignments = (
    options: AssignmentParams,
): UseQueryResult<AssignmentApi[], Error> => {
    const queryKey: any[] = ['assignmentsList', options];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getAssignments(options));
};
