import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
    useEffect,
} from 'react';
import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
    // @ts-ignore
    formatThousand,
    // @ts-ignore
    Column,
    SortableTable,
    useHumanReadableJsonLogic,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import { Box, Grid, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
import orderBy from 'lodash/orderBy';
import uniqWith from 'lodash/uniqWith';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import { useGetWorkflowVersion } from './hooks/requests/useGetWorkflowVersions';

import { useGetWorkflowVersionChanges } from './hooks/requests/useGetWorkflowVersionChanges';
import { useGetQueryBuildersFields } from '../forms/fields/hooks/useGetQueryBuildersFields';
import { useGetQueryBuilderListToReplace } from '../forms/fields/hooks/useGetQueryBuilderListToReplace';

import { useGetFormDescriptor } from '../forms/fields/hooks/useGetFormDescriptor';
import { useBulkUpdateWorkflowFollowUp } from './hooks/requests/useBulkUpdateWorkflowFollowUp';

import {
    WorkflowVersionDetail,
    WorkflowParams,
    FollowUps,
    Change,
} from './types';

import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import { FollowUpsTable } from './components/followUps/Table';
import { AddFollowUpsModal } from './components/followUps/Modal';
import { AddChangeModal } from './components/changes/Modal';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useGetChangesColumns } from './config/changes';
import { useGetFollowUpsColumns, iasoFields } from './config/followUps';
import { useGetPossibleFieldsByFormVersion } from '../forms/hooks/useGetPossibleFields';
import { PossibleField } from '../forms/types/forms';

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
        setIsFollowUpOrderChange(false),
    );
    const [isFollowUpOrderChange, setIsFollowUpOrderChange] =
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
    const {
        data: changes,
    }: {
        data?: Change[];
    } = useGetWorkflowVersionChanges(params);

    const updateCurrentFollowUps = workflowVersionFollowUps => {
        if (workflowVersionFollowUps) {
            const newFollowUps = orderBy(
                workflowVersionFollowUps,
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
    };

    useEffect(() => {
        updateCurrentFollowUps(workflowVersion?.follow_ups);
    }, [workflowVersion?.follow_ups]);

    const { formVersions: targetPossibleFieldsByVersion } =
        useGetPossibleFieldsByFormVersion(workflowVersion?.reference_form.id);
    const targetPossibleFields: PossibleField[] | undefined = useMemo(() => {
        if (!targetPossibleFieldsByVersion) return undefined;
        return uniqWith(
            targetPossibleFieldsByVersion.flatMap(
                formVersion => formVersion.possible_fields,
            ),
            isEqual,
        );
    }, [targetPossibleFieldsByVersion]);
    const { data: formDescriptors } = useGetFormDescriptor(
        workflowVersion?.reference_form.id,
    );
    const fields = useGetQueryBuildersFields(
        formDescriptors,
        targetPossibleFields,
        iasoFields,
    );
    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );
    const changesColumns = useGetChangesColumns(
        versionId,
        targetPossibleFields,
        targetPossibleFieldsByVersion,
        workflowVersion,
        changes,
    );
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
        setIsFollowUpOrderChange(true);
    }, []);

    const handleResetFollowUpsOrder = useCallback(() => {
        updateCurrentFollowUps(workflowVersion?.follow_ups);
        setIsFollowUpOrderChange(false);
    }, [workflowVersion?.follow_ups]);

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
                <Box mt={2} data-test="follow-ups">
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
                                            columns={
                                                followUpsColumns as Column[]
                                            }
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
                                        disabled={!isFollowUpOrderChange}
                                        data-test="reset-follow-up-order"
                                        onClick={handleResetFollowUpsOrder}
                                        variant="contained"
                                    >
                                        {formatMessage(MESSAGES.resetOrder)}
                                    </Button>
                                </Box>

                                <Box display="inline-block" mr={2}>
                                    <Button
                                        color="primary"
                                        disabled={!isFollowUpOrderChange}
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
                                    iconProps={{
                                        dataTestId: 'create-follow-ups',
                                    }}
                                />
                            </Box>
                        )}
                    </WidgetPaper>
                </Box>
                <Box mt={2} data-test="changes">
                    <WidgetPaper
                        className={classes.infoPaper}
                        title={formatMessage(MESSAGES.changes)}
                    >
                        <Box className={classes.count}>
                            {`${formatThousand(changes?.length ?? 0)} `}
                            {formatMessage(MESSAGES.results)}
                        </Box>
                        <TableWithDeepLink
                            marginTop={false}
                            countOnTop={false}
                            elevation={0}
                            showPagination={false}
                            baseUrl={baseUrls.workflowDetail}
                            data={changes ?? []}
                            pages={1}
                            defaultSorted={[{ id: 'updated_at', desc: false }]}
                            columns={changesColumns}
                            count={changes?.length}
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
                                targetPossibleFieldsByVersion,
                                changesColumns,
                            }}
                        />
                        {workflowVersion?.status === 'DRAFT' && (
                            <Box m={2} textAlign="right">
                                <AddChangeModal
                                    versionId={versionId}
                                    changes={changes || []}
                                    targetPossibleFields={targetPossibleFields}
                                    targetPossibleFieldsByVersion={
                                        targetPossibleFieldsByVersion
                                    }
                                    referenceForm={
                                        workflowVersion?.reference_form
                                    }
                                    iconProps={{
                                        dataTestId: 'create-change',
                                    }}
                                />
                            </Box>
                        )}
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
