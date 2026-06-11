import React, { FunctionComponent, useEffect, useState, useMemo } from 'react';
import { Box, Grid, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    commonStyles,
    IntlFormatMessage,
    useRedirectToReplace,
    useGoBack,
} from 'bluesquare-components';

import TopBar from '../../../../components/nav/TopBarComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import { baseUrls } from '../../../../constants/urls';
import { useParamsObject } from '../../../../routing/hooks/useParamsObject';
import {
    useGetInstanceLogs,
    useGetInstanceLogDetail,
} from '../hooks/useGetInstanceLogs';
import MESSAGES from '../messages';
import { InstanceLogDetail } from './InstanceLogDetail';
import { InstanceLogInfos } from './InstanceLogInfos';

type Params = {
    instanceIds: string;
    logA: string;
    logB: string;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const CompareInstanceLogs: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.compareInstanceLogs,
    ) as unknown as Params;
    const goBack = useGoBack(baseUrls.instances);
    const redirectToReplace = useRedirectToReplace();
    const { instanceIds: instanceId } = params;
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const {
        data: rawInstanceLogsDropdown,
        isFetching: isFetchingInstanceLogs,
        isError,
    } = useGetInstanceLogs(instanceId);

    const instanceLogsDropdown = useMemo(() => {
        if (!rawInstanceLogsDropdown) return undefined;
        if (rawInstanceLogsDropdown.length === 0) return [];

        return [
            ...rawInstanceLogsDropdown,
            {
                value: 'initial',
                label: formatMessage(MESSAGES.initialVersion),
            },
        ];
    }, [rawInstanceLogsDropdown, formatMessage]);

    const oldestLogId = useMemo(() => {
        if (!rawInstanceLogsDropdown || rawInstanceLogsDropdown.length === 0)
            return undefined;
        return rawInstanceLogsDropdown[rawInstanceLogsDropdown.length - 1]
            ?.value;
    }, [rawInstanceLogsDropdown]);

    const logIdA =
        params.logA === 'initial' ? oldestLogId?.toString() : params.logA;
    const logIdB =
        params.logB === 'initial' ? oldestLogId?.toString() : params.logB;

    const [
        {
            data: instanceLogA,
            isFetching: isInstanceLogAFetching,
            isError: isInstanceLogAError,
        },
        {
            data: instanceLogB,
            isFetching: isInstanceLogBFetching,
            isError: isInstanceLogBError,
        },
    ] = useGetInstanceLogDetail(instanceId, [logIdA, logIdB]);

    const instanceLogContent = useMemo(() => {
        const logAValue =
            params.logA === 'initial'
                ? instanceLogA?.past_value[0]?.fields
                : instanceLogA?.new_value[0]?.fields;
        const logBValue =
            params.logB === 'initial'
                ? instanceLogB?.past_value[0]?.fields
                : instanceLogB?.new_value[0]?.fields;
        return {
            logA: logAValue,
            logB: logBValue,
            logAFiles: instanceLogA?.files,
            logBFiles: instanceLogB?.files,
            formDescriptorA: instanceLogA?.form_descriptor,
            formDescriptorB: instanceLogB?.form_descriptor,
            fields: instanceLogA?.possible_fields,
        };
    }, [instanceLogA, instanceLogB, params.logA, params.logB]);

    const isLogDetailLoading = isInstanceLogAFetching || isInstanceLogBFetching;
    const isLogDetailError = isInstanceLogAError || isInstanceLogBError;
    const classes: Record<string, string> = useStyles();

    const [logAInitialValue, setLogAInitialValue] = useState<
        string | number | undefined
    >(undefined);
    const [logBInitialValue, setLogBInitialValue] = useState<
        string | number | undefined
    >(undefined);

    const handleChange = (key, value) => {
        const newParams = {
            ...params,
            [key]: value,
        };
        redirectToReplace(baseUrls.compareInstanceLogs, newParams);
    };

    useEffect(() => {
        if (instanceLogsDropdown) {
            const newParams: Params = {
                ...params,
            };
            const logADropDownValue = instanceLogsDropdown?.slice(-1)[0]?.value;
            const logBDropDownValue = instanceLogsDropdown[0]?.value;
            if (!params.logA && logADropDownValue) {
                newParams.logA = logADropDownValue.toString();
            }
            if (!params.logB && logBDropDownValue) {
                newParams.logB = logBDropDownValue.toString();
            }
            if (
                (!params.logA && logADropDownValue) ||
                (!params.logB && logBDropDownValue)
            ) {
                redirectToReplace(baseUrls.compareInstanceLogs, newParams);
            }
        }
    }, [instanceLogsDropdown, params, redirectToReplace]);

    useEffect(() => {
        setLogAInitialValue(
            instanceLogsDropdown && instanceLogsDropdown?.slice(-1)[0]?.value,
        );
        setLogBInitialValue(
            instanceLogsDropdown && instanceLogsDropdown[0]?.value,
        );
    }, [instanceLogsDropdown, isFetchingInstanceLogs]);

    if (isError) {
        return (
            <ErrorPaperComponent message={formatMessage(MESSAGES.errorLog)} />
        );
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.instanceLogsTitle)}
                displayBackButton
                goBack={goBack}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid
                    container
                    spacing={3}
                    display="flex"
                    justifyContent="flex-end"
                >
                    <Grid xs={12} md={4.5} item>
                        <InstanceLogInfos
                            log="logA"
                            logTitle="Version A"
                            dropDownHandleChange={handleChange}
                            value={params.logA || logAInitialValue}
                            label={MESSAGES.instanceLogsVersionA}
                            user={
                                params.logA === 'initial'
                                    ? undefined
                                    : instanceLogA?.user
                            }
                            infos={instanceLogContent.logA}
                            loading={isInstanceLogAFetching}
                            options={instanceLogsDropdown?.filter(
                                instance =>
                                    String(instance.value) !==
                                    String(params.logB || logBInitialValue),
                            )}
                            dropDownLoading={isFetchingInstanceLogs}
                        />
                    </Grid>
                    <Grid xs={12} md={4.5} item>
                        <InstanceLogInfos
                            log="logB"
                            logTitle="Version B"
                            dropDownHandleChange={handleChange}
                            value={params.logB || logBInitialValue}
                            label={MESSAGES.instanceLogsVersionB}
                            options={instanceLogsDropdown?.filter(
                                instance =>
                                    String(instance.value) !==
                                    String(params.logA || logAInitialValue),
                            )}
                            loading={isInstanceLogBFetching}
                            user={
                                params.logB === 'initial'
                                    ? undefined
                                    : instanceLogB?.user
                            }
                            infos={instanceLogContent.logB}
                            dropDownLoading={isFetchingInstanceLogs}
                        />
                    </Grid>

                    <Grid xs={12} md={12} item>
                        <InstanceLogDetail
                            instanceLogContent={instanceLogContent}
                            isLogDetailLoading={isLogDetailLoading}
                            isLogDetailError={isLogDetailError}
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
