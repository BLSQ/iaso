import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import * as Permission from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

import { baseUrls } from '../../../../constants/urls';
import { Chronogram } from '../../Chronogram/types';
import { ChronogramTaskMetaData } from '../../types';
import MESSAGES from '../messages';
import { CreateChronogramTaskModal } from '../Modals/ChronogramTaskCreateEditModal';
import { ChronogramTasksParams } from '../types';

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
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
            <DisplayIfUserHasPerm permissions={[Permission.POLIO_CHRONOGRAM]}>
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
            </DisplayIfUserHasPerm>
        </>
    );
};
