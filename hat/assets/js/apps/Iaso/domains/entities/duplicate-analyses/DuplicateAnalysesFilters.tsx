import React, { FC } from 'react';
import { Box, Grid } from '@mui/material';
import DatesRange from 'Iaso/components/filters/DatesRange';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SearchButton } from 'Iaso/components/SearchButton';
import { baseUrls } from 'Iaso/constants/urls';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { PaginationParams } from 'Iaso/types/general';
import { useStatusOptions } from '../../../domains/tasks/hooks/useStatusOptions';
import { ALGORITHM_DROPDOWN } from '../constants';
import { DuplicateAnalysesGETParams } from '../duplicates/hooks/api/useGetDuplicateAnalyses';
import MESSAGES from '../duplicates/messages';

type Params = PaginationParams & DuplicateAnalysesGETParams;

type Props = {
    params: Params;
};

export const DuplicateAnalysesFilters: FC<Props> = ({ params }) => {
    const taskStatusOptions = useStatusOptions();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl: baseUrls.entityDuplicateAnalyses,
            params,
            saveSearchInHistory: false,
        });

    return (
        <Grid container spacing={0}>
            <Grid container item spacing={2}>
                <Grid item xs={12} md={3}>
                    <Box mt={2}>
                        <UserAsyncSelect
                            filterUsers={filters.users}
                            handleChange={handleChange}
                        />
                        <InputComponent
                            type="select"
                            keyValue="algorithm"
                            value={filters.algorithm}
                            onChange={handleChange}
                            onEnterPressed={handleSearch}
                            label={MESSAGES.algorithm}
                            options={ALGORITHM_DROPDOWN}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        keyValue="status"
                        value={filters.status}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.status}
                        options={taskStatusOptions}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        keyDateFrom="start_date"
                        keyDateTo="end_date"
                        onChangeDate={handleChange}
                        dateFrom={filters.start_date}
                        dateTo={filters.end_date}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                    />
                </Grid>
            </Grid>
            <Grid container item xs={12} justifyContent="flex-end" spacing={2}>
                <Box mb={2} mt={2}>
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
