/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import {
    Instance,
    InstanceLog,
    InstanceLogData,
    FormDescriptor,
} from '../../types/instance';

const getInstanceLog = (instanceId: string | undefined): Promise<Instance> => {
    return getRequest(`/api/logs/?objectId=${instanceId}&order=-created_at`);
};

const getInstanceLogDetail = (
    logId: string | undefined,
): Promise<InstanceLogData> => {
    return getRequest(`/api/logs/${logId}`);
};

const getFormId = formId => {
    // TO DO : add versionId in parameters waiting change in backend to filter on version_id
    // TO DO : replace call api below by : /api/formversions/?version_id=versionId&form_id=formID
    return getRequest(`/api/formversions/${formId}/?fields=descriptor`);
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
                    const instanceLogData = data.new_value[0].fields;

                    return instanceLogData;
                }

                return undefined;
            },
        },
    );
};

export const useGetFormDescriptor = (
    formId: number | undefined,
): UseQueryResult<FormDescriptor, Error> => {
    const queryKey: any[] = ['instanceDescriptor', formId];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getFormId(formId), undefined, {
        enabled: Boolean(formId),
        select: (data: FormDescriptor | undefined) => {
            if (data) {
                data = data.descriptor;
                return data;
            }

            return undefined;
        },
    });
};
