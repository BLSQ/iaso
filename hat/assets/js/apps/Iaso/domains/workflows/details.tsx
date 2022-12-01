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
    Table,
    // @ts-ignore
    SortableTable,
    // @ts-ignore
    SortableList,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetWorkflow } from './hooks/requests/useGetWorkflows';

import { WorkflowDetail, WorkflowParams, FollowUps } from './types/workflows';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import { SortableItem } from './components/SortableItem';
import { SortableFollowUp } from './components/SortableFollowUp';

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
        data?: WorkflowDetail;
        isLoading: boolean;
    } = useGetWorkflow(versionId, entityTypeId);

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
                <Box mt={2} mb={2} width="30%">
                    <SortableList
                        items={followUps}
                        onChange={handleSortChange}
                        handle
                        renderItem={props => <SortableItem {...props} />}
                    />
                </Box>

                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.followUps)}
                    >
                        <SortableTable
                            items={followUps}
                            onChange={handleSortChange}
                            renderItem={props => (
                                <SortableFollowUp {...props} />
                            )}
                            columns={followUpsColumns}
                        />
                        <Table
                            marginTop={false}
                            countOnTop={false}
                            elevation={0}
                            showPagination={false}
                            baseUrl={baseUrls.workflowDetail}
                            data={workflow?.follow_ups ?? []}
                            pages={1}
                            defaultSorted={[{ id: 'order', desc: false }]}
                            columns={followUpsColumns}
                            count={workflow?.follow_ups.length}
                            params={params}
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
                                workflow?.follow_ups.length ?? 0,
                            )} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
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
