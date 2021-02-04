import React from 'react';

import { fetchAllDataSources } from '../../utils/requests';

import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';

import { baseUrls } from '../../constants/urls';

import dataSourcesTableColumns from './config';
import { useSafeIntl } from '../../hooks/intl';
import MESSAGES from './messages';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const DataSources = () => {
    const intl = useSafeIntl();
    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.dataSources)}
                displayBackButton={false}
            />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="datasources"
                exportButtons={false}
                dataKey="sources"
                fetchItems={fetchAllDataSources}
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={dataSourcesTableColumns(intl.formatMessage, this)}
            />
        </>
    );
};

export default DataSources;
