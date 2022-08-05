/* eslint-disable camelcase */
import { useMemo } from 'react';
import moment from 'moment';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import {
    InstanceLogDetail,
    InstanceLogsDetail,
    InstanceLogData,
    FileContent,
    InstanceLogFileContent,
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
    logA: string | undefined,
    logB: string | undefined,
): UseQueryResult<InstanceLogFileContent | undefined> => {
    const instanceLogADetail: Record<string, any> = useSnackQuery({
        queryKey: ['logA', logA],
        queryFn: () => getInstanceLogDetail(logA),
        options: {
            enabled: Boolean(logA),
            select: data => {
                if (data) {
                    console.log('data instance log A', data);
                    return data.new_value[0].fields;
                }

                return undefined;
            },
        },
    });

    const instanceLogBDetail: Record<string, any> = useSnackQuery({
        queryKey: ['logB', logB],
        queryFn: () => getInstanceLogDetail(logB),
        options: {
            enabled: Boolean(logB),
            select: data => {
                if (data) {
                    return data.new_value[0].fields;
                }

                return undefined;
            },
        },
    });

    const instanceLogsDetail = useMemo(() => {
        const data = {
            logA: instanceLogADetail.data?.json,
            logB: instanceLogBDetail.data?.json,
        };

        return data;
    }, [instanceLogADetail.data?.json, instanceLogBDetail.data?.json]);

    return {
        data: instanceLogsDetail,
    };
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
