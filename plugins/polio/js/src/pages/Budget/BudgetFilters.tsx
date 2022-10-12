/* eslint-disable react/require-default-props */
import { Box, Grid, useMediaQuery, useTheme } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { BUDGET } from '../../constants/routes';
import { UrlParams } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BudgetStatus } from '../../constants/types';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    params: UrlParams & {
        campaignType: string;
        showOnlyDeleted: boolean;
        roundStartTo: string;
        roundStartFrom: string;
        country: any;
        campaign: string;
        // eslint-disable-next-line camelcase
        last_budget_event__status: BudgetStatus;
    };
    statesList?: DropdownOptions<string>[];
    buttonSize?: 'medium' | 'small' | 'large' | undefined;
};

const baseUrl = BUDGET;
export const BudgetFilters: FunctionComponent<Props> = ({
    params,
    buttonSize = 'medium',
    statesList = [],
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const theme = useTheme();
    const isXSLayout = useMediaQuery(theme.breakpoints.down('xs'));
    // const isSmLayout = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <Box mb={4}>
            <Grid container spacing={isXSLayout ? 0 : 2}>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="current_state__key"
                        onChange={handleChange}
                        value={filters.current_state__key}
                        options={statesList}
                        label={MESSAGES.status}
                    />
                </Grid>
                {/* <Grid item xs={12} sm={12} md={6}>
                    <Box
                        mt={
                            isSmLayout && !isXSLayout
                                ? -5
                                : (isXSLayout && -2) || 0
                        }
                    >
                        <DatesRange
                            onChangeDate={handleChange}
                            dateFrom={filters.startdateFrom}
                            dateTo={filters.endDateUntil}
                            labelFrom={MESSAGES.RoundStartFrom}
                            labelTo={MESSAGES.RoundStartTo}
                            keyDateFrom="roundStartFrom"
                            keyDateTo="roundStartTo"
                            xs={12}
                        />
                    </Box>
                </Grid> */}
                <Grid container item xs={12} justifyContent="flex-end">
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                            size={buttonSize}
                        />
                    </Box>
                </Grid>
            </Grid>
            {/* <Grid container item xs={2} lg={1} justifyContent="flex-end"> */}
            {/* </Grid> */}
        </Box>
    );
};
