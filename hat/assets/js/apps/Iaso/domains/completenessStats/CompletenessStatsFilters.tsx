import { Box, Grid, useTheme, useMediaQuery } from '@material-ui/core';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
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
import { commaSeparatedIdsToStringArray } from '../../utils/forms';

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

    const selectedOrgUnitTypeMaxDepth = useMemo(
        () =>
            commaSeparatedIdsToStringArray(filters.orgUnitTypeIds)
                .map(ouTypeId =>
                    (orgUnitTypes ?? []).find(
                        ouType => ouType.original.id === parseInt(ouTypeId, 10),
                    ),
                )
                .map(ouType => ouType.original?.depth ?? 0)
                // If the array is empty, we return the same depth as the orgUnit, to avoid showing an error
                .sort((a, b) => b - a)[0] ?? selectedOrgUnitDepth,
        [filters.orgUnitTypeIds, orgUnitTypes, selectedOrgUnitDepth],
    );

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
        Math.abs(selectedOrgUnitTypeMaxDepth - selectedOrgUnitDepth) <
        REASONABLE_DEPTH;

    const isOrgUnitTypeDisabled = !filters.parentId;

    const showError = !isOrgUnitTypeDisabled && !isReasonableDepth;

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    useEffect(() => {
        if (isOrgUnitTypeDisabled && filters.orgUnitTypeIds) {
            handleChange('orgUnitTypeIds', undefined);
        }
    }, [filters.orgUnitTypeIds, handleChange, isOrgUnitTypeDisabled]);

    return (
        <>
            <Grid container spacing={2}>
                {/* select forms. Multiselect */}
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
                </Grid>
                {/* select parent. Treeview modal */}
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        label={MESSAGES.orgUnitType}
                        value={filters.orgUnitTypeIds}
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
                <Grid
                    container
                    item
                    xs={isLargeLayout ? 3 : 12}
                    justifyContent="flex-end"
                >
                    <Box mt={isLargeLayout ? 2 : 0}>
                        <FilterButton
                            disabled={!filtersUpdated || !isReasonableDepth}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
