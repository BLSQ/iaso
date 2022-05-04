import { Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../components/FilterButton';
import DatesRange from '../../components/filters/DatesRange';
import InputComponent from '../../components/forms/InputComponent';
import { useFilterState } from './hooks/useFilterState';
import { PlanningParams } from './types';
import MESSAGES from './messages';
import { IntlFormatMessage } from '../../types/intl';
import { publishingStatuses } from './constants';

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

export const PlanningFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(params);
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={3}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.dateFrom}
                        dateTo={filters.dateTo}
                        labelFrom={MESSAGES.from}
                        labelTo={MESSAGES.to}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="publishingStatus"
                        onChange={handleChange}
                        value={filters.publishingStatus}
                        options={statusOptions(formatMessage)}
                        label={MESSAGES.publishingStatus}
                        // loading={fetchingEntitytypes}
                    />
                </Grid>
                <Grid item xs={3}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Grid>
            </Grid>
        </>
    );
};
