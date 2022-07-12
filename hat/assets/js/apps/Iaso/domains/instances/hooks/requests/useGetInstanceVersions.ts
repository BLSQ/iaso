/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import moment from 'moment';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Instance } from '../../types/instances';

const getInstanceLog = (instanceId: string): Promise<Instance> => {
    return getRequest(`/api/logs/?objectId=${instanceId}`);
};
export const useGetInstanceLogs = (
    instanceId: string | undefined,
): UseQueryResult<Instance, Error> => {
    const queryKey: any[] = ['instanceLog', instanceId];
    // @ts-ignore
    return useSnackQuery(
        queryKey,
        () => getInstanceLog(instanceId),
        undefined,
        {
            enabled: Boolean(instanceId),
            select: data => {
                if (!data) return [];
                return data.map((instanceLog: Instance) => {
                    return {
                        value: instanceLog.id,
                        label: moment(instanceLog.created_at).format('LTS'),
                        original: instanceLog,
                    };
                });
            },
        },
    );
};
