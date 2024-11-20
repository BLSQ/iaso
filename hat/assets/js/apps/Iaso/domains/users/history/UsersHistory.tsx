import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from '../messages';
import { UsersHistoryFilters } from './UsersHistoryFilters';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useGetUsersHistory } from '../hooks/useGetUsersHistory';
import { useUsersHistoryColumns } from './useUsersHistoryColumns';
import { UserHistoryLogDetails } from './UserHistoryLogDetails';

const tableDefaults = {
    page: 1,
    limit: 20,
    order: '-created_at',
};

export const UsersHistory: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.usersHistory);
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const columns = useUsersHistoryColumns();
    const { data, isFetching } = useGetUsersHistory(params);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.usersHistory)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <UsersHistoryFilters params={params} />
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrls.usersHistory}
                    params={params}
                    extraProps={{
                        loading: isFetching,
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        // eslint-disable-next-line react/no-unstable-nested-components
                        SubComponent: log => {
                            return log ? (
                                <UserHistoryLogDetails logId={log.id} />
                            ) : null;
                        },
                    }}
                    columnSelectorEnabled
                    columnSelectorButtonType="button"
                />
            </Box>
        </>
    );
};
