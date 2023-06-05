/* eslint-disable react/require-default-props */
/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, UrlParams } from 'bluesquare-components';
import { Box, Grid, useMediaQuery, useTheme } from '@material-ui/core';
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
    showHidden: boolean;
    // eslint-disable-next-line no-unused-vars
    setShowHidden: (show: boolean) => void;
};
export const BudgetDetailsFilters: FunctionComponent<Props> = ({
    params,
    buttonSize = 'medium',
    stepsList = [],
    showHidden,
    setShowHidden,
}) => {
    const { formatMessage } = useSafeIntl();
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
                <Grid item xs={12} md={4}>
                    <InputComponent
                        keyValue="transition_key"
                        onChange={handleChange}
                        type="select"
                        options={stepsList}
                        multi={false}
                        value={filters.transition_key}
                        label={MESSAGES.filter}
                    />
                    <InputComponent
                        type="checkbox"
                        keyValue="showHidden"
                        labelString={formatMessage(MESSAGES.showHidden)}
                        onChange={(_keyValue, newValue) => {
                            setShowHidden(newValue);
                        }}
                        value={showHidden}
                        withMarginTop={false}
                    />
                </Grid>
                <Grid container item xs={12} md={8} justifyContent="flex-end">
                    <Box mt={2} mb={isXSLayout ? 2 : 0}>
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
