/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import {
    InstanceLog,
    InstanceLogDetail,
    InstanceLogsDetail,
    InstanceLogData,
    FormDescriptor,
} from '../../types/instance';

const getInstanceLog = (
    instanceId: string | undefined,
): Promise<InstanceLogsDetail> => {
    return getRequest(`/api/logs/?objectId=${instanceId}&order=-created_at`);
};

const getInstanceLogDetail = (
    logId: string | undefined,
): Promise<InstanceLogData> => {
    return getRequest(`/api/logs/${logId}`);
};

const getVersion = (versionId, formId) => {
    return getRequest(
        `/api/formversions/?version_id=${versionId}&form_id=${formId}&fields=descriptor`,
    );
};

export const useGetInstanceLogs = (
    instanceId: string | undefined,
): UseQueryResult<InstanceLogsDetail, Error> => {
    const queryKey: any[] = ['instanceLog', instanceId];
    return useSnackQuery(
        queryKey,
        () => getInstanceLog(instanceId),
        undefined,
        {
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
    );
};

export const useGetInstanceLogDetail = (
    logId: string | undefined,
): UseQueryResult<InstanceLogData, Error> => {
    const queryKey: any[] = ['instanceLogDetail', logId];
    return useSnackQuery(
        queryKey,
        () => getInstanceLogDetail(logId),
        undefined,
        {
            enabled: Boolean(logId),
            select: (data: InstanceLog | undefined) => {
                if (data) {
                    return data.new_value[0].fields;
                }

                return undefined;
            },
        },
    );
};

export const useGetFormDescriptor = (
    versionId: string | undefined,
    formId: number | undefined,
): UseQueryResult<FormDescriptor, Error> => {
    const queryKey: any[] = ['instanceDescriptor', versionId];
    return useSnackQuery(
        queryKey,
        () => getVersion(versionId, formId),
        undefined,
        {
            enabled: Boolean(versionId),
            select: (data: FormDescriptor | undefined) => {
                if (data) {
                    console.log('data descriptor', data);
                    return data.form_versions[0].descriptor;
                }

                return undefined;
            },
        },
    );
};
