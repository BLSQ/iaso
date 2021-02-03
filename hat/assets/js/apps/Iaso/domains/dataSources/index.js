import React from 'react';
import { makeStyles, Box } from '@material-ui/core';

import { fetchAllDataSources } from '../../utils/requests';

import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/urls';

import dataSourcesTableColumns from './config';
import { useSafeIntl } from '../../hooks/intl';
import MESSAGES from './messages';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
}));

const DataSources = () => {
    const intl = useSafeIntl();
    const classes = useStyles();
    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.dataSources)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="datasources"
                    exportButtons={false}
                    dataKey="sources"
                    fetchItems={fetchAllDataSources}
                    defaultSorted={[{ id: defaultOrder, desc: true }]}
                    columns={dataSourcesTableColumns(intl.formatMessage, this)}
                />
            </Box>
        </>
    );
};

export default DataSources;
