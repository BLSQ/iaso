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
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch } from 'react-redux';
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

import {
    WorkflowVersionDetail,
    WorkflowParams,
    FollowUps,
} from './types/workflows';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import { FollowUpsTable } from './components/FollowUpsTable';
import { AddFollowUpsModal } from './components/FollowUpsModal';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useGetChangesColumns, useGetFollowUpsColumns } from './config';
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
            setFollowUps(
                workflowVersion.follow_ups.map(followUp => ({
                    ...followUp,
                    accessor: followUp.id,
                })),
            );
        }
    }, [workflowVersion?.follow_ups]);
    const { possibleFields } = useGetPossibleFields(
        workflowVersion?.reference_form.id,
    );
    const { data: formDescriptor } = useGetFormDescriptor(
        workflowVersion?.reference_form.id,
    );
    const fields = useGetQueryBuildersFields(formDescriptor, possibleFields);

    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );
    const changesColumns = useGetChangesColumns();
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
    }, []);
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
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.followUps)}
                    >
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
                                <AddFollowUpsModal
                                    fields={fields}
                                    versionId={versionId}
                                />
                            </Box>
                        )}
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
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            pr={2}
                            pb={2}
                            mt={-2}
                        >
                            {`${formatThousand(
                                workflowVersion?.changes.length ?? 0,
                            )} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
