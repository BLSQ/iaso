import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { NotificationsParams } from '../types';
import { getNotificationsDropdownsContent } from '../hooks/api';
import { NOTIFICATIONS_BASE_URL } from '../../../constants/routes';
import DatesRange from '../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { useFilterState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';

type Props = { params: NotificationsParams };

const baseUrl = NOTIFICATIONS_BASE_URL;

export const NotificationsFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: dropdownContent, isFetching: isFetchingdropdownContent } =
        getNotificationsDropdownsContent();
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
                    options={dropdownContent?.country}
                    loading={isFetchingdropdownContent}
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
                    options={dropdownContent?.vdpv_category}
                    loading={isFetchingdropdownContent}
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
                    options={dropdownContent?.source}
                    loading={isFetchingdropdownContent}
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
        </Grid>
    );
};
