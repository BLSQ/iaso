import { Box, Grid } from '@material-ui/core';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
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

const REASONABLE_DEPTH = 2;
const baseUrl = baseUrls.completenessStats;

export const CompletenessStatsFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: forms, isFetching: fetchingForms } = useGetFormsOptions();
    const { data: orgUnitTypes, isFetching: fetchingTypes } =
        useGetOrgUnitTypesOptions();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.parentId);

    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const [selectedOrgUnit, setSelectedOrgUnit] = useState(initialOrgUnit);
    const selectedOrgUnitDepth =
        (orgUnitTypes ?? []).find(
            ouType => ouType.original.id === selectedOrgUnit?.org_unit_type_id,
        )?.original.depth ?? 0;

    const selectedOrgUnitTypeDepth =
        (orgUnitTypes ?? []).find(
            ouType =>
                ouType.original.id ===
                parseInt(filters.orgUnitTypeId as string, 10),
        )?.original.depth ?? 0;

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            setSelectedOrgUnit(orgUnit);
            handleChange('parentId', id);
        },
        [handleChange],
    );

    const isReasonableDepth =
        selectedOrgUnitTypeDepth - selectedOrgUnitDepth < REASONABLE_DEPTH;

    const isOrgUnitTypeDisabled = !filters.parentId;

    const showError = !isOrgUnitTypeDisabled && !isReasonableDepth;

    useEffect(() => {
        if (isOrgUnitTypeDisabled && filters.orgUnitTypeId) {
            handleChange('orgUnitTypeId', undefined);
        }
    }, [filters.orgUnitTypeId, handleChange, isOrgUnitTypeDisabled]);

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
                        disabled={isOrgUnitTypeDisabled}
                        helperText={
                            isOrgUnitTypeDisabled
                                ? formatMessage(MESSAGES.chooseParent)
                                : undefined
                        }
                        errors={
                            showError
                                ? [formatMessage(MESSAGES.tooMuchDepth)]
                                : []
                        }
                    />
                </Grid>
                <Grid container item xs={3} justifyContent="flex-end">
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
