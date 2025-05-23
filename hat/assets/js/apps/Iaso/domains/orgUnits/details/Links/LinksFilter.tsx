import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { DataSource } from 'Iaso/domains/dataSources/types/dataSources';
import InputComponent from '../../../../components/forms/InputComponent';
import { SearchButton } from '../../../../components/SearchButton';
import FullStarsSvg from '../../../../components/stars/FullStarsSvgComponent';
import { useFilterState } from '../../../../hooks/useFilterState';
import { scoreOptions } from '../../../links/components/LinksFilters';
import {
    useGetAlgorithmRunsOptions,
    useGetAlgorithmsOptions,
    useGetProfilesOptions,
    useSourceOptions,
    useStatusOptions,
} from '../../../links/hooks/filters';
import MESSAGES from '../../../links/messages';

type Props = {
    params: any;
    baseUrl: string;
    sources: DataSource[];
    isLoadingSources: boolean;
};

export const LinksFilter: FunctionComponent<Props> = ({
    params,
    baseUrl,
    sources,
    isLoadingSources,
}) => {
    const { filters, handleChange, handleSearch, filtersUpdated } =
        useFilterState({ baseUrl, params, saveSearchInHistory: false });

    const { data: algos, isLoading: isLoadingAlgos } =
        useGetAlgorithmsOptions();
    const { data: runs, isLoading: isLoadingRuns } =
        useGetAlgorithmRunsOptions();
    const statuses = useStatusOptions();
    const { data: validators, isLoading: isLoadingValidators } =
        useGetProfilesOptions();
    // const { data: sources, isLoading: isLoadingSources } = useGetDataSources();
    const sourceOptions = useSourceOptions(sources);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="linksParamsSearch"
                    label={MESSAGES.search}
                    type="search"
                    onChange={handleChange}
                    onEnterPressed={handleSearch}
                    value={filters.linksParamsSearch}
                    blockForbiddenChars
                    dataTestId="links-search-filter"
                />
                {/* runs */}
                <InputComponent
                    keyValue="linksParamsAlgorithmRunId"
                    label={MESSAGES.runsTitle}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsAlgorithmRunId}
                    dataTestId="links-algo-run-filter"
                    options={runs}
                    loading={isLoadingRuns}
                />
                {/* algorithm */}
                <InputComponent
                    keyValue="linksParamsAlgorithmId"
                    label={MESSAGES.algorithm}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsAlgorithmId}
                    dataTestId="links-algo-filter"
                    options={algos}
                    loading={isLoadingAlgos}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                {/* validation status */}
                <InputComponent
                    keyValue="linksParamsValidated"
                    label={MESSAGES.validationStatus}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsValidated}
                    dataTestId="links-status-filter"
                    options={statuses}
                />
                {/* validator */}
                <InputComponent
                    keyValue="linksParamsValidatorId"
                    label={MESSAGES.validator}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsValidatorId}
                    dataTestId="links-validator-filter"
                    options={validators}
                    loading={isLoadingValidators}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                {/* origin source */}
                <InputComponent
                    keyValue="linksParamsOrigin"
                    label={MESSAGES.sourceorigin}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsOrigin}
                    dataTestId="links-origin-filter"
                    options={sourceOptions}
                    loading={isLoadingSources}
                />
                <InputComponent
                    keyValue="linksParamsScore"
                    label={MESSAGES.similarityScore}
                    type="select"
                    multi={false}
                    onChange={handleChange}
                    value={filters.linksParamsScore}
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
            <Grid container item xs={12} md={3} justifyContent="flex-end">
                <Box mt={2}>
                    <SearchButton
                        onSearch={handleSearch}
                        disabled={!filtersUpdated}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
