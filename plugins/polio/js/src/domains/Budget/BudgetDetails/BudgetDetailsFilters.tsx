import React, { FunctionComponent } from 'react';
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { UrlParams, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { useFilterState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../constants/messages';
import { baseUrls } from '../../../constants/urls';

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
            baseUrl: baseUrls.budgetDetails,
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
                        keyValue="show_hidden"
                        labelString={formatMessage(MESSAGES.showHidden)}
                        onChange={(keyValue, newValue) => {
                            setShowHidden(newValue);
                            handleChange(keyValue, newValue);
                        }}
                        value={showHidden}
                        withMarginTop={false}
                    />
                </Grid>
                <Grid container item xs={12} md={8} justifyContent="flex-end">
                    <Box mt={2} mb={isXSLayout ? 2 : 0}>
                        <SearchButton
                            disabled={!filtersUpdated}
                            onSearch={handleSearch}
                            size={buttonSize}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
