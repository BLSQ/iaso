import React, {
    FunctionComponent,
    useCallback,
    useState,
    useEffect,
} from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    formatThousand,
    // @ts-ignore
    SortableTable,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetWorkflowVersion } from './hooks/requests/useGetWorkflowVersions';

import {
    WorkflowVersionDetail,
    WorkflowParams,
    FollowUps,
} from './types/workflows';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useGetChangesColumns, useGetFollowUpsColumns } from './config';

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
    const [followUps, setFollowUps] = useState<FollowUps[]>([]);
    const { entityTypeId, versionId } = params;
    const { formatMessage } = useSafeIntl();

    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();

    const {
        data: workflow,
        isLoading,
    }: {
        data?: WorkflowVersionDetail;
        isLoading: boolean;
    } = useGetWorkflowVersion(versionId);

    useEffect(() => {
        if (workflow?.follow_ups) {
            setFollowUps(workflow.follow_ups);
        }
    }, [workflow?.follow_ups]);

    const changesColumns = useGetChangesColumns(entityTypeId, versionId);
    const followUpsColumns = useGetFollowUpsColumns(entityTypeId, versionId);
    const handleSortChange = useCallback((items: any) => {
        setFollowUps(
            items.map((item, index) => ({ ...item, order: index + 1 })),
        );
    }, []);
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
                        <SortableTable
                            items={followUps}
                            onChange={handleSortChange}
                            columns={followUpsColumns}
                        />
                    </WidgetPaper>
                </Box>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.changes)}
                    >
                        <TableWithDeepLink
                            marginTop={false}
                            countOnTop={false}
                            elevation={0}
                            showPagination={false}
                            baseUrl={baseUrls.workflowDetail}
                            data={workflow?.changes ?? []}
                            pages={1}
                            defaultSorted={[{ id: 'updated_at', desc: false }]}
                            columns={changesColumns}
                            count={workflow?.changes.length}
                            params={params}
                            onTableParamsChange={p =>
                                dispatch(
                                    redirectToReplace(
                                        baseUrls.workflowDetail,
                                        p,
                                    ),
                                )
                            }
                            extraProps={{
                                isLoading,
                            }}
                        />
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            pr={2}
                            pb={2}
                            mt={-2}
                        >
                            {`${formatThousand(
                                workflow?.changes.length ?? 0,
                            )} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
