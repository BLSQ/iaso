/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getTeams = (): Promise<any> => {
    return getRequest('/api/microplanning/teams/');
};

export const useGetTeams = (): UseQueryResult<any, Error> => {
    const queryKey: any[] = ['teams'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(), undefined);
};
