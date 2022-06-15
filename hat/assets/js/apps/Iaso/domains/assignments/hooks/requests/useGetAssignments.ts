import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { AssignmentApi } from '../../types/assigment';

type Option = {
    planningId: string;
};

const getAssignments = async (options: Option): Promise<AssignmentApi[]> => {
    const url = makeUrlWithParams('/api/microplanning/assignments', options);
    return getRequest(url) as Promise<AssignmentApi[]>;
};

export const useGetAssignments = (
    options: Option,
): UseQueryResult<AssignmentApi[], Error> => {
    const queryKey: any[] = ['assignmentsList'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getAssignments(options));
};
