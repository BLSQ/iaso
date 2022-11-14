import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useState } from 'react';
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
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.parentId);

    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('parentId', id);
        },
        [handleChange],
    );

    return (
        <>
            <Grid container spacing={2}>
                {/* select forms. Multiselect */}
                <Grid item xs={3}>
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
                </Grid>
                {/* select org unit types. Multiselect */}
                <Grid item xs={3}>
                    <InputComponent
                        type="select"
                        multi
                        onChange={handleChange}
                        keyValue="orgUnitTypeId"
                        label={MESSAGES.orgUnitType}
                        value={filters.orgUnitTypeId}
                        loading={fetchingTypes}
                        options={orgUnitTypes ?? []}
                    />
                </Grid>
                {/* select parent. Treeview modal */}
                <Grid item xs={3}>
                    <Box id="ou-tree-input">
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.orgUnit}
                            onConfirm={handleOrgUnitChange}
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                </Grid>
                <Grid container item xs={3} justifyContent="flex-end">
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
