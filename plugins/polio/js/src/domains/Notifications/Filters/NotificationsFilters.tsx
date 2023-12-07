import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import DatesRange from '../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { NOTIFICATIONS_BASE_URL } from '../../../constants/routes';
import { useFilterState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';

import MESSAGES from '../messages';
import { DropdownsContent, NotificationsParams } from '../types';
import { CreateNotificationModal } from '../Modals/NotificationsCreateEditModal';

type Props = { params: NotificationsParams; dropdownContent: DropdownsContent };

const baseUrl = NOTIFICATIONS_BASE_URL;

export const NotificationsFilters: FunctionComponent<Props> = ({
    params,
    dropdownContent,
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="country"
                    value={filters.country}
                    onChange={handleChange}
                    options={dropdownContent.country}
                    labelString={formatMessage(MESSAGES.labelCountry)}
                />
            </Grid>
            <Grid item xs={12} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="vdpv_category"
                    value={filters.vdpv_category}
                    onChange={handleChange}
                    options={dropdownContent.vdpv_category}
                    labelString={formatMessage(MESSAGES.labelVdpvCategory)}
                />
            </Grid>
            <Grid item xs={12} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="source"
                    value={filters.source}
                    onChange={handleChange}
                    options={dropdownContent.source}
                    labelString={formatMessage(MESSAGES.labelSource)}
                />
            </Grid>
            <Grid item xs={12} lg={3}>
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
                <Box mt={2}>
                    <CreateNotificationModal
                        iconProps={{ message: MESSAGES.modalAddTitle }}
                        dropdownContent={dropdownContent}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
