import React, { FunctionComponent, useMemo, useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Grid, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { SearchButton } from 'Iaso/components/SearchButton';
import { useFilterState } from 'Iaso/hooks/useFilterState';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from './../messages';
import { useGetBeneficiaryOptions } from './../requests';
import { Params } from './../types';

type Props = {
    params: Params;
};

// the url params are strings: so are the values of the options
const asStrings = (options?: { value: string | number; label: string }[]) =>
    (options ?? []).map(option => ({ ...option, value: `${option.value}` }));

export const BeneficiaryFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.wfpBeneficiaries, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { data: options, isFetching } = useGetBeneficiaryOptions();
    const entityTypes = useMemo(
        () => asStrings(options?.entity_types),
        [options],
    );
    const programmes = useMemo(() => asStrings(options?.programmes), [options]);
    const orgUnitGroups = useMemo(
        () => asStrings(options?.org_unit_groups),
        [options],
    );

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    keyValue="q"
                    onChange={handleChange}
                    value={filters.q}
                    type="search"
                    label={MESSAGES.search}
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                    blockForbiddenChars
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    type="select"
                    keyValue="entity_type"
                    onChange={handleChange}
                    value={filters.entity_type}
                    label={MESSAGES.entityType}
                    options={entityTypes}
                    loading={isFetching}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <InputComponent
                    type="select"
                    keyValue="programme"
                    onChange={handleChange}
                    value={filters.programme}
                    label={MESSAGES.programme}
                    options={programmes}
                    loading={isFetching}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" mt={2}>
                    <Box flexGrow={1}>
                        <InputComponent
                            type="select"
                            keyValue="org_unit_group"
                            onChange={handleChange}
                            value={filters.org_unit_group}
                            label={MESSAGES.integratedNutritionFacility}
                            options={orgUnitGroups}
                            loading={isFetching}
                            withMarginTop={false}
                        />
                    </Box>
                    <Tooltip
                        title={formatMessage(MESSAGES.integratedNutritionFacilityTooltip)}
                        placement="top"
                    >
                        <InfoIcon color="primary" sx={{ ml: 1 }} />
                    </Tooltip>
                </Box>
            </Grid>
            <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mt={2}>
                    <Box flexGrow={1}>
                        <DatesRange
                            marginTop={0}
                            xs={12}
                            sm={6}
                            md={6}
                            lg={6}
                            keyDateFrom="visit_date_after"
                            keyDateTo="visit_date_before"
                            onChangeDate={handleChange}
                            dateFrom={filters.visit_date_after}
                            dateTo={filters.visit_date_before}
                            labelFrom={MESSAGES.visitDateFrom}
                            labelTo={MESSAGES.visitDateTo}
                        />
                    </Box>
                    <Tooltip
                        title={formatMessage(MESSAGES.visitDateTooltip)}
                        placement="top"
                    >
                        <InfoIcon color="primary" sx={{ ml: 1 }} />
                    </Tooltip>
                </Box>
            </Grid>
            <Grid container item xs={12} md={6} justifyContent="flex-end">
                <Box mt={isLargeLayout ? 2 : 0}>
                    <SearchButton
                        disabled={textSearchError || !filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
