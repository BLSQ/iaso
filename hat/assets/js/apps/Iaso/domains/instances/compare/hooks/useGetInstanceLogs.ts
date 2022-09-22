/* eslint-disable camelcase */
import moment from 'moment';
import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery, useSnackQueries } from '../../../../libs/apiHooks';
import {
    InstanceLogDetail,
    InstanceLogsDetail,
    InstanceLogData,
    InstanceLogFileContent,
    InstanceUserLogDetail,
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
    const [
        { data: instanceLogADetail, isFetching: isInstanceLogAFetching },
        { data: instanceLogBDetail, isFetching: isInstanceLogBFetching },
    ] = useSnackQueries([
        {
            queryKey: ['instanceLogADetail', logA],
            queryFn: () => getInstanceLogDetail(logA),
            snackErrorMsg: MESSAGES.fetchLogDetailError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logA),
                select: data => {
                    if (data) {
                        return data.new_value[0].fields;
                    }
                    return undefined;
                },
            },
        },
        {
            queryKey: ['instanceLogBDetail', logB],
            queryFn: () => getInstanceLogDetail(logB),
            snackErrorMsg: MESSAGES.fetchLogDetailError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logA),
                select: data => {
                    if (data) {
                        return data.new_value[0].fields;
                    }
                    return undefined;
                },
            },
        },
    ]);

    const instanceLogsDetail = useMemo(() => {
        const data = {
            logA: instanceLogADetail,
            logB: instanceLogBDetail,
        };

        return data;
    }, [instanceLogADetail, instanceLogBDetail]);

    return {
        data: instanceLogsDetail,
        isLoading: isInstanceLogAFetching || isInstanceLogBFetching,
    };
};

export const useGetUserInstanceLog = (
    logA: string | undefined,
    logB: string | undefined,
): UseQueryResult<InstanceUserLogDetail, Error> => {
    const [
        { data: userLogA, isFetching: isUserLogAFetching },
        { data: userLogB, isFetching: isUserLogBFetching },
    ] = useSnackQueries([
        {
            queryKey: ['userlogA'],
            queryFn: () => getInstanceLogDetail(logA),
            snackErrorMsg: MESSAGES.fetchLogUserError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logA),
                select: data => {
                    if (data) {
                        return data?.user?.user_name;
                    }

                    return undefined;
                },
            },
        },
        {
            queryKey: ['userlogB'],
            queryFn: () => getInstanceLogDetail(logB),
            snackErrorMsg: MESSAGES.fetchLogUserError,
            dispatchOnError: false,
            options: {
                enabled: Boolean(logB),
                select: data => {
                    if (data) {
                        return data?.user?.user_name;
                    }

                    return undefined;
                },
            },
        },
    ]);

    return {
        userLogA,
        userLogB,
        isLoading: isUserLogAFetching || isUserLogBFetching,
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
