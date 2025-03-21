import React, { FunctionComponent, useMemo } from 'react';
import { Grid } from '@mui/material';
import { Select, useSafeIntl } from 'bluesquare-components';
import { useGetGroupDropdown } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { useFilterState } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import { baseUrls } from '../../../../../constants/urls';
import { singleVaccinesList } from '../../../SupplyChain/constants';
import { useGetCountriesOptions } from '../../../SupplyChain/hooks/api/vrf';
import MESSAGES from '../messages';

const useUsableActionTypeOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.po_action_type),
                value: 'vaccine_arrival_report',
            },
            {
                label: formatMessage(MESSAGES.incident_report),
                value: 'incident_report',
            },
            {
                label: formatMessage(MESSAGES.forma_vials_used),
                value: 'forma_used_vials',
            },
            {
                label: formatMessage(MESSAGES.forma_vials_missing),
                value: 'forma_missing_vials',
            },
            {
                label: formatMessage(MESSAGES.earmarked_stock__created),
                value: 'earmarked_stock__created',
            },
            {
                label: formatMessage(MESSAGES.earmarked_stock__returned),
                value: 'earmarked_stock__returned',
            },
        ];
    }, [formatMessage]);
};
const useUnusableActionTypeOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.forma_vials_used),
                value: 'forma_used_vials',
            },
            {
                label: formatMessage(MESSAGES.incident_report),
                value: 'incident_report',
            },
            {
                label: formatMessage(MESSAGES.destruction_report),
                value: 'destruction_report',
            },
            {
                label: formatMessage(MESSAGES.earmarked_stock__used),
                value: 'earmarked_stock__used',
            },
        ];
    }, [formatMessage]);
};

type Props = {
    params: any;
};

export const Filters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, changeAndSearch } = useFilterState({
        baseUrl: baseUrls.embeddedVaccineStock,
        params,
    });
    const isUsable = params.usable === 'true' || params.usable === undefined;
    const { data: countries, isFetching: isLoadingCountries } =
        useGetCountriesOptions();
    const { data: countryBlocks, isFetching: isLoadingCountryBlocks } =
        useGetGroupDropdown({ blockOfCountries: true });

    const unusableActionTypeOptions = useUnusableActionTypeOptions();
    const usableActionTypeOptions = useUsableActionTypeOptions();
    console.log(filters);
    return (
        <Grid container spacing={2} justifyContent="flex-start">
            <Grid item>
                <Select
                    multi={false}
                    keyValue="country_block"
                    label={formatMessage(MESSAGES.country)}
                    clearable
                    value={filters.country}
                    loading={isLoadingCountryBlocks}
                    // renderOption={renderOption}
                    // getOptionLabel={getOptionLabel}
                    // getOptionSelected={getOptionSelected}
                    options={countryBlocks}
                    onChange={newValue =>
                        changeAndSearch('country_block', newValue)
                    }
                    // placeholder={placeholder}
                />
            </Grid>
            <Grid item>
                <Select
                    multi={false}
                    keyValue="country"
                    label={formatMessage(MESSAGES.country)}
                    clearable
                    value={filters.country}
                    loading={isLoadingCountries}
                    // renderOption={renderOption}
                    // getOptionLabel={getOptionLabel}
                    // getOptionSelected={getOptionSelected}
                    options={countries}
                    onChange={newValue => changeAndSearch('country', newValue)}
                    // placeholder={placeholder}
                />
            </Grid>
            <Grid item>
                <Select
                    multi={false}
                    keyValue="vaccine"
                    label={formatMessage(MESSAGES.vaccine)}
                    clearable
                    value={filters.vaccine}
                    loading={isLoadingCountryBlocks}
                    // renderOption={renderOption}
                    // getOptionLabel={getOptionLabel}
                    // getOptionSelected={getOptionSelected}
                    options={singleVaccinesList}
                    onChange={newValue => changeAndSearch('vaccine', newValue)}
                    // placeholder={placeholder}
                />
            </Grid>
            <Grid item>
                <Select
                    multi={false}
                    keyValue="vaccine"
                    label={formatMessage(MESSAGES.vaccine)}
                    clearable
                    value={filters.vaccine}
                    loading={isLoadingCountryBlocks}
                    // renderOption={renderOption}
                    // getOptionLabel={getOptionLabel}
                    // getOptionSelected={getOptionSelected}
                    options={singleVaccinesList}
                    onChange={newValue => changeAndSearch('vaccine', newValue)}
                    // placeholder={placeholder}
                />
            </Grid>
            <Grid item>
                <Select
                    multi={false}
                    keyValue="action_type"
                    label={formatMessage(MESSAGES.actionType)}
                    clearable
                    value={filters.action_type}
                    loading={isLoadingCountryBlocks}
                    // renderOption={renderOption}
                    // getOptionLabel={getOptionLabel}
                    // getOptionSelected={getOptionSelected}
                    options={
                        isUsable
                            ? usableActionTypeOptions
                            : unusableActionTypeOptions
                    }
                    onChange={newValue =>
                        changeAndSearch('action_type', newValue)
                    }
                    // placeholder={placeholder}
                />
            </Grid>
        </Grid>
    );
};
