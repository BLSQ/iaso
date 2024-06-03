import React from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls.ts';
import { useDevicesTableColumns } from './config';
import MESSAGES from './messages';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink.tsx';
import { tableDefaults, useGetDevices } from './hooks/api/useGetDevices.tsx';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';

const baseUrl = baseUrls.devices;

const useStyles = makeStyles(theme => {
    return {
        containerFullHeightNoTabPadded:
            commonStyles(theme).containerFullHeightNoTabPadded,
    };
});

const Devices = () => {
    const params = useParamsObject(baseUrl);
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
