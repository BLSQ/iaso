import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { SearchButton } from 'Iaso/components/SearchButton';
import DatesRange from '../../../components/filters/DatesRange';
import { AsyncSelect } from '../../../components/forms/AsyncSelect';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFilterState } from '../../../hooks/useFilterState';
import { DropdownOptions } from '../../../types/utils';
import { getUsersDropDown } from '../../instances/hooks/requests/getUsersDropDown';
import { useGetProfilesDropdown } from '../../instances/hooks/useGetProfilesDropdown';

import { useGetTaskTypes } from '../hooks/api';
import MESSAGES from '../messages';
import { TaskParams } from '../types';

const baseUrl = baseUrls.tasks;
type Props = { params: TaskParams };

export const TaskFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const { data: taskTypes, isLoading: loadingTaskTypes } = useGetTaskTypes();
    const { data: selectedUsers } = useGetProfilesDropdown(filters.users);
    const handleChangeUsers = useCallback(
        (keyValue, newValue) => {
            const joined = newValue?.map(r => r.value)?.join(',');
            handleChange(keyValue, joined);
        },
        [handleChange],
    );

    const statusOptions: DropdownOptions<string>[] = useMemo(() => {
        return [
            'RUNNING',
            'QUEUED',
            'SUCCESS',
            'KILLED',
            'SKIPPED',
            'EXPORTED',
            'ERRORED',
        ].map(status => ({
            label: formatMessage(MESSAGES[status.toLowerCase()]),
            value: status,
        }));
    }, [formatMessage]);

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
                    <AsyncSelect
                        keyValue="users"
                        label={MESSAGES.user}
                        value={selectedUsers ?? ''}
                        onChange={handleChangeUsers}
                        debounceTime={500}
                        multi
                        fetchOptions={input => getUsersDropDown(input)}
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
