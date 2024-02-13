import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Autorenew from '@mui/icons-material/Autorenew';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import PropTypes from 'prop-types';
import { getRequest, patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { TaskDetails } from 'Iaso/domains/tasks/components/TaskDetails';
import tasksTableColumns from './config';
import MESSAGES from './messages';
import { POLIO_NOTIFICATIONS } from '../../utils/permissions.ts';
import { userHasPermission } from '../users/utils';
import { useCurrentUser } from '../../utils/usersUtils.ts';

const baseUrl = baseUrls.tasks;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

/**
 * Get request with params passed as query params
 * Remove undefined params
 * @param {string} url
 * @param {{[p: string]: T}} params
 */
const getRequestParams = (url, params) => {
    const urlSearchParams = new URLSearchParams();

    Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            v.forEach(p => urlSearchParams.append(k, p));
        } else if (v !== undefined) {
            urlSearchParams.append(k, v);
        }
    });

    return getRequest(`${url}/?${urlSearchParams.toString()}`);
};

const defaultOrder = 'created_at';

const Tasks = ({ params }) => {
    const intl = useSafeIntl();
    const classes = useStyles();

    const { mutateAsync: killTaskAction } = useSnackMutation(
        task => patchRequest(`/api/tasks/${task.id}/`, task),
        MESSAGES.patchTaskSuccess,
        MESSAGES.patchTaskError,
        ['tasks'],
    );

    const urlParams = {
        limit: params.pageSize ? params.pageSize : 10,
        order: params.order ? params.order : `-${defaultOrder}`,
        page: params.page ? params.page : 1,
    };
    const {
        data,
        isLoading,
        refetch: setForceRefresh,
    } = useSnackQuery(
        ['tasks', params],
        () => getRequestParams('/api/tasks', urlParams),
        MESSAGES.fetchTasksError,
    );

    const hasPolioNotificationsPerm = userHasPermission(
        POLIO_NOTIFICATIONS,
        useCurrentUser(),
    );

    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.tasks)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        id="refresh-button"
                        variant="contained"
                        color="primary"
                        onClick={setForceRefresh}
                    >
                        <Autorenew className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.refresh} />
                    </Button>
                </Box>
                <TableWithDeepLink
                    data={data?.tasks ?? []}
                    pages={data?.pages}
                    count={data?.count}
                    params={params}
                    columns={tasksTableColumns(
                        intl.formatMessage,
                        killTaskAction,
                        hasPolioNotificationsPerm,
                    )}
                    baseUrl={baseUrl}
                    extraProps={{
                        loading: isLoading,
                        SubComponent: task => {
                            console.log('task', task);
                            return task ? <TaskDetails task={task} /> : null;
                        },
                    }}
                />
            </Box>
        </>
    );
};

Tasks.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Tasks;
