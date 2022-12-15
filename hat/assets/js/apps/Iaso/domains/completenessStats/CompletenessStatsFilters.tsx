import { Box, Grid, useTheme, useMediaQuery } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useState } from 'react';
// @ts-ignore
import { useSkipEffectOnMount } from 'bluesquare-components';
import { FilterButton } from '../../components/FilterButton';
import InputComponent from '../../components/forms/InputComponent';
import { baseUrls } from '../../constants/urls';
import { useFilterState } from '../../hooks/useFilterState';
import { UrlParams } from '../../types/table';
import { OrgUnitTreeviewModal } from '../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../orgUnits/components/TreeView/requests';
import { useGetFormsOptions } from './hooks/api/useGetFormsOptions';
import { useGetOrgUnitTypesOptions } from './hooks/api/useGetOrgUnitTypesOptions';
import MESSAGES from './messages';

type Props = {
    params: UrlParams & any;
};

const baseUrl = baseUrls.completenessStats;

export const CompletenessStatsFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: forms, isFetching: fetchingForms } = useGetFormsOptions();
    const { data: orgUnitTypes, isFetching: fetchingTypes } =
        useGetOrgUnitTypesOptions();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.orgUnitId);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const [initialParentId, setInitialParentId] = useState(params?.parentId);
    const { data: initialParent } = useGetOrgUnit(initialParentId);

    useSkipEffectOnMount(() => {
        setInitialParentId(params?.parentId);
        setInitialOrgUnitId(params?.orgUnitId);
    }, [params]);

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('orgUnitId', id);
        },
        [handleChange],
    );
    const handleParentChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialParentId(id);
            handleChange('parentId', id);
        },
        [handleChange],
    );

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        onChange={handleChange}
                        keyValue="formId"
                        label={MESSAGES.form}
                        value={filters.formId}
                        loading={fetchingForms}
                        options={forms ?? []}
                    />
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.orgUnit}
                            onConfirm={handleOrgUnitChange}
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Box id="ou-tree-input-parent">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.parent}
                            onConfirm={handleParentChange}
                            initialSelection={initialParent}
                        />
                    </Box>
                    <InputComponent
                        type="select"
                        multi
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        label={MESSAGES.orgUnitType}
                        value={filters.orgUnitTypeIds}
                        loading={fetchingTypes}
                        options={orgUnitTypes ?? []}
                    />
                </Grid>
                <Grid
                    container
                    item
                    xs={isLargeLayout ? 6 : 12}
                    justifyContent="flex-end"
                >
                    <Box mt={isLargeLayout ? 2 : 0}>
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
