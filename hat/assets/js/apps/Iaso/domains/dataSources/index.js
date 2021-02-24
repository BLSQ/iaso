import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAllDataSources } from '../../utils/requests';

import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';

import { baseUrls } from '../../constants/urls';

import dataSourcesTableColumns from './config';
import { useSafeIntl } from '../../hooks/intl';
import { fetchAllProjects } from '../projects/actions';
import MESSAGES from './messages';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const DataSources = () => {
    const [forceRefresh, setForceRefresh] = useState(false);
    const dispatch = useDispatch();
    const intl = useSafeIntl();
    useEffect(() => {
        dispatch(fetchAllProjects());
    }, []);
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
                columns={dataSourcesTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                )}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                extraComponent={
                    <DataSourceDialogComponent
                        titleMessage={MESSAGES.createDataSource}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent onClick={openDialog} />
                        )}
                        onSuccess={() => setForceRefresh(true)}
                    />
                }
            />
        </>
    );
};

export default DataSources;
