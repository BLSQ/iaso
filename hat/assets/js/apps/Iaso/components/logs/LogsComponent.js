import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { fetchLogs } from '../../utils/requests';

import SingleTable from '../tables/SingleTable';

import { orgUnitsLogsColumns } from '../../domains/orgUnits/config';
import LogsDetails from './LogsDetailsComponent';

import { baseUrls } from '../../constants/urls';

const baseUrl = baseUrls.orgUnitDetails;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
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
                contentType: 'iaso.orgunit',
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
