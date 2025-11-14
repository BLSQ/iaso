import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { PaginationParams } from 'Iaso/types/general';
import { formatParams } from 'Iaso/utils/requests';
import MESSAGES from '../messages';
import { Task } from '../types';

export type TasksGETParams = {
    params: Partial<PaginationParams> & {
        start_date: any;
        end_date: any;
        users: any;
        status: string;
    };
};

export const useGetTasks = ({
    params,
}: TasksGETParams): UseQueryResult<Task<any>, Error> => {
    const queryString = new URLSearchParams(formatParams(params)).toString();

    return useSnackQuery({
        queryKey: ['tasks', params],
        queryFn: () => getRequest(`/api/tasks/?${queryString}`),
        snackErrorMsg: MESSAGES.fetchTasksError,
        options: {
            retry: false,
            keepPreviousData: true,
        },
    });
};
