import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// @ts-ignore
import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
} from 'bluesquare-components';

import {
    useGetInstanceLogs,
    useGetUserInstanceLog,
    useGetInstanceLogDetail,
} from '../hooks/useGetInstanceLogs';

import { usePrettyPeriod } from '../../../periods/utils';

import InputComponent from '../../../../components/forms/InputComponent';
import TopBar from '../../../../components/nav/TopBarComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import { InstanceLogDetail } from './InstanceLogDetail';
import { InstanceLogInfos } from './InstanceLogInfos';

import { IntlFormatMessage } from '../../../../types/intl';

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
    logA?: string;
    logB?: string;
};

type Props = {
    params: Params;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const CompareInstanceLogs: FunctionComponent<Props> = ({ params }) => {
    const { instanceIds: instanceId } = params;

    const logInfos = {
        org_unit: undefined,
        period: undefined,
    };
    const {
        data: instanceLogsDropdown,
        isFetching: isFetchingInstanceLogs,
        isError,
    } = useGetInstanceLogs(instanceId);

    const { userLogA, userLogB, isUserLoading } = useGetUserInstanceLog(
        params.logA,
        params.logB,
    );
    const { data: instanceLogsDetail, isLoading: isInstanceLogDetailLoading } =
        useGetInstanceLogDetail(params.logA, params.logB);

    const classes: Record<string, string> = useStyles();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const dispatch = useDispatch();
    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );

    // FIXME ugly fix to the back arrow bug. Caused by redirecting in useEffect. using useSkipEffectOnMount breaks the feature, so this is a workaround
    // eslint-disable-next-line no-unused-vars
    const [previous, _setPrevious] = useState<string | undefined>(prevPathname);
    const [instanceLogInfos, setInstanceLogInfos] = useState({
        logA: {
            ...logInfos,
        },
        logB: {
            ...logInfos,
        },
    });
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
            if (params.logA === undefined && params.logB === undefined) {
                const defaultParams = {
                    ...params,
                    logA: instanceLogsDropdown[0]?.value,
                    logB: instanceLogsDropdown[1]?.value,
                };
                dispatch(
                    redirectToReplace(
                        baseUrls.compareInstanceLogs,
                        defaultParams,
                    ),
                );
            } else if (params.logA === undefined) {
                const defaultParams = {
                    ...params,
                    logA: instanceLogsDropdown[0]?.value,
                };
                dispatch(
                    redirectToReplace(
                        baseUrls.compareInstanceLogs,
                        defaultParams,
                    ),
                );
            } else if (params.logB === undefined) {
                const defaultParams = {
                    ...params,
                    logB: instanceLogsDropdown[1]?.value,
                };

                dispatch(
                    redirectToReplace(
                        baseUrls.compareInstanceLogs,
                        defaultParams,
                    ),
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceLogsDropdown, params.logA, params.logB]);

    useEffect(() => {
        setLogAInitialValue(
            instanceLogsDropdown && instanceLogsDropdown[0]?.value,
        );
        setLogBInitialValue(
            instanceLogsDropdown && instanceLogsDropdown[1]?.value,
        );
    }, [instanceLogsDropdown, isFetchingInstanceLogs]);

    useEffect(() => {
        setInstanceLogInfos({
            logA: {
                org_unit: instanceLogsDetail?.logA?.org_unit,
                period: instanceLogsDetail?.logA?.period,
            },
            logB: {
                org_unit: instanceLogsDetail?.logB?.org_unit,
                period: instanceLogsDetail?.logB?.period,
            },
        });
    }, [instanceLogsDetail]);

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
                    if (previous) {
                        dispatch(redirectToReplace(previous, {}));
                    } else {
                        dispatch(redirectToReplace(baseUrls.instances, {}));
                    }
                }}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={4}>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            type="select"
                            keyValue="logA"
                            onChange={handleChange}
                            value={params.logA || logAInitialValue}
                            label={MESSAGES.instanceLogsVersionA}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />

                        {isUserLoading || isInstanceLogDetailLoading ? (
                            <Box height="10vh">
                                <LoadingSpinner
                                    fixed={false}
                                    transparent
                                    padding={4}
                                    size={25}
                                />
                            </Box>
                        ) : (
                            <InstanceLogInfos
                                user={userLogA}
                                infos={instanceLogInfos.logA}
                            />
                        )}
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            type="select"
                            keyValue="logB"
                            onChange={handleChange}
                            value={params.logB || logBInitialValue}
                            label={MESSAGES.instanceLogsVersionB}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />

                        {isUserLoading || isInstanceLogDetailLoading ? (
                            <Box height="10vh">
                                <LoadingSpinner
                                    fixed={false}
                                    transparent
                                    padding={4}
                                    size={25}
                                />
                            </Box>
                        ) : (
                            <InstanceLogInfos
                                user={userLogB}
                                infos={instanceLogInfos.logB}
                            />
                        )}
                    </Grid>

                    <Grid xs={12} md={12} item>
                        <InstanceLogDetail
                            logA={params.logA}
                            logB={params.logB}
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
