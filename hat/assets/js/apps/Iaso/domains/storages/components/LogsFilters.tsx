import { Box, Grid } from '@mui/material';
import React, { FunctionComponent } from 'react';
import {
    DatePicker,
    useSafeIntl,
    IntlFormatMessage,
} from 'bluesquare-components';

// @ts-ignore
import { apiDateFormat } from 'Iaso/utils/dates';
import { FilterButton } from '../../../components/FilterButton';
import InputComponent from '../../../components/forms/InputComponent';

import { StorageDetailsParams } from '../types/storages';

import { useFilterState } from '../../../hooks/useFilterState';
import { useGetOperationsTypes } from '../hooks/useGetOperationsTypes';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: StorageDetailsParams;
};

const baseUrl = baseUrls.storageDetail;
export const LogsFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, saveSearchInHistory: false });
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const operationTypes = useGetOperationsTypes();
    return (
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <InputComponent
                        type="select"
                        multi
                        keyValue="operationType"
                        onChange={handleChange}
                        value={filters.operationType}
                        label={MESSAGES.operationType}
                        options={operationTypes}
                    />
                </Grid>
                <Grid item xs={4}>
                    <Box mt={2}>
                        <DatePicker
                            label={formatMessage(MESSAGES.date)}
                            clearMessage={MESSAGES.clear}
                            currentDate={filters.performedAt || null}
                            onChange={date => {
                                handleChange(
                                    'performedAt',
                                    date ? date.format(apiDateFormat) : null,
                                );
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={2}>
                <FilterButton
                    disabled={!filtersUpdated}
                    onFilter={handleSearch}
                />
            </Box>
        </Box>
    );
};
