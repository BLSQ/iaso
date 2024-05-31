import React from 'react';
import { AddButton, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDefaultSourceVersion } from './utils';
import { DataSourceDialogComponent } from './components/DataSourceDialogComponent';
import { baseUrls } from '../../constants/urls.ts';
import { useDataSourcesTableColumns } from './config';
import { SOURCE_WRITE } from '../../utils/permissions.ts';
import MESSAGES from './messages';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm.tsx';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink.tsx';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';
import { useGetDataSources } from './useGetDataSources.ts';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const DataSources = () => {
    const params = useParamsObject(baseUrl);
    const { formatMessage } = useSafeIntl();
    const defaultSourceVersion = useDefaultSourceVersion();
    const columns = useDataSourcesTableColumns(defaultSourceVersion);
    const { data, isFetching: loading } = useGetDataSources(params);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.dataSources)}
                displayBackButton={false}
            />
            <ErrorBoundary>
                <DisplayIfUserHasPerm permissions={[SOURCE_WRITE]}>
                    <DataSourceDialogComponent
                        defaultSourceVersion={defaultSourceVersion}
                        renderTrigger={({ openDialog }) => (
                            <AddButton
                                onClick={openDialog}
                                dataTestId="create-datasource-button"
                            />
                        )}
                    />
                </DisplayIfUserHasPerm>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    params={params}
                    data={data?.sources ?? []}
                    count={data?.count ?? 0}
                    pages={data?.pages ?? 0}
                    columns={columns}
                    defaultSorted={[{ id: defaultOrder, desc: false }]}
                    extraProps={{
                        defaultPageSize: data?.limit ?? 20,
                        loading,
                    }}
                />
            </ErrorBoundary>
        </>
    );
};

export default DataSources;
