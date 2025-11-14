import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import { SearchButton } from 'Iaso/components/SearchButton';
import DatesRange from '../../../components/filters/DatesRange';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';

import { useGetTaskTypes } from '../hooks/api';
import { useStatusOptions } from '../hooks/useStatusOptions';
import MESSAGES from '../messages';
import { TaskParams } from '../types';

const baseUrl = baseUrls.tasks;
type Props = { params: TaskParams };

export const TaskFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const { data: taskTypes, isLoading: loadingTaskTypes } = useGetTaskTypes();

    const statusOptions = useStatusOptions();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    keyValue="taskType"
                    value={filters.taskType}
                    onChange={handleChange}
                    options={taskTypes}
                    labelString={formatMessage(MESSAGES.taskType)}
                    loading={loadingTaskTypes}
                />
                <InputComponent
                    type="select"
                    multi
                    clearable
                    keyValue="status"
                    value={filters.status}
                    onChange={handleChange}
                    options={statusOptions}
                    labelString={formatMessage(MESSAGES.status)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <DatesRange
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    keyDateFrom="startDate"
                    keyDateTo="endDate"
                    onChangeDate={handleChange}
                    dateFrom={filters.startDate}
                    dateTo={filters.endDate}
                    labelFrom={MESSAGES.dateFrom}
                    labelTo={MESSAGES.dateTo}
                />
            </Grid>

            <Grid item xs={12} md={4} lg={3}>
                <Box mt={2}>
                    <UserAsyncSelect
                        handleChange={handleChange}
                        filterUsers={filters.users}
                    />
                </Box>
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
