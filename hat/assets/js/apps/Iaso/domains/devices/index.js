import React from 'react';

import SingleTable from '../../components/tables/SingleTable';
import TopBar from '../../components/nav/TopBarComponent';

import { baseUrls } from '../../constants/urls';

import devicesTableColumns from './config';
import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';
import { fetchDevicesAsDict } from '../../utils/requests';

const baseUrl = baseUrls.devices;
const defaultOrder = 'synched_at';

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
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={devicesTableColumns(intl.formatMessage)}
                hideGpkg
                exportButtons={false}
            />
        </>
    );
};

export default Devices;
