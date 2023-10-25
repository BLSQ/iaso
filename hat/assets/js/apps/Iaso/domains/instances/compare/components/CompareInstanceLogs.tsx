import React, { FunctionComponent, useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    commonStyles,
    IntlFormatMessage,
} from 'bluesquare-components';

import {
    useGetInstanceLogs,
    useGetInstanceLogDetail,
} from '../hooks/useGetInstanceLogs';

import InputComponent from '../../../../components/forms/InputComponent';
import TopBar from '../../../../components/nav/TopBarComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import { InstanceLogDetail } from './InstanceLogDetail';
import { InstanceLogInfos } from './InstanceLogInfos';

import { redirectToReplace } from '../../../../routing/actions';

import MESSAGES from '../messages';
import { baseUrls } from '../../../../constants/urls';

type RouterCustom = {
    prevPathname: string | undefined;
};
type State = {
    routerCustom: RouterCustom;
};
type Params = {
    instanceIds: string;
    logA: string;
    logB: string;
};
type Router = {
    goBack: () => void;
};

type Props = {
    params: Params;
    router: Router;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const CompareInstanceLogs: FunctionComponent<Props> = ({
    params,
    router,
}) => {
    const { instanceIds: instanceId } = params;

    const {
        data: instanceLogsDropdown,
        isFetching: isFetchingInstanceLogs,
        isError,
    } = useGetInstanceLogs(instanceId);

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
    ] = useGetInstanceLogDetail([params.logA, params.logB]);

    const instanceLogContent = useMemo(
        () => ({
            logA: instanceLogA?.new_value[0]?.fields,
            logB: instanceLogB?.new_value[0]?.fields,
        }),
        [instanceLogA, instanceLogB],
    );
    const isLogDetailLoading = isInstanceLogAFetching || isInstanceLogBFetching;
    const isLogDetailError = isInstanceLogAError || isInstanceLogBError;
    const classes: Record<string, string> = useStyles();

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const dispatch = useDispatch();

    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );

    const [logAInitialValue, setLogAInitialValue] = useState<
        number | undefined
    >(undefined);
    const [logBInitialValue, setLogBInitialValue] = useState<
        number | undefined
    >(undefined);

    const handleChange = (key, value) => {
        const newParams = {
            ...params,
            [key]: value,
        };
        dispatch(redirectToReplace(baseUrls.compareInstanceLogs, newParams));
    };

    useEffect(() => {
        if (instanceLogsDropdown) {
            const newParams: Params = {
                ...params,
            };
            if (!params.logA && instanceLogsDropdown[0]?.value) {
                newParams.logA = instanceLogsDropdown[0]?.value.toString();
            }
            if (!params.logB && instanceLogsDropdown[1]?.value) {
                newParams.logB = instanceLogsDropdown[1]?.value.toString();
            }
            if (
                (!params.logA && instanceLogsDropdown[0]?.value) ||
                (!params.logB && instanceLogsDropdown[1]?.value)
            ) {
                dispatch(
                    redirectToReplace(baseUrls.compareInstanceLogs, newParams),
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceLogsDropdown, params]);
    useEffect(() => {
        setLogAInitialValue(
            instanceLogsDropdown && instanceLogsDropdown[0]?.value,
        );
        setLogBInitialValue(
            instanceLogsDropdown && instanceLogsDropdown[1]?.value,
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
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.instances, {}));
                    }
                }}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={2}>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            clearable={false}
                            type="select"
                            keyValue="logA"
                            onChange={handleChange}
                            value={params.logA || logAInitialValue}
                            label={MESSAGES.instanceLogsVersionA}
                            options={instanceLogsDropdown?.filter(
                                instance =>
                                    instance.value !==
                                    (parseInt(params.logB, 10) ||
                                        logBInitialValue),
                            )}
                            loading={isFetchingInstanceLogs}
                        />
                        <InstanceLogInfos
                            user={instanceLogA?.user}
                            infos={instanceLogContent.logA}
                            loading={isInstanceLogAFetching}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            clearable={false}
                            type="select"
                            keyValue="logB"
                            onChange={handleChange}
                            value={params.logB || logBInitialValue}
                            label={MESSAGES.instanceLogsVersionB}
                            options={instanceLogsDropdown?.filter(
                                instance =>
                                    instance.value !==
                                    (parseInt(params.logA, 10) ||
                                        logAInitialValue),
                            )}
                            loading={isFetchingInstanceLogs}
                        />

                        <InstanceLogInfos
                            user={instanceLogA?.user}
                            infos={instanceLogContent.logB}
                            loading={isInstanceLogBFetching}
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
