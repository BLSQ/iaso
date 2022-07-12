import React, { FunctionComponent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// @ts-ignore
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import { useGetInstanceLogs } from '../../hooks/requests/useGetInstanceLogs';

import InputComponent from '../../../../components/forms/InputComponent';
import TopBar from '../../../../components/nav/TopBarComponent';

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
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
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
                <Grid container spacing={4}>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            type="select"
                            keyValue="logA"
                            onChange={handleChange}
                            value={params.logA || undefined}
                            label={MESSAGES.instanceLogsDate}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <InputComponent
                            type="select"
                            keyValue="logB"
                            onChange={handleChange}
                            value={params.logB || undefined}
                            label={MESSAGES.instanceLogsDate}
                            options={instanceLogsDropdown}
                            loading={isFetchingInstanceLogs}
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
