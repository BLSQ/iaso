import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@material-ui/core';
import { LQAS_AFRO_MAP_URL } from '../../../../constants/routes';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import DatesRange from '../../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import MESSAGES from '../../../../constants/messages';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { AfroMapParams } from '../types';

const baseUrl = LQAS_AFRO_MAP_URL;
type Props = {
    params: AfroMapParams;
};

export const LqasAfroMapFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: false });
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={6} md={6}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.startDate}
                        dateTo={filters.endDate}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                        keyDateFrom="startDate"
                        keyDateTo="endDate"
                    />
                </Grid>
                <Grid container item xs={12} md={6} justifyContent="flex-end">
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
