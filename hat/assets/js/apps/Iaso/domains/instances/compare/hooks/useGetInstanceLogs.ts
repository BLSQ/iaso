/* eslint-disable camelcase */
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import {
    InstanceLogDetail,
    InstanceLogsDetail,
    InstanceLogData,
    FormDescriptor,
} from '../../types/instance';
import { DropdownOptions } from '../../../../types/utils';

const getInstanceLog = (
    instanceId: string | undefined,
): Promise<InstanceLogsDetail> => {
    return getRequest(
        `/api/logs/?objectId=${instanceId}&order=-created_at&contentType=iaso.instance`,
    );
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

export const useGetInstanceLogDetail = (
    logId: string | undefined,
): UseQueryResult<Record<string, any> | undefined, Error> => {
    const queryKey: any[] = ['instanceLogDetail', logId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getInstanceLogDetail(logId),
        options: {
            enabled: Boolean(logId),
            select: data => {
                if (data) {
                    return data.new_value[0].fields;
                }

                return undefined;
            },
        },
    });
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
                if (data) {
                    return data.form_versions[0].descriptor;
                }

                return undefined;
            },
        },
    });
};
