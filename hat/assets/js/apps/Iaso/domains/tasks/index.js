import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { makeStyles, Button } from '@material-ui/core';
import Autorenew from '@material-ui/icons/Autorenew';

import { killTask } from './actions';

import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/urls';

import tasksTableColumns from './config';
import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';
import { fetchTasks } from '../../utils/requests';

const baseUrl = baseUrls.tasks;
const defaultOrder = 'created_at';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginBottom: theme.spacing(2),
    },
}));

const Tasks = () => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const [forceRefresh, setForceRefresh] = useState(false);
    const dispatch = useDispatch();

    const killTaskAction = task => {
        dispatch(killTask(task)).then(() => setForceRefresh(true));
    };

    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.tasks)}
                displayBackButton={false}
            />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="tasks"
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                exportButtons={false}
                dataKey="tasks"
                fetchItems={fetchTasks}
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={tasksTableColumns(intl.formatMessage, killTaskAction)}
                extraComponent={
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setForceRefresh(true)}
                    >
                        <Autorenew className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.refresh} />
                    </Button>
                }
            />
        </>
    );
};

export default Tasks;
