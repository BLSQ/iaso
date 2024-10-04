import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery, useSnackQueries } from '../../../../libs/apiHooks';
import {
    InstanceLogDetail,
    InstanceLogsDetail,
    InstanceLogData,
    FormDescriptor,
} from '../../types/instance';
import { DropdownOptions } from '../../../../types/utils';

import MESSAGES from '../messages';

const getInstanceLog = (
    instanceId: string | undefined,
): Promise<InstanceLogsDetail> => {
    return getRequest(
        `/api/logs/?objectId=${instanceId}&order=-created_at&contentType=iaso.instance`,
    );
};
export const useGetInstanceLogs = (
    instanceId: string | undefined,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const queryKey: any[] = ['instanceLog', instanceId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getInstanceLog(instanceId),
        options: {
            enabled: Boolean(instanceId),
            select: data => {
                if (!data) return [];
                return data.list.map((instanceLog: InstanceLogDetail) => {
                    return {
                        value: instanceLog.id,
                        label: moment(instanceLog.created_at).format('LTS'),
                        original: instanceLog,
                    };
                });
            },
        },
    });
};

const getInstanceLogDetail = (
    instanceId: number | string,
    logId: string | undefined,
): Promise<InstanceLogData> => {
    return getRequest(`/api/instances/${instanceId}/instance_logs/${logId}/`);
};
export const useGetInstanceLogDetail = (
    instanceId: number | string,
    logIds: string[],
): Array<UseQueryResult<InstanceLogData, unknown>> => {
    // @ts-ignore => ignoring this, useQueies is working with unknown type as you can have multiple calls with multiple types
    return useSnackQueries<InstanceLogData>(
        logIds.map(logId => ({
            queryKey: ['instanceLogDetail', logId],
            queryFn: () => getInstanceLogDetail(instanceId, logId),
            snackErrorMsg: MESSAGES.fetchLogDetailError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logId),
            },
        })),
    );
};

const getVersion = (
    formId: string | undefined,
): Promise<Record<string, any>> => {
    return getRequest(`/api/formversions/?form_id=${formId}&fields=descriptor`);
};
export const useGetFormDescriptor = (
    formId?: string,
): UseQueryResult<Record<string, any> | undefined, Error> => {
    const queryKey: any[] = ['instanceDescriptor'];
    return useSnackQuery({
        queryKey,
        queryFn: () => getVersion(formId),
        options: {
            enabled: Boolean(formId),
            select: (data: FormDescriptor | undefined) => {
                if (!data) return data;
                return data.form_versions[0]?.descriptor;
            },
        },
    });
};
