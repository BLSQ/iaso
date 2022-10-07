/* eslint-disable react/require-default-props */
/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Box, Grid, useMediaQuery, useTheme } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { UrlParams } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../constants/routes';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { BudgetEventType } from '../../constants/types';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

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
    buttonSize?: 'medium' | 'small' | 'large' | undefined;
};

// TODO import all step types from API
export const useAllEventsOption = (): DropdownOptions<BudgetEventType>[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            label: formatMessage(MESSAGES.submission) as string,
            value: 'submission',
        },
        {
            label: formatMessage(MESSAGES.comments) as string,
            value: 'comments',
        },
        {
            label: formatMessage(MESSAGES.request) as string,
            value: 'request',
        },
        {
            label: formatMessage(MESSAGES.feedback) as string,
            value: 'feedback',
        },
        {
            label: formatMessage(MESSAGES.transmission) as string,
            value: 'transmission',
        },
        {
            label: formatMessage(MESSAGES.review) as string,
            value: 'review',
        },
        {
            value: 'validation',
            label: formatMessage(MESSAGES.validation),
        },
    ];
};

export const BudgetDetailsFilters: FunctionComponent<Props> = ({
    params,
    buttonSize = 'medium',
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({
            baseUrl: BUDGET_DETAILS,
            params,
            saveSearchInHistory: false,
        });
    // const { data: teams, isFetching } = useGetTeamsDropDown();
    const eventList = useAllEventsOption();
    const theme = useTheme();
    const isXSLayout = useMediaQuery(theme.breakpoints.down('xs'));
    return (
        <Box mb={4}>
            <Grid
                container
                spacing={isXSLayout ? 0 : 2}
                justifyContent="flex-end"
            >
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="type"
                        onChange={handleChange}
                        type="select"
                        options={eventList}
                        multi={false}
                        value={filters.type}
                        label={MESSAGES.eventType}
                    />
                </Grid>
                <Grid
                    container
                    item
                    xs={12}
                    sm={6}
                    md={3}
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
