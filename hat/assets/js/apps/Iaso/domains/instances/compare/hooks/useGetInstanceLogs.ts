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

// const getFormVersion = versionId => {
//     console.log('version id', versionId);
//     return getRequest(`/api/formVersions/${versionId}/?fields=descriptor`);
// };

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
                    data = data.new_value[0].json;
                    return data;
                }

                return undefined;
            },
        },
    );
};

// export const useGetFormVersion = (
//     formVersionId: string | undefined,
// ): UseQueryResult<FormDescritor, Error> => {
//     const queryKey: any[] = ['instanceLogDetail', formVersionId];
//     // @ts-ignore
//     return useSnackQuery(
//         queryKey,
//         () => getFormVersion(formVersionId),
//         undefined,
//         {
//             enabled: Boolean(formVersionId),
//             select: (data: FormDescriptor | undefined) => {
//                 if (data) {
//                     return data;
//                 }

//                 return undefined;
//             },
//         },
//     );
// };
