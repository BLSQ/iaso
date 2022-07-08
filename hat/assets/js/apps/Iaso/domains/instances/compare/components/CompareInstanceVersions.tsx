import React, { FunctionComponent, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme, GridSize } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import InstanceDetail from './InstanceDetail';

import { redirectToReplace } from '../../../../routing/actions';
import TopBar from '../../../../components/nav/TopBarComponent';
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

const CompareInstanceVersions: FunctionComponent<Props> = ({
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

    // console.log('prev path name', prevPathname);
    // console.log('params', params);
    // console.log('router', router);
    // console.log('instance id', instanceId);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
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
                        {/* TO DO : display actual version of instance */}
                        {/* <InstanceDetail instanceId={instanceId} /> */}
                    </Grid>
                    <Grid xs={12} md={6} item>
                        {/* TO DO : populate instance logs and create a select allowing to choose a previous version */}
                        {/* <InstanceDetail instanceId={instanceId} /> */}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default CompareInstanceVersions;
