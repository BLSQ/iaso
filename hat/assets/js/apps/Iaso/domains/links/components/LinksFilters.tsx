import React, { FunctionComponent, useCallback } from 'react';
import { Grid } from '@mui/material';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { SearchButton } from '../../../components/SearchButton';
import FullStarsSvg from '../../../components/stars/FullStarsSvgComponent';
import {
    useGetAlgorithmRunsOptions,
    useGetAlgorithmsOptions,
    useGetDataSources,
    useGetProfilesOptions,
    useSourceOptions,
    useSourceVersionOptions,
    useStatusOptions,
} from '../hooks/filters';
import MESSAGES from '../messages';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';

type Props = {
    params: any;
    baseUrl: string;
};

export const scoreOptions = [1, 2, 3, 4, 5].map(s => ({
    label: `${s}`,
    value: `${(s - 1) * 20},${s * 20}`,
}));

export const LinksFilters: FunctionComponent<Props> = ({ baseUrl, params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated, setFilters } =
        useFilterState({
            baseUrl,
            params,
            searchActive: 'searchActive',
            saveSearchInHistory: false,
            searchAlwaysEnabled: true,
        });
    const { data: orgUnitTypes, isLoading: isLoadingOrgUnitTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: algos, isLoading: isLoadingAlgos } =
        useGetAlgorithmsOptions();
    const { data: runs, isLoading: isLoadingRuns } =
        useGetAlgorithmRunsOptions();
    const statuses = useStatusOptions();
    const { data: validators, isLoading: isLoadingValidators } =
        useGetProfilesOptions();
    const { data: sources, isLoading: isLoadingSources } = useGetDataSources();
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
    const disabled = !filtersUpdated && filters.searchActive === 'true';
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="search"
                    label={MESSAGES.search}
                    type="search"
                    onChange={handleChange}
                    onEnterPressed={handleSearch}
                    value={filters.search}
                    blockForbiddenChars
                    dataTestId="links-search-filter"
                />
                {/* runs */}
                <InputComponent
                    keyValue="algorithmRunId"
                    label={MESSAGES.runsTitle}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.algorithmRunId}
                    dataTestId="links-algo-run-filter"
                    options={runs}
                    loading={isLoadingRuns}
                />
                {/* algorithm */}
                <InputComponent
                    keyValue="algorithmId"
                    label={MESSAGES.algorithm}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.algorithmId}
                    dataTestId="links-algo-filter"
                    options={algos}
                    loading={isLoadingAlgos}
                />
                {/* similarity score. make sure to get the stars */}
                <InputComponent
                    keyValue="score"
                    label={MESSAGES.similarityScore}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.score}
                    dataTestId="links-score-filter"
                    options={scoreOptions}
                    renderOption={(props, option) => {
                        // @ts-ignore
                        const label = props.label || option.label;
                        return (
                            <div {...props}>
                                <FullStarsSvg score={parseInt(label, 10)} />
                            </div>
                        );
                    }}
                />
            </Grid>
            {/* COL 2 start */}
            <Grid item xs={12} sm={6} md={3}>
                {/* validation status */}
                <InputComponent
                    keyValue="validated"
                    label={MESSAGES.validationStatus}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.validated}
                    dataTestId="links-status-filter"
                    options={statuses}
                />
                {/* validator */}
                <InputComponent
                    keyValue="validatorId"
                    label={MESSAGES.validator}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.validatorId}
                    dataTestId="links-validator-filter"
                    options={validators}
                    loading={isLoadingValidators}
                />
                {/* org unit types */}
                <InputComponent
                    keyValue="orgUnitTypeId"
                    label={MESSAGES.orgUnitTypes}
                    type="select"
                    multi
                    onChange={handleChange}
                    value={filters.orgUnitTypeId}
                    options={orgUnitTypes}
                    loading={isLoadingOrgUnitTypes}
                    dataTestId="links-orgUnitTypes-filter"
                />
                {/* COL 2 end */}
            </Grid>{' '}
            <Grid item xs={12} sm={6} md={3}>
                {/* origin source */}
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
                {/* origin source version. disabled if only one version */}
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
                {/* origin destination */}
            </Grid>{' '}
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid container item xs={12} justifyContent="flex-end">
                <SearchButton onSearch={handleSearch} disabled={disabled} />
            </Grid>
        </Grid>
    );
};
