import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { fetchLogs } from '../../utils/requests';

import SingleTable from '../tables/SingleTable';

import { orgUnitsLogsColumns } from '../../domains/orgUnits/config';
import LogsDetails from './LogsDetailsComponent';
import commonStyles from '../../styles/common';

import { baseUrls } from '../../constants/urls';
import { useSafeIntl } from 'bluesquare-components';

const baseUrl = baseUrls.orgUnitDetails;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginBottom: theme.spacing(2),
    },
}));

const Logs = ({ goToRevision, logObjectId }) => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const [forceRefresh, setForceRefresh] = useState(false);
    return (
        <SingleTable
            paramsPrefix="logsParams"
            apiParams={{
                objectId: logObjectId,
                source: 'org_unit_api',
            }}
            baseUrl={baseUrl}
            endPointPath="logs"
            exportButtons={false}
            dataKey="list"
            forceRefresh={forceRefresh}
            onForceRefreshDone={() => setForceRefresh(false)}
            fetchItems={fetchLogs}
            defaultSorted={[{ id: 'created_at', desc: true }]}
            columns={orgUnitsLogsColumns(intl.formatMessage, classes)}
            subComponent={log =>
                log ? (
                    <LogsDetails
                        logId={log.id}
                        goToRevision={revision => {
                            goToRevision(revision).then(() => {
                                setForceRefresh(true);
                            });
                        }}
                    />
                ) : null
            }
        />
    );
};

Logs.propTypes = {
    logObjectId: PropTypes.number.isRequired,
    goToRevision: PropTypes.func.isRequired,
};

export default Logs;
