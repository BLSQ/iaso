import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button } from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import moment from 'moment';
import { useQueryClient } from 'react-query';
import { Task } from '../../../../../../../hat/assets/js/apps/Iaso/domains/tasks/types';
import { useCreateTask } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/taskMonitor';
import MESSAGES from '../../../constants/messages';
import { useGetLatestLQASIMUpdate } from '../../../hooks/useGetLatestLQASIMUpdate';
import { IMType } from '../types';

const LQAS_TASK_ENDPOINT = '/api/polio/tasks/refreshlqas/';
const LQAS_CONFIG_SLUG = 'lqas-pipeline-config';
const IM_HH_TASK_ENDPOINT = '/api/polio/tasks/refreshim/hh/';
const IM_HH_CONFIG_SLUG = 'im_hh-pipeline-config';
const IM_OHH_TASK_ENDPOINT = '/api/polio/tasks/refreshim/ohh/';
const IM_OHH_CONFIG_SLUG = 'im_ohh-pipeline-config';
const IM_HH_OHH_TASK_ENDPOINT = '/api/polio/tasks/refreshim/hh_ohh/';
const IM_HH_OHH_CONFIG_SLUG = 'im_hh_ohh-pipeline-config';
const IM_HH_API_PARAM = 'HH';
const IM_OHH_API_PARAM = 'OHH';
const IM_HH_OHH_API_PARAM = 'HH_OHH';

const getImEndpoint = (imType: IMType | 'imHH'): string => {
    switch (imType) {
        case 'imHH':
        case 'imIHH':
            return IM_HH_TASK_ENDPOINT;
        case 'imOHH':
            return IM_OHH_TASK_ENDPOINT;
        case 'imGlobal':
            return IM_HH_OHH_TASK_ENDPOINT;
        default:
            console.warn(
                `Expected IM type to be "imHH", "imOHH" or "imGlobal", got ${imType}`,
            );
            return '';
    }
};

const getImConfigSlug = (imType: IMType | 'imHH'): string => {
    switch (imType) {
        case 'imHH':
        case 'imIHH':
            return IM_HH_CONFIG_SLUG;
        case 'imOHH':
            return IM_OHH_CONFIG_SLUG;
        case 'imGlobal':
            return IM_HH_OHH_CONFIG_SLUG;
        default:
            return '';
    }
};

const getPipelineParam = (imType: IMType | 'imHH'): string => {
    switch (imType) {
        case 'imHH':
        case 'imIHH':
            return IM_HH_API_PARAM;
        case 'imOHH':
            return IM_OHH_API_PARAM;
        case 'imGlobal':
            return IM_HH_OHH_API_PARAM;
        default:
            return '';
    }
};

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

type Props = {
    countryId?: string;
    imType?: IMType;
};

export const RefreshLqasIMData: FunctionComponent<Props> = ({
    countryId,
    imType,
}) => {
    const taskUrl = !imType ? LQAS_TASK_ENDPOINT : getImEndpoint(imType);
    const slug = !imType ? LQAS_CONFIG_SLUG : getImConfigSlug(imType);
    const { formatMessage } = useSafeIntl();
    const [lastTaskStatus, setlastTaskStatus] = useState<string | undefined>();
    const queryClient = useQueryClient();
    const { mutateAsync: createRefreshTask } = useCreateTask({
        endpoint: taskUrl,
    });
    const { data: latestManualRefresh } = useGetLatestLQASIMUpdate(
        countryId,
        imType,
    );

    const { message: lastUpdate, updateStatus } =
        useLastUpdate(latestManualRefresh);
    const launchRefresh = useCallback(() => {
        const config: any = {};
        if (imType) {
            config.im_type = getPipelineParam(imType);
        }
        if (countryId) {
            config.country_id = parseInt(countryId, 10);
            createRefreshTask({
                config,
                slug,
                id_field: { country_id: parseInt(countryId, 10) },
            });
        }
    }, [countryId, createRefreshTask, slug, imType]);

    useEffect(() => {
        if (lastTaskStatus !== latestManualRefresh?.status) {
            if (latestManualRefresh.status === 'SUCCESS') {
                queryClient.invalidateQueries('lqas');
            }
            setlastTaskStatus(latestManualRefresh.status);
        }
    }, [lastTaskStatus, latestManualRefresh?.status, queryClient]);

    const disableButton = Boolean(latestManualRefresh?.status === 'RUNNING'); // TODO make enum with statuses
    const buttonText = !imType
        ? formatMessage(MESSAGES.refreshLqasData)
        : formatMessage(MESSAGES.refreshIMData);
    if (!countryId) return null;
    return (
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
                    {buttonText}
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
            <Box display="flex" justifyContent="flex-end" width="100%" mt={2}>
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
    );
};
