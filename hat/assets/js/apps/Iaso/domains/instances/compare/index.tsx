import React, { FunctionComponent, useMemo } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Theme, GridSize } from '@mui/material';
import { makeStyles } from '@mui/styles';

// @ts-ignore
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';

import InstanceDetail from './components/InstanceDetail';

import { redirectToReplace } from '../../../routing/actions';

import MESSAGES from './messages';
import { baseUrls } from '../../../constants/urls';

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

const CompareSubmissions: FunctionComponent<Props> = ({ params, router }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );

    const instanceIds: Array<string> = params.instanceIds.split(',');
    const colSize: number = useMemo(() => {
        if (instanceIds.length < 12 && instanceIds.length > 0) {
            return 12 / instanceIds.length;
        }
        return 12;
    }, [instanceIds]);
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
                    {instanceIds.map((instanceId: string) => (
                        <Grid
                            key={instanceId}
                            xs={12}
                            md={colSize as GridSize}
                            item
                        >
                            <InstanceDetail instanceId={instanceId} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </>
    );
};

export default CompareSubmissions;
