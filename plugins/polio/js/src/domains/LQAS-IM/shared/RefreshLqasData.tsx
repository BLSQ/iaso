import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import moment from 'moment';
import { Box, Button } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useQueryClient } from 'react-query';
import {
    Task,
    TaskApiResponse,
} from '../../../../../../hat/assets/js/apps/Iaso/domains/tasks/types';
import { useGetLatestLQASIMUpdate } from '../../hooks/useGetLatestLQASIMUpdate';
import {
    useCreateTask,
    useTaskMonitor,
} from '../../../../../../hat/assets/js/apps/Iaso/hooks/taskMonitor';
import MESSAGES from '../../constants/messages';

type Props = {
    countryId?: number;
    category: string;
};

const LQAS_TASK_ENDPOINT = '/api/polio/tasks/refreshlqas/';

const useLastUpdate = (
    lastUpdate: Task<any>,
): { message: string; updateStatus: string } => {
    const { formatMessage } = useSafeIntl();
    const result = { message: '', updateStatus: '' };
    if (lastUpdate?.status === 'RUNNING') {
        result.message = formatMessage(MESSAGES.ongoing);
    }
    if (lastUpdate?.status === 'SUCCESS' && Boolean(lastUpdate?.ended_at)) {
        result.message = `${moment
            .unix(lastUpdate.ended_at as number)
            .format('LTS')}`;
    }
    if (lastUpdate?.status) {
        const updateStatus = formatMessage(MESSAGES[lastUpdate.status])
            ? formatMessage(MESSAGES[lastUpdate.status])
            : '';
        result.updateStatus = updateStatus;
    }
    return result;
};

export const RefreshLqasData: FunctionComponent<Props> = ({
    countryId,
    category,
}) => {
    const taskUrl = category === 'lqas' ? LQAS_TASK_ENDPOINT : undefined;
    const { formatMessage } = useSafeIntl();
    const [taskId, setTaskId] = useState<number>();
    const [lastTaskStatus, setlastTaskStatus] = useState<string | undefined>();
    const queryClient = useQueryClient();
    const { data: isDataUpdating, isFetching: isFetchingTaskStatus } =
        useTaskMonitor({
            taskId,
            endpoint: taskUrl,
            invalidateQueries: [category, 'get-latest-task-run'],
        });
    const { mutateAsync: createRefreshTask } = useCreateTask({
        endpoint: taskUrl,
    });
    const { data: latestManualRefresh } = useGetLatestLQASIMUpdate(
        category,
        countryId,
    );

    const { message: lastUpdate, updateStatus } =
        useLastUpdate(latestManualRefresh);
    const launchRefresh = useCallback(() => {
        if (countryId) {
            createRefreshTask({ country_id: countryId }).then(
                (task: TaskApiResponse<any>) => {
                    setTaskId(task.task.id);
                },
            );
        }
    }, [countryId, createRefreshTask]);

    useEffect(() => {
        if (lastTaskStatus !== latestManualRefresh?.status) {
            if (latestManualRefresh.status === 'SUCCESS') {
                queryClient.invalidateQueries('lqas');
            }
            setlastTaskStatus(latestManualRefresh.status);
        }
    }, [lastTaskStatus, latestManualRefresh?.status, queryClient]);

    const disableButton =
        isDataUpdating ||
        isFetchingTaskStatus ||
        Boolean(latestManualRefresh?.status === 'RUNNING'); // TODO make enum with statuses
    return (
        <>
            {countryId && (
                <>
                    <Box display="flex" justifyContent="flex-end" width="100%">
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={launchRefresh}
                            disabled={disableButton}
                        >
                            <Box mr={1} pt={1}>
                                <RefreshIcon fontSize="small" />
                            </Box>
                            {formatMessage(MESSAGES.refreshLqasData)}
                            {disableButton && (
                                <LoadingSpinner
                                    size={16}
                                    absolute
                                    fixed={false}
                                    transparent
                                />
                            )}
                        </Button>
                    </Box>
                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        width="100%"
                        mt={2}
                    >
                        {`${formatMessage(
                            MESSAGES.latestManualRefresh,
                        )}: ${lastUpdate}`}
                    </Box>
                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        width="100%"
                        mt={1}
                        mb={1}
                    >
                        {`${formatMessage(MESSAGES.status)}: ${updateStatus}`}
                    </Box>
                </>
            )}
        </>
    );
};
