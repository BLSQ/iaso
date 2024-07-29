import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';

import MESSAGES from '../messages';
import { Chronogram } from '../../Chronogram/types';
import { ChronogramTaskMetaData } from '../../types';
import { ChronogramTasksParams } from '../types';
import { CreateChronogramTaskModal } from '../Modals/ChronogramTaskCreateEditModal';
import { baseUrls } from '../../../../constants/urls';

type Props = {
    params: ChronogramTasksParams;
    chronogram: Chronogram;
    chronogramTaskMetaData: ChronogramTaskMetaData;
};

const baseUrl = baseUrls.chronogramDetails;

export const ChronogramDetailsFilters: FunctionComponent<Props> = ({
    params,
    chronogram,
    chronogramTaskMetaData,
}) => {
    const { formatMessage } = useSafeIntl();

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4} lg={4}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="period"
                        value={filters.period}
                        onChange={handleChange}
                        options={chronogramTaskMetaData.period}
                        labelString={formatMessage(MESSAGES.labelPeriod)}
                    />
                </Grid>
                <Grid item xs={12} md={4} lg={4}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="status"
                        value={filters.status}
                        onChange={handleChange}
                        options={chronogramTaskMetaData.status}
                        labelString={formatMessage(MESSAGES.labelStatus)}
                    />
                </Grid>
            </Grid>
            <Grid container item justifyContent="flex-end">
                <Box mt={2}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
            <Grid container item justifyContent="flex-end" mt={4}>
                <CreateChronogramTaskModal
                    iconProps={{
                        message: MESSAGES.modalAddTitle,
                    }}
                    chronogram={chronogram as Chronogram}
                    chronogramTaskMetaData={
                        chronogramTaskMetaData as ChronogramTaskMetaData
                    }
                />
            </Grid>
        </>
    );
};
