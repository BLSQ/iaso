import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { LQAS_AFRO_MAP_URL } from '../../../../constants/routes';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import DatesRange from '../../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import MESSAGES from '../../../../constants/messages';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';

const baseUrl = LQAS_AFRO_MAP_URL;
type Props = {
    params: {
        accountId: string;
        startDate?: string;
        endDate?: string;
        round: string; // 'latest' or a number in string form
    };
};

const useOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.latest),
                value: 'latest',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 0`,
                value: '0',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 1`,
                value: '1',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 2`,
                value: '2',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 3`,
                value: '3',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 4`,
                value: '4',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 5`,
                value: '5',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 6`,
                value: '6',
            },
        ];
    }, [formatMessage]);
};

export const LqasAfroMapFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: false });
    const options = useOptions();
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={6} md={6}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.startDate}
                        dateTo={filters.endDate}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                        keyDateFrom="startDate"
                        keyDateTo="endDate"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="round"
                        onChange={handleChange}
                        value={filters.round}
                        options={options}
                        label={MESSAGES.round}
                    />
                </Grid>
                <Grid container item xs={12} md={3} justifyContent="flex-end">
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                            // size={buttonSize}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
