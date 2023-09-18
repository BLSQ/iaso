import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    Box,
    FormControlLabel,
    FormGroup,
    Grid,
    Switch,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { InputWithInfos } from '../../../../../../../../hat/assets/js/apps/Iaso/components/InputWithInfos';
import { LQAS_AFRO_MAP_URL } from '../../../../constants/routes';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import DatesRange from '../../../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { usePeriodOptions } from '../utils';
import { AfroMapParams } from '../types';
import MESSAGES from '../../../../constants/messages';

const baseUrl = LQAS_AFRO_MAP_URL;
type Props = {
    params: AfroMapParams;
};

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
    const [chooseDates, setChooseDates] = useState<boolean>(false);

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
        <>
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
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
