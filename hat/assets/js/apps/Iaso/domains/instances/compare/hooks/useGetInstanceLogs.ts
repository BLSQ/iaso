/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Instance, InstanceLog, InstanceLogData } from '../../types/instance';

const getInstanceLog = (instanceId: string | undefined): Promise<Instance> => {
    return getRequest(`/api/logs/?objectId=${instanceId}&order=-created_at`);
};

const getInstanceLogDetail = (
    logId: string | undefined,
): Promise<InstanceLogData> => {
    console.log('logId', logId);
    return getRequest(`/api/logs/${logId}`);
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

export const useGetInstanceLogDetail = (
    logId: string | undefined,
): UseQueryResult<InstanceLogData, Error> => {
    const queryKey: any[] = ['instanceLogDetail', logId];
    // @ts-ignore
    return useSnackQuery(
        queryKey,
        () => getInstanceLogDetail(logId),
        undefined,
        {
            enabled: Boolean(logId),
            select: (data: InstanceLog | undefined) => {
                if (data) {
                    return data.new_value[0].fields.json;
                }

                return undefined;
            },
        },
    );
};
