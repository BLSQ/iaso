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
    InstanceLogFileContent,
    FormDescriptor,
    InstanceUserLogDetail,
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
): UseQueryResult<InstanceLogFileContent, Error> => {
    const instanceLogADetail: Record<string, any> = useSnackQuery({
        queryKey: ['logA', logA],
        queryFn: () => getInstanceLogDetail(logA),
        options: {
            enabled: Boolean(logA),
            select: data => {
                if (data) {
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
            logA: instanceLogADetail.data,
            logB: instanceLogBDetail.data,
        };

        return data;
    }, [instanceLogADetail?.data, instanceLogBDetail?.data]);

    return {
        data: instanceLogsDetail,
        isLoading:
            instanceLogADetail.data === undefined ||
            instanceLogBDetail.data === undefined,
        isError: !instanceLogADetail.data || !instanceLogBDetail.data,
    };
};

export const useGetUserInstanceLog = (
    logA: string | undefined,
    logB: string | undefined,
): UseQueryResult<InstanceUserLogDetail, Error> => {
    const userLogADetail: Record<string, any> = useSnackQuery({
        queryKey: ['userlogA', logA],
        queryFn: () => getInstanceLogDetail(logA),
        options: {
            enabled: Boolean(logA),
            select: data => {
                if (data) {
                    return data.user;
                }

                return undefined;
            },
        },
    });

    const userLogBDetail: Record<string, any> = useSnackQuery({
        queryKey: ['userlogB', logB],
        queryFn: () => getInstanceLogDetail(logB),
        options: {
            enabled: Boolean(logB),
            select: data => {
                if (data) {
                    return data.user;
                }

                return undefined;
            },
        },
    });

    const userLogsDetail = useMemo(() => {
        const data = {
            logA: userLogADetail.data,
            logB: userLogBDetail.data,
        };

        return data;
    }, [userLogADetail?.data, userLogBDetail?.data]);

    return {
        data: userLogsDetail,
        isLoading:
            userLogADetail.data === undefined ||
            userLogBDetail.data === undefined,
        isError: !userLogADetail.data || !userLogBDetail.data,
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
