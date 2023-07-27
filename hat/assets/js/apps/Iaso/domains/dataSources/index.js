import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';

import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchAllDataSources } from '../../utils/requests';
import { getDefaultSourceVersion } from './utils';

import SingleTable from '../../components/tables/SingleTable';
import { DataSourceDialogComponent } from './components/DataSourceDialogComponent';

import { baseUrls } from '../../constants/urls';
import { toggleSidebarMenu } from '../../redux/sidebarMenuReducer';

import { dataSourcesTableColumns } from './config';

import MESSAGES from './messages';
import { useCurrentUser } from '../../utils/usersUtils.ts';

import { userHasPermission } from '../users/utils';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';
const DataSources = () => {
    const [forceRefresh, setForceRefresh] = useState(false);
    const currentUser = useCurrentUser();
    const dispatch = useDispatch();
    const intl = useSafeIntl();
    const defaultSourceVersion = getDefaultSourceVersion(currentUser);

    const dataSourceDialog = () => {
        if (userHasPermission('iaso_write_sources', currentUser)) {
            return (
                <DataSourceDialogComponent
                    defaultSourceVersion={defaultSourceVersion}
                    renderTrigger={({ openDialog }) => (
                        <AddButtonComponent
                            onClick={openDialog}
                            dataTestId="create-datasource-button"
                        />
                    )}
                    onSuccess={() => setForceRefresh(true)}
                />
            );
        }
        return '';
    };
    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.dataSources)}
                displayBackButton={false}
                toggleSidebar={() => dispatch(toggleSidebarMenu())}
            />
            <ErrorBoundary>
                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="datasources"
                    exportButtons={false}
                    dataKey="sources"
                    defaultPageSize={20}
                    fetchItems={fetchAllDataSources}
                    defaultSorted={[{ id: defaultOrder, desc: false }]}
                    columns={dataSourcesTableColumns(
                        intl.formatMessage,
                        setForceRefresh,
                        defaultSourceVersion,
                    )}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => setForceRefresh(false)}
                    extraComponent={dataSourceDialog()}
                />
            </ErrorBoundary>
        </>
    );
};

export default DataSources;
