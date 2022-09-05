import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// @ts-ignore
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import { useGetInstanceLogs } from '../hooks/useGetInstanceLogs';

import InputComponent from '../../../../components/forms/InputComponent';
import TopBar from '../../../../components/nav/TopBarComponent';
import { InstanceLogDetail } from './InstanceLogDetail';

import { IntlFormatMessage } from '../../../../types/intl';

import { redirectTo, redirectToReplace } from '../../../../routing/actions';

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
    // router: Router;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const CompareInstanceLogs: FunctionComponent<Props> = ({
    params,
    // router,
}) => {
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

    const [logAInitialValue, setLogAInitialValue] = useState<
        number | undefined
    >(undefined);
    const [logBInitialValue, setLogBInitialValue] = useState<
        number | undefined
    >(undefined);

    const { instanceIds: instanceId } = params;

    const { data: instanceLogsDropdown, isFetching: isFetchingInstanceLogs } =
        useGetInstanceLogs(instanceId);

    const handleChange = (key, value) => {
        const newParams = {
            ...params,
            [key]: value,
        };
        dispatch(redirectTo(baseUrls.compareInstanceLogs, newParams));
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
                    redirectTo(baseUrls.compareInstanceLogs, defaultParams),
                );
            } else if (params.logA === undefined) {
                const defaultParams = {
                    ...params,
                    logA: instanceLogsDropdown[0]?.value,
                };
                dispatch(
                    redirectTo(baseUrls.compareInstanceLogs, defaultParams),
                );
            } else if (params.logB === undefined) {
                const defaultParams = {
                    ...params,
                    logB: instanceLogsDropdown[1]?.value,
                };

                dispatch(
                    redirectTo(baseUrls.compareInstanceLogs, defaultParams),
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
                            label={MESSAGES.instanceLogsDate}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />
                        <InstanceLogDetail logId={params.logA} />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            type="select"
                            keyValue="logB"
                            onChange={handleChange}
                            value={params.logB || logBInitialValue}
                            label={MESSAGES.instanceLogsDate}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />

                        <InstanceLogDetail logId={params.logB} />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
