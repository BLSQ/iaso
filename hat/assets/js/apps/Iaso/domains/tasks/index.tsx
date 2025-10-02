import React from 'react';
import Autorenew from '@mui/icons-material/Autorenew';
import { Box, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { TaskDetails } from 'Iaso/domains/tasks/components/TaskDetails';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { TaskFilters } from './components/Filters';
import { useTasksTableColumns } from './config';
import MESSAGES from './messages';
import { Task, TaskParams } from './types';

const baseUrl = baseUrls.tasks;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Tasks = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as unknown as TaskParams;

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

    const columns = useTasksTableColumns();

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
                    getObjectId={it => it.id}
                    expanded={{}}
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
