import React from 'react';

import { useSafeIntl } from 'bluesquare-components';
import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';

import { baseUrls } from '../../constants/urls';

import devicesTableColumns from './config';
import MESSAGES from './messages';
import { fetchDevicesAsDict } from '../../utils/requests';

const baseUrl = baseUrls.devices;

const Devices = () => {
    const intl = useSafeIntl();

    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.devices)}
                displayBackButton={false}
            />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="devices"
                dataKey="devices"
                fetchItems={fetchDevicesAsDict}
                columns={devicesTableColumns(intl.formatMessage)}
                hideGpkg
                exportButtons={false}
            />
        </>
    );
};

export default Devices;
