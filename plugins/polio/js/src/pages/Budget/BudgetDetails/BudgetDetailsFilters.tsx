/* eslint-disable react/require-default-props */
/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Box, Grid, useMediaQuery, useTheme } from '@material-ui/core';
import { UrlParams } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../../constants/routes';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../../constants/messages';
import { FilterButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    params: UrlParams & {
        campaignId?: string;
        campaignName?: string;
        country?: string;
        show_deleted?: string;
        action?: string;
        senderTeam?: string;
        recipient?: string;
        type?: string;
    };
    stepsList?: DropdownOptions<string>[];
    buttonSize?: 'medium' | 'small' | 'large' | undefined;
};

export const BudgetDetailsFilters: FunctionComponent<Props> = ({
    params,
    buttonSize = 'medium',
    stepsList = [],
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl: BUDGET_DETAILS,
            params,
            saveSearchInHistory: false,
        });
    const theme = useTheme();
    const isXSLayout = useMediaQuery(theme.breakpoints.down('xs'));
    return (
        <Box>
            <Grid
                container
                spacing={isXSLayout ? 0 : 2}
                justifyContent="flex-end"
            >
                <Grid item xs={12} sm={6} md={2}>
                    <InputComponent
                        keyValue="transition_key"
                        onChange={handleChange}
                        type="select"
                        options={stepsList}
                        multi={false}
                        value={filters.transition_key}
                        label={MESSAGES.step}
                    />
                </Grid>
                <Grid
                    container
                    item
                    xs={12}
                    sm={6}
                    md={10}
                    justifyContent="flex-end"
                >
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                            size={buttonSize}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
