import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import DatesRange from '../../../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { useFilterState } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../../../../constants/messages';
import { baseUrls } from '../../../../../constants/urls';
import { AfroMapParams } from '../types';
import { usePeriodOptions } from '../utils';

type Props = {
    params: AfroMapParams;
};

const baseUrl = baseUrls.lqasAfro;
export const LqasAfroMapFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const {
        filters,
        handleSearch,
        filtersUpdated,
        setFiltersUpdated,
        setFilters,
    } = useFilterState({ baseUrl, params, withPagination: false });
    const periodOptions = usePeriodOptions();
    const [chooseDates, setChooseDates] = useState<boolean>(
        Boolean(params.startDate) || Boolean(params.endDate),
    );

    const onSwitchChange = useCallback(() => {
        setFilters({
            ...filters,
            startDate: undefined,
            endDate: undefined,
            period: undefined,
        });

        setChooseDates(!chooseDates);
        setFiltersUpdated(true);
    }, [chooseDates, filters, setFilters, setFiltersUpdated]);

    const handleDateChange = useCallback(
        (keyValue, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [keyValue]: value,
                period: undefined,
            });
        },
        [filters, setFilters, setFiltersUpdated],
    );
    const handlePeriodChange = useCallback(
        (keyValue, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [keyValue]: value,
                startDate: undefined,
                endDate: undefined,
            });
        },
        [filters, setFilters, setFiltersUpdated],
    );

    const infos = formatMessage(MESSAGES.afroMapfilterInfo);
    return (
        <Grid container spacing={2}>
            <Grid item xs={6} md={6}>
                {chooseDates && (
                    <InputWithInfos infos={infos}>
                        <DatesRange
                            onChangeDate={handleDateChange}
                            dateFrom={filters.startDate}
                            dateTo={filters.endDate}
                            labelFrom={MESSAGES.latestCampaignFrom}
                            labelTo={MESSAGES.latestCampaignUntil}
                            keyDateFrom="startDate"
                            keyDateTo="endDate"
                        />
                    </InputWithInfos>
                )}
                {!chooseDates && (
                    <InputWithInfos infos={infos}>
                        <InputComponent
                            type="select"
                            multi={false}
                            keyValue="period"
                            clearable={false}
                            value={filters.period ?? '6months'}
                            onChange={handlePeriodChange}
                            options={periodOptions}
                            labelString={formatMessage(
                                MESSAGES.latestCampaignForPeriod,
                            )}
                        />
                    </InputWithInfos>
                )}
                <FormGroup>
                    <FormControlLabel
                        label={formatMessage(MESSAGES.chooseDates)}
                        style={{ width: 'max-content' }}
                        control={
                            <Switch
                                size="medium"
                                checked={chooseDates}
                                onChange={onSwitchChange}
                                color="primary"
                            />
                        }
                    />
                </FormGroup>
            </Grid>
            <Grid container item xs={12} sm={6} justifyContent="flex-end">
                <Box mt={2}>
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
