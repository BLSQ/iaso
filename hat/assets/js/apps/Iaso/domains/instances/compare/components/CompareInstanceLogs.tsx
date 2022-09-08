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
    logA: string;
    logB: string;
};

// type Router = {
//     goBack: () => void;
// };

type Props = {
    params: Params;
    router: Router;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const PrettyPeriod = ({ value }) => {
    const formatPeriod = usePrettyPeriod();
    return formatPeriod(value);
};

export const CompareInstanceLogs: FunctionComponent<Props> = ({
    params,
    // router,
}) => {
    const { instanceIds: instanceId } = params;

    const {
        data: instanceLogsDropdown,
        isFetching: isFetchingInstanceLogs,
        isError,
    } = useGetInstanceLogs(instanceId);

    const { data: userInstanceLogDetail, isLoading } = useGetUserInstanceLog(
        params.logA,
        params.logB,
    );

    const { data: instanceLogFields } = useGetInstanceLogDetail(
        params.logA,
        params.logB,
    );
    const classes: Record<string, string> = useStyles();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const dispatch = useDispatch();
    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );

    const [instanceLogInfos, setInstanceLogInfos] = useState({
        logA: {
            org_unit: undefined,
            period: undefined,
        },
        logB: {
            org_unit: undefined,
            period: undefined,
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
    }, [instanceLogsDropdown, params]);

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
                org_unit: instanceLogFields?.logA?.org_unit,
                period: instanceLogFields?.logA?.period,
            },
            logB: {
                org_unit: instanceLogFields?.logB?.org_unit,
                period: instanceLogFields?.logB?.period,
            },
        });
    }, [instanceLogFields?.logA, instanceLogFields?.logB]);

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

                        {isLoading ? (
                            <Box height="10vh">
                                <LoadingSpinner
                                    fixed={false}
                                    transparent
                                    padding={4}
                                    size={25}
                                />
                            </Box>
                        ) : (
                            <WidgetPaper
                                expandable
                                isExpanded={false}
                                title={formatMessage(MESSAGES.infos)}
                                padded
                            >
                                <Grid container spacing={1}>
                                    <Grid
                                        xs={5}
                                        container
                                        alignItems="center"
                                        item
                                        justifyContent="flex-end"
                                    >
                                        <Typography
                                            variant="body2"
                                            color="inherit"
                                        >
                                            {formatMessage(
                                                MESSAGES.last_modified_by,
                                            )}
                                        </Typography>
                                        :
                                    </Grid>
                                    <Grid
                                        xs={7}
                                        container
                                        item
                                        justifyContent="flex-start"
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="body2"
                                            color="inherit"
                                        >
                                            {
                                                userInstanceLogDetail?.logA
                                                    ?.user_name
                                            }
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {Object.entries(instanceLogInfos.logA).map(
                                    info => (
                                        <Grid container spacing={1}>
                                            <Grid
                                                xs={5}
                                                container
                                                alignItems="center"
                                                item
                                                justifyContent="flex-end"
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="inherit"
                                                >
                                                    {/* // TO DO : find api call to get org unit name from org unit id */}
                                                    {formatMessage(
                                                        MESSAGES[info[0]],
                                                    )}
                                                </Typography>
                                                :
                                            </Grid>
                                            <Grid
                                                xs={7}
                                                container
                                                item
                                                justifyContent="flex-start"
                                                alignItems="center"
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="inherit"
                                                >
                                                    {info[0] === 'period' ? (
                                                        <PrettyPeriod
                                                            value={info[1]}
                                                        />
                                                    ) : (
                                                        info[1]
                                                    )}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    ),
                                )}
                            </WidgetPaper>
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

                        {isLoading ? (
                            <Box height="10vh">
                                <LoadingSpinner
                                    fixed={false}
                                    transparent
                                    padding={4}
                                    size={25}
                                />
                            </Box>
                        ) : (
                            <WidgetPaper
                                expandable
                                isExpanded={false}
                                title={formatMessage(MESSAGES.infos)}
                                padded
                            >
                                <Grid container spacing={1}>
                                    <Grid
                                        xs={5}
                                        container
                                        alignItems="center"
                                        item
                                        justifyContent="flex-end"
                                    >
                                        <Typography
                                            variant="body2"
                                            color="inherit"
                                        >
                                            {formatMessage(
                                                MESSAGES.last_modified_by,
                                            )}
                                        </Typography>
                                        :
                                    </Grid>
                                    <Grid
                                        xs={7}
                                        container
                                        item
                                        justifyContent="flex-start"
                                        alignItems="center"
                                    >
                                        <Typography
                                            variant="body2"
                                            color="inherit"
                                        >
                                            {
                                                userInstanceLogDetail?.logB
                                                    ?.user_name
                                            }
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {Object.entries(instanceLogInfos.logB).map(
                                    info => (
                                        <Grid container spacing={1}>
                                            <Grid
                                                xs={5}
                                                container
                                                alignItems="center"
                                                item
                                                justifyContent="flex-end"
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="inherit"
                                                >
                                                    {/* // TO DO : find how to get translation */}
                                                    {info[0]}
                                                </Typography>
                                                :
                                            </Grid>
                                            <Grid
                                                xs={7}
                                                container
                                                item
                                                justifyContent="flex-start"
                                                alignItems="center"
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="inherit"
                                                >
                                                    {info[1]}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    ),
                                )}
                            </WidgetPaper>
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
