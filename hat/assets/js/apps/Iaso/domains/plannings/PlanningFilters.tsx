import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent, useState } from 'react';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { FilterButton } from '../../components/FilterButton';
import DatesRange from '../../components/filters/DatesRange';
import InputComponent from '../../components/forms/InputComponent';
import { useFilterState } from '../../hooks/useFilterState';
import { PlanningParams } from './types';
import MESSAGES from './messages';
import { publishingStatuses } from './constants';
import { baseUrls } from '../../constants/urls';

type Props = {
    params: PlanningParams;
};

const statusOptions = (formatMessage: IntlFormatMessage) => {
    return publishingStatuses.map(status => {
        return {
            value: status,
            label: formatMessage(MESSAGES[status]),
        };
    });
};
const baseUrl = baseUrls.planning;
export const PlanningFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Grid container spacing={0}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            keyValue="search"
                            onChange={handleChange}
                            value={filters.search}
                            type="search"
                            label={MESSAGES.search}
                            onEnterPressed={handleSearch}
                            onErrorChange={setTextSearchError}
                            blockForbiddenChars
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DatesRange
                            onChangeDate={handleChange}
                            dateFrom={filters.dateFrom}
                            dateTo={filters.dateTo}
                            labelFrom={MESSAGES.startDatefrom}
                            labelTo={MESSAGES.endDateUntil}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            type="select"
                            multi={false}
                            keyValue="publishingStatus"
                            onChange={handleChange}
                            value={filters.publishingStatus}
                            options={statusOptions(formatMessage)}
                            label={MESSAGES.publishingStatus}
                        />
                    </Grid>
                    <Grid container item xs={12} justifyContent="flex-end">
                        <Box mt={2} mb={2}>
                            <FilterButton
                                disabled={textSearchError || !filtersUpdated}
                                onFilter={handleSearch}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
