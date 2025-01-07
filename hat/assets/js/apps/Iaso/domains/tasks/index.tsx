import React from 'react';
import { Box, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Autorenew from '@mui/icons-material/Autorenew';

import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { getRequest, patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { TaskDetails } from 'Iaso/domains/tasks/components/TaskDetails';
import { TaskFilters } from './components/Filters';
import MESSAGES from './messages';
import { POLIO_NOTIFICATIONS } from '../../utils/permissions';
import { useCurrentUser } from '../../utils/usersUtils';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { userHasPermission } from '../users/utils';
import { useTasksTableColumns } from './config';
import { Task, TaskParams } from './types';
import { makeUrlWithParams } from '../../libs/utils';

const baseUrl = baseUrls.tasks;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Tasks = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as unknown as TaskParams;

    const { mutateAsync: killTaskAction } = useSnackMutation(
        (task: Task<any>) => patchRequest(`/api/tasks/${task.id}/`, task),
        MESSAGES.patchTaskSuccess,
        MESSAGES.patchTaskError,
        ['tasks'],
    );

    const { mutateAsync: relaunchTaskAction } = useSnackMutation(
        (task: Task<any>) =>
            patchRequest(`/api/tasks/${task.id}/relaunch/`, task),
        MESSAGES.patchTaskSuccess,
        MESSAGES.patchTaskError,
        ['tasks'],
    );

    const urlParams = {
        limit: params.pageSize ? params.pageSize : 10,
        order: params.order,
        page: params.page ? params.page : 1,
        users: params.users,
        start_date: params.startDate,
        end_date: params.endDate,
        task_type: params.taskType,
        status: params.status,
    };

    const {
        data,
        isLoading,
        refetch: setForceRefresh,
    } = useSnackQuery(
        ['tasks', params],
        () => getRequest(makeUrlWithParams('/api/tasks/', urlParams)),
        MESSAGES.fetchTasksError,
    );

    const hasPolioNotificationsPerm = userHasPermission(
        POLIO_NOTIFICATIONS,
        useCurrentUser(),
    );

    const columns = useTasksTableColumns(
        killTaskAction,
        relaunchTaskAction,
        hasPolioNotificationsPerm,
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.tasks)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TaskFilters params={params} />
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        id="refresh-button"
                        variant="contained"
                        color="primary"
                        onClick={setForceRefresh}
                    >
                        <Autorenew className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.refresh)}
                    </Button>
                </Box>
                <TableWithDeepLink
                    data={data?.tasks ?? []}
                    pages={data?.pages}
                    count={data?.count}
                    params={params}
                    columns={columns}
                    baseUrl={baseUrl}
                    extraProps={{
                        loading: isLoading,
                        SubComponent: (task: Task<any>) => {
                            return task ? <TaskDetails task={task} /> : null;
                        },
                    }}
                />
            </Box>
        </>
    );
};

export default Tasks;
