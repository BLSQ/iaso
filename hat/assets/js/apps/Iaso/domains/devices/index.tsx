import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useDevicesTableColumns } from './config';
import MESSAGES from './messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { tableDefaults, useGetDevices } from './hooks/api/useGetDevices';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { DeviceFilters } from './components/DeviceFilters';

const baseUrl = baseUrls.devices;

const useStyles = makeStyles(theme => {
    return {
        containerFullHeightNoTabPadded:
            commonStyles(theme).containerFullHeightNoTabPadded,
    };
});

const Devices: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as {
        page?: string;
        pageSize?: string;
        order?: string;
        accountId?: string;
    };
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const columns = useDevicesTableColumns();
    const { data, isFetching: loading } = useGetDevices(params);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.devices)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <DeviceFilters baseUrl={baseUrl} params={params} />
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    columns={columns}
                    data={data?.devices ?? []}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    count={data?.count ?? 0}
                    pages={data?.pages ?? 0}
                    extraProps={{
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        loading,
                    }}
                />
            </Box>
        </>
    );
};

export default Devices;
