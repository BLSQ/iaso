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
    // @ts-ignore
    useHumanReadableJsonLogic,
} from 'bluesquare-components';
import { Box, Grid, makeStyles, Button } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import orderBy from 'lodash/orderBy';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetWorkflowVersion } from './hooks/requests/useGetWorkflowVersions';
import {
    useGetQueryBuildersFields,
    useGetQueryBuilderListToReplace,
} from './hooks/queryBuilder';

import { useGetFormDescriptor } from './hooks/requests/useGetFormDescriptor';
import { useBulkUpdateWorkflowFollowUp } from './hooks/requests/useBulkUpdateWorkflowFollowUp';

import {
    WorkflowVersionDetail,
    WorkflowParams,
    FollowUps,
} from './types';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import { FollowUpsTable } from './components/followUps/Table';
import { AddFollowUpsModal } from './components/followUps/Modal';
import { AddChangeModal } from './components/changes/Modal';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useGetChangesColumns } from './config/changes';
import { useGetFollowUpsColumns } from './config/followUps';
import { useGetPossibleFields } from '../forms/hooks/useGetPossibleFields';

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
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
    count: {
        height: theme.spacing(8),
        display: 'flex',
        justifyContent: 'flex-end',
        position: 'absolute',
        alignItems: 'center',
        paddingRight: theme.spacing(2),
        top: 0,
        right: 0,
    },
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const [followUps, setFollowUps] = useState<FollowUps[]>([]);

    const { mutate: saveFollowUpOrder } = useBulkUpdateWorkflowFollowUp(() =>
        setFollowUpOrderChange(false),
    );
    const [followUpOrderChange, setFollowUpOrderChange] =
        useState<boolean>(false);
    const { entityTypeId, versionId } = params;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.workflows, { entityTypeId });

    const dispatch = useDispatch();

    const {
        data: workflowVersion,
        isLoading,
    }: {
        data?: WorkflowVersionDetail;
        isLoading: boolean;
    } = useGetWorkflowVersion(versionId);

    useEffect(() => {
        if (workflowVersion?.follow_ups) {
            const newFollowUps = orderBy(
                workflowVersion.follow_ups,
                [f => f.order],
                ['asc'],
            );
            setFollowUps(
                newFollowUps.map(followUp => ({
                    ...followUp,
                    accessor: followUp.id,
                })),
            );
        }
    }, [workflowVersion?.follow_ups]);
    const { possibleFields } = useGetPossibleFields(
        workflowVersion?.reference_form.id,
    );
    const { data: formDescriptors } = useGetFormDescriptor(
        workflowVersion?.reference_form.id,
    );
    const fields = useGetQueryBuildersFields(formDescriptors, possibleFields);

    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );
    const changesColumns = useGetChangesColumns(versionId, workflowVersion);
    const followUpsColumns = useGetFollowUpsColumns(
        getHumanReadableJsonLogic,
        versionId,
        workflowVersion,
        fields,
    );
    const handleSortChange = useCallback((items: any) => {
        setFollowUps(
            items.map((item, index) => ({ ...item, order: index + 1 })),
        );
        setFollowUpOrderChange(true);
    }, []);

    const handleSaveFollowUpsOrder = useCallback(() => {
        saveFollowUpOrder(
            followUps.map(fu => ({
                id: fu.id,
                order: fu.order - 1,
            })),
        );
    }, [followUps, saveFollowUpOrder]);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.workflowVersion)}${
                    workflowVersion?.name ? `: ${workflowVersion?.name}` : ''
                }`}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={4}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(MESSAGES.infos)}
                        >
                            <Box className={classes.infoPaperBox}>
                                {!workflowVersion && (
                                    <LoadingSpinner absolute />
                                )}
                                {workflowVersion && (
                                    <WorkflowBaseInfo
                                        workflowVersion={workflowVersion}
                                    />
                                )}
                            </Box>
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.infoPaper}
                        title={formatMessage(MESSAGES.followUps)}
                    >
                        <Box className={classes.count}>
                            {`${formatThousand(
                                workflowVersion?.follow_ups.length ?? 0,
                            )} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
                        <>
                            {workflowVersion && (
                                <>
                                    {workflowVersion.status === 'DRAFT' && (
                                        <SortableTable
                                            items={followUps}
                                            onChange={handleSortChange}
                                            columns={followUpsColumns}
                                        />
                                    )}
                                    {workflowVersion.status !== 'DRAFT' && (
                                        <FollowUpsTable
                                            params={params}
                                            workflowVersion={workflowVersion}
                                            isLoading={isLoading}
                                            followUpsColumns={followUpsColumns}
                                        />
                                    )}
                                </>
                            )}
                        </>
                        {workflowVersion?.status === 'DRAFT' && (
                            <Box m={2} textAlign="right">
                                <Box display="inline-block" mr={2}>
                                    <Button
                                        color="primary"
                                        disabled={!followUpOrderChange}
                                        data-test="save-follow-up-order"
                                        onClick={handleSaveFollowUpsOrder}
                                        variant="contained"
                                    >
                                        {formatMessage(MESSAGES.saveOrder)}
                                    </Button>
                                </Box>
                                <AddFollowUpsModal
                                    fields={fields}
                                    versionId={versionId}
                                    newOrder={
                                        followUps[followUps.length - 1]?.order +
                                        1
                                    }
                                />
                            </Box>
                        )}
                    </WidgetPaper>
                </Box>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.infoPaper}
                        title={formatMessage(MESSAGES.changes)}
                    >
                        <Box className={classes.count}>
                            {`${formatThousand(
                                workflowVersion?.changes.length ?? 0,
                            )} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
                        <TableWithDeepLink
                            marginTop={false}
                            countOnTop={false}
                            elevation={0}
                            showPagination={false}
                            baseUrl={baseUrls.workflowDetail}
                            data={workflowVersion?.changes ?? []}
                            pages={1}
                            defaultSorted={[{ id: 'updated_at', desc: false }]}
                            columns={changesColumns}
                            count={workflowVersion?.changes.length}
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
                        {workflowVersion?.status === 'DRAFT' && (
                            <Box m={2} textAlign="right">
                                <AddChangeModal versionId={versionId} />
                            </Box>
                        )}
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
