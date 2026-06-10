import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddButton,
    commonStyles,
    useSafeIntl,
    ErrorBoundary,
} from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { SOURCE_WRITE } from '../../utils/permissions';
import { DataSourceDialogComponent } from './components/DataSourceDialogComponent';
import { Filters } from './components/Filters';
import { useDataSourcesTableColumns } from './config';
import MESSAGES from './messages';
import { useGetDataSources } from './useGetDataSources';
import { useDefaultSourceVersion } from './utils';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const useStyles = makeStyles(theme => {
    return {
        containerFullHeightNoTabPadded:
            commonStyles(theme).containerFullHeightNoTabPadded,
    };
});

const DataSources: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as {
        accountId?: string;
        page?: string;
        pageSize?: string;
        order?: string;
        projectIds?: string;
    };
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const defaultSourceVersion = useDefaultSourceVersion();
    const columns: any = useDataSourcesTableColumns(defaultSourceVersion);
    const { data, isFetching: loading } = useGetDataSources(params);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.dataSources)}
                displayBackButton={false}
            />
            <ErrorBoundary>
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Filters params={params} baseUrl={baseUrl} />
                    <DisplayIfUserHasPerm permissions={[SOURCE_WRITE]}>
                        <Box
                            display="inline-flex"
                            justifyContent="flex-end"
                            style={{ width: '100%' }}
                        >
                            <DataSourceDialogComponent
                                defaultSourceVersion={defaultSourceVersion}
                                renderTrigger={({ openDialog }) => (
                                    <AddButton
                                        onClick={openDialog}
                                        dataTestId="create-datasource-button"
                                    />
                                )}
                            />
                        </Box>
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
                </Box>
            </ErrorBoundary>
        </>
    );
};

export default DataSources;
