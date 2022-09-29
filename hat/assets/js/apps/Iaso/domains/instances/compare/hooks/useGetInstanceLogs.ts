/* eslint-disable camelcase */
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
    logId: string | undefined,
): Promise<InstanceLogData> => {
    return getRequest(`/api/logs/${logId}/`);
};
export const useGetInstanceLogDetail = (
    logIds: string[],
): Array<UseQueryResult<InstanceLogData, unknown>> => {
    // @ts-ignore => ignoring this, useQueies is wornnking with unknown type as you can have multiple calls with multiple types
    return useSnackQueries<InstanceLogData>(
        logIds.map(logId => ({
            queryKey: ['instanceLogADetail', logId],
            queryFn: () => getInstanceLogDetail(logId),
            snackErrorMsg: MESSAGES.fetchLogDetailError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logId),
            },
        })),
    );
};

const getVersion = (
    versionId: string | undefined,
    formId: number | undefined,
): Promise<Record<string, any>> => {
    return getRequest(
        `/api/formversions/?version_id=${versionId}&form_id=${formId}&fields=descriptor`,
    );
};
export const useGetFormDescriptor = (
    versionId: string | undefined,
    formId: number | undefined,
): UseQueryResult<Record<string, any> | undefined, Error> => {
    const queryKey: any[] = ['instanceDescriptor', versionId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getVersion(versionId, formId),
        options: {
            enabled: Boolean(versionId),
            select: (data: FormDescriptor | undefined) => {
                if (!data) return data;
                return data.form_versions[0].descriptor;
            },
        },
    });
};
