import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import moment from 'moment';
import { Box, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQueryClient } from 'react-query';
import { Task } from '../../../../../../../hat/assets/js/apps/Iaso/domains/tasks/types';
import { useGetLatestLQASIMUpdate } from '../../../hooks/useGetLatestLQASIMUpdate';
import { useCreateTask } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/taskMonitor';
import MESSAGES from '../../../constants/messages';

type Props = {
    countryId?: string;
    isLqas: boolean;
};

const LQAS_TASK_ENDPOINT = '/api/polio/tasks/refreshlqas/';
const LQAS_CONFIG_SLUG = 'lqas-pipeline-config';

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
        const updateStatus =
            MESSAGES[lastUpdate.status] &&
            formatMessage(MESSAGES[lastUpdate.status])
                ? formatMessage(MESSAGES[lastUpdate.status])
                : '';
        result.updateStatus = updateStatus;
    }
    return result;
};

export const RefreshLqasData: FunctionComponent<Props> = ({
    countryId,
    isLqas,
}) => {
    const taskUrl = isLqas ? LQAS_TASK_ENDPOINT : undefined;
    const { formatMessage } = useSafeIntl();
    const [lastTaskStatus, setlastTaskStatus] = useState<string | undefined>();
    const queryClient = useQueryClient();
    const { mutateAsync: createRefreshTask } = useCreateTask({
        endpoint: taskUrl,
    });
    const { data: latestManualRefresh } = useGetLatestLQASIMUpdate(
        isLqas,
        countryId,
    );

    const { message: lastUpdate, updateStatus } =
        useLastUpdate(latestManualRefresh);
    const launchRefresh = useCallback(() => {
        if (countryId) {
            createRefreshTask({
                config: { country_id: countryId },
                slug: LQAS_CONFIG_SLUG,
                id_field: { country_id: countryId },
            });
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

    const disableButton = Boolean(latestManualRefresh?.status === 'RUNNING'); // TODO make enum with statuses
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
