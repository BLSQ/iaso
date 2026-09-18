import React, { FunctionComponent } from 'react';
import { Box, useTheme } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';
import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer/index';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useGetUsersHistory } from '../hooks/useGetUsersHistory';
import MESSAGES from '../messages';
import { UserHistoryLogDetails } from './UserHistoryLogDetails';
import { UsersHistoryFilters } from './UsersHistoryFilters';
import { useUsersHistoryColumnSelectDrawer } from './useUsersHistoryColumnSelectDrawer';
import { useUsersHistoryColumns } from './useUsersHistoryColumns';

const tableDefaults = {
    page: 1,
    limit: 20,
    order: '-created_at',
};

export const UsersHistory: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.usersHistory);
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const rawColumns = useUsersHistoryColumns();
    const { data, isFetching } = useGetUsersHistory(params);
    const {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    } = useUsersHistoryColumnSelectDrawer(
        rawColumns,
        params,
        baseUrls.usersHistory,
    );
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.usersHistory)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <UsersHistoryFilters params={params} />
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <ColumnsSelectDrawer
                        options={options}
                        setOptions={setOptions}
                        handleApplyOptions={handleApplyOptions}
                        isDisabled={isDisabled}
                        disabled={false}
                    />
                </Box>
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    columns={visibleColumns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrls.usersHistory}
                    params={params}
                    extraProps={{
                        loading: isFetching,
                        defaultPageSize: data?.limit ?? tableDefaults.limit,

                        SubComponent: log => {
                            return log ? (
                                <UserHistoryLogDetails logId={log.id} />
                            ) : null;
                        },
                    }}
                />
            </Box>
        </>
    );
};
