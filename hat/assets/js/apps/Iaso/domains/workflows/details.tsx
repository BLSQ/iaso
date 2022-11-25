import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetWorkflow } from './hooks/requests/useGetWorkflows';

import { WorkflowDetail, WorkflowParams } from './types/workflows';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';

type Router = {
    goBack: () => void;
    params: WorkflowParams;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%' },
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { entityTypeId, versionId } = params;
    const { formatMessage } = useSafeIntl();

    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();

    const {
        data: workflow,
    }: {
        data?: WorkflowDetail;
        isLoading: boolean;
    } = useGetWorkflow(versionId, entityTypeId);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.workflow)}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(
                            redirectToReplace(baseUrls.workflows, {
                                entityTypeId,
                            }),
                        );
                    }
                }}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={4}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(MESSAGES.infos)}
                        >
                            <Box className={classes.infoPaperBox}>
                                {!workflow && <LoadingSpinner absolute />}
                                <WorkflowBaseInfo workflow={workflow} />
                            </Box>
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.followUps)}
                    >
                        WIP
                    </WidgetPaper>
                </Box>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.changes)}
                    >
                        WIP
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
