import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { IntlFormatMessage } from '../../../../../../hat/assets/js/apps/Iaso/types/intl';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import DatesRange from '../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { BUDGET } from '../../constants/routes';
import { UrlParams } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BudgetStatus } from '../../constants/types';
import { BUDGET_STATUSES } from '../../constants/statuses';

type Props = {
    params: UrlParams & {
        campaignType: string;
        showOnlyDeleted: boolean;
        r1StartTo: string;
        r1StartFrom: string;
        country: any;
        campaign: string;
        // eslint-disable-next-line camelcase
        last_budget_event__status: BudgetStatus;
    };
};

const statusOptions = (formatMessage: IntlFormatMessage) => {
    return BUDGET_STATUSES.map(status => {
        return {
            value: status,
            label: formatMessage(MESSAGES[status]),
        };
    });
};
const baseUrl = BUDGET;
export const BudgetFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(baseUrl, params);
    const { formatMessage } = useSafeIntl();
    return (
        <Box mb={4}>
            <Grid container spacing={2}>
                {/* <Grid container item spacing={2} xs={12} lg={11}> */}
                <Grid item xs={6} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="last_budget_event__status"
                        onChange={handleChange}
                        value={filters.last_budget_event__status}
                        options={statusOptions(formatMessage)}
                        label={MESSAGES.status}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.startdateFrom}
                        dateTo={filters.endDateUntil}
                        labelFrom={MESSAGES.R1StartFrom}
                        labelTo={MESSAGES.R1StartTo}
                        keyDateFrom="r1StartFrom"
                        keyDateTo="r1StartTo"
                    />
                </Grid>
                <Grid container item xs={12} md={1} justifyContent="flex-end">
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
            {/* <Grid container item xs={2} lg={1} justifyContent="flex-end"> */}
            {/* </Grid> */}
        </Box>
    );
};
