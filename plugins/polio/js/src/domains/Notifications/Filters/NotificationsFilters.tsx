import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import DatesRange from '../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { NOTIFICATIONS_BASE_URL } from '../../../constants/routes';
import { useFilterState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';

import MESSAGES from '../messages';
import { BulkImportNotificationModal } from '../Modals/NotificationsBulkImportModal';
import { CreateNotificationModal } from '../Modals/NotificationsCreateEditModal';
import { NotificationsMetaData, NotificationsParams } from '../types';

type Props = {
    params: NotificationsParams;
    notificationsMetaData: NotificationsMetaData;
};

const baseUrl = NOTIFICATIONS_BASE_URL;

export const NotificationsFilters: FunctionComponent<Props> = ({
    params,
    notificationsMetaData,
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="country"
                    value={filters.country}
                    onChange={handleChange}
                    options={notificationsMetaData.country}
                    labelString={formatMessage(MESSAGES.labelCountry)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="vdpv_category"
                    value={filters.vdpv_category}
                    onChange={handleChange}
                    options={notificationsMetaData.vdpv_category}
                    labelString={formatMessage(MESSAGES.labelVdpvCategory)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="source"
                    value={filters.source}
                    onChange={handleChange}
                    options={notificationsMetaData.source}
                    labelString={formatMessage(MESSAGES.labelSource)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <DatesRange
                    onChangeDate={handleChange}
                    dateFrom={filters.date_of_onset_after}
                    dateTo={filters.date_of_onset_before}
                    labelFrom={MESSAGES.labelDateOfOnsetAfter}
                    labelTo={MESSAGES.labelDateOfOnsetBefore}
                    keyDateFrom="date_of_onset_after"
                    keyDateTo="date_of_onset_before"
                />
            </Grid>
            <Grid container item xs={12} md={12} justifyContent="flex-end">
                <Box mt={2}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
            <Grid container item xs={12} md={12} justifyContent="flex-end">
                <Box ml={2}>
                    {/* @ts-ignore */}
                    <BulkImportNotificationModal />
                </Box>
                <Box ml={2}>
                    <CreateNotificationModal
                        iconProps={{ message: MESSAGES.modalAddTitle }}
                        notificationsMetaData={notificationsMetaData}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
