import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useQueryClient } from 'react-query';
import { useFilterState } from '../../hooks/useFilterState';
import {
    useGetAlgorithmsOptions,
    useGetDataSources,
    useGetProfilesOptions,
    useSourceOptions,
    useSourceVersionOptions,
} from '../links/hooks/filters';
import InputComponent from '../../components/forms/InputComponent';
import { SearchButton } from '../../components/SearchButton';
import { MESSAGES } from './messages';
import { RefreshButton } from '../../components/Buttons/RefreshButton';

type Props = {
    baseUrl: string;
    params: Record<string, string>;
};

export const AlgoRunsFilters: FunctionComponent<Props> = ({
    baseUrl,
    params,
}) => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('md'));
    const { filters, handleSearch, handleChange, filtersUpdated, setFilters } =
        useFilterState({
            baseUrl,
            params,
            searchActive: 'searchActive',
            saveSearchInHistory: false,
            searchAlwaysEnabled: true,
        });

    const { data: algorithmOptions, isLoading: isLoadingAlgos } =
        useGetAlgorithmsOptions();

    const { data: launchers, isFetching: isLoadingLaunchers } =
        useGetProfilesOptions();

    const { data: sources, isFetching: isLoadingSources } = useGetDataSources();

    const sourceOptions = useSourceOptions(sources);

    const { options: originVersionOptions, disabled: originVersionDisabled } =
        useSourceVersionOptions({ sources, source: filters?.origin });
    const {
        options: destinationVersionOptions,
        disabled: destinationVersionDisabled,
    } = useSourceVersionOptions({
        sources,
        source: filters?.destination,
    });

    const handleSourceUpdate = useCallback(
        (keyValue, value) => {
            if (keyValue === 'origin') {
                const newFilters = {
                    ...filters,
                    origin: value,
                    originVersion: undefined,
                };
                setFilters(newFilters);
            }
            if (keyValue === 'destination') {
                const newFilters = {
                    ...filters,
                    destination: value,
                    destinationVersion: undefined,
                };
                setFilters(newFilters);
            }
        },
        [filters, setFilters],
    );

    const forceRefresh = useCallback(() => {
        queryClient.invalidateQueries('algos');
    }, [queryClient]);

    const disableRefresh = Boolean(
        queryClient.isFetching({ queryKey: 'algos' }),
    );
    const disabled = !filtersUpdated && filters.searchActive === 'true';

    return (
        <Grid container item xs={12}>
            <Grid container item xs={12} md={4} xl={3}>
                <Grid item xs={12}>
                    <Box mr={isXs ? 0 : 2}>
                        <InputComponent
                            dataTestId="links-algo-filter"
                            keyValue="algorithmId"
                            label={MESSAGES.algorithm}
                            type="select"
                            value={filters.algorithmId}
                            onChange={handleChange}
                            options={algorithmOptions}
                            loading={isLoadingAlgos}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Box mr={isXs ? 0 : 2}>
                        <InputComponent
                            keyValue="launcher"
                            label={MESSAGES.launcher}
                            type="select"
                            multi={false}
                            onChange={handleChange}
                            value={filters.launcher}
                            dataTestId="links-validator-filter"
                            options={launchers}
                            loading={isLoadingLaunchers}
                        />
                    </Box>
                </Grid>
            </Grid>
            {/* origin source */}
            <Grid container item xs={12} md={4} xl={3}>
                <Grid item xs={12}>
                    <Box mr={isXs ? 0 : 2}>
                        <InputComponent
                            keyValue="origin"
                            label={MESSAGES.sourceorigin}
                            type="select"
                            multi={false}
                            onChange={handleSourceUpdate}
                            value={filters.origin}
                            dataTestId="links-origin-filter"
                            options={sourceOptions}
                            loading={isLoadingSources}
                        />
                    </Box>
                </Grid>
                {/* origin source version. disabled if only one version */}
                <Grid item xs={12}>
                    <Box mr={isXs ? 0 : 2}>
                        <InputComponent
                            keyValue="originVersion"
                            label={MESSAGES.sourceoriginversion}
                            type="select"
                            multi={false}
                            onChange={handleChange}
                            value={filters.originVersion}
                            dataTestId="links-origin-version-filter"
                            options={originVersionOptions}
                            disabled={originVersionDisabled}
                            loading={isLoadingSources}
                        />
                    </Box>
                </Grid>
            </Grid>
            <Grid container item xs={12} md={4} xl={3}>
                <Grid item xs={12}>
                    <InputComponent
                        keyValue="destination"
                        label={MESSAGES.sourcedestination}
                        type="select"
                        multi={false}
                        onChange={handleSourceUpdate}
                        value={filters.destination}
                        dataTestId="links-destination-filter"
                        options={sourceOptions}
                        loading={isLoadingSources}
                    />
                </Grid>
                <Grid item xs={12}>
                    {/* origin destination version. disabled if only one version */}
                    <InputComponent
                        keyValue="destinationVersion"
                        label={MESSAGES.sourcedestinationversion}
                        type="select"
                        multi={false}
                        onChange={handleChange}
                        value={filters.destinationVersion}
                        dataTestId="links-destination-version-filter"
                        options={destinationVersionOptions}
                        disabled={destinationVersionDisabled}
                        loading={isLoadingSources}
                    />
                </Grid>
            </Grid>
            <Grid container item xs={12} xl={3} justifyContent="flex-end">
                <Box mr={2} mt={2}>
                    <RefreshButton
                        forceRefresh={forceRefresh}
                        disabled={disableRefresh}
                    />
                </Box>
                <Box mt={2}>
                    <SearchButton onSearch={handleSearch} disabled={disabled} />
                </Box>
            </Grid>
        </Grid>
    );
};
