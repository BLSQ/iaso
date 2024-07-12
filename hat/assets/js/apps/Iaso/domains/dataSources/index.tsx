import React, { FunctionComponent } from 'react';
import {
    AddButton,
    commonStyles,
    useSafeIntl,
    ErrorBoundary,
} from 'bluesquare-components';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { useDefaultSourceVersion } from './utils';
import { DataSourceDialogComponent } from './components/DataSourceDialogComponent';
import { baseUrls } from '../../constants/urls';
import { useDataSourcesTableColumns } from './config';
import { SOURCE_WRITE } from '../../utils/permissions';
import MESSAGES from './messages';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useGetDataSources } from './useGetDataSources';

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
    };
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
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
                <Box className={classes.containerFullHeightNoTabPadded}>
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
