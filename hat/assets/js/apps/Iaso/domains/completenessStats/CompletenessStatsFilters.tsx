import { Box, Grid, useTheme, useMediaQuery } from '@material-ui/core';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
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
import PeriodPicker from '../periods/components/PeriodPicker';
import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_YEAR,
} from '../periods/constants';
import _ from 'lodash';
import {
    useGetPlannings,
    useGetPlanningsOptions,
} from '../plannings/hooks/requests/useGetPlannings';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { useGetGroups } from '../orgUnits/hooks/requests/useGetGroups';

type Props = {
    params: UrlParams & any;
};

const baseUrl = baseUrls.completenessStats;

export const CompletenessStatsFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { data: forms, isFetching: fetchingForms } = useGetFormsOptions([
        'period_type',
    ]);

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const [initialOrgUnitId, setInitialOrgUnitId] = useState(params?.orgUnitId);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const [initialParentId, setInitialParentId] = useState(params?.parentId);
    const { data: initialParent } = useGetOrgUnit(initialParentId);

    const { data: orgUnitTypes, isFetching: fetchingTypes } =
        useGetOrgUnitTypesOptions(filters.parentId);
    const { data: availablePlannings, isFetching: fetchingPlannings } =
        useGetPlanningsOptions();
    useSkipEffectOnMount(() => {
        setInitialParentId(params?.parentId);
        setInitialOrgUnitId(params?.orgUnitId);
    }, [params]);
    const { data: groups, isFetching: isFetchingGroups } = useGetGroups({});

    // React to org unit type filtering, if the type is not available anymore
    // we remove it
    useEffect(() => {
        if (filters.orgUnitTypeIds && orgUnitTypes) {
            const out: string = filters.orgUnitTypeIds as string;
            const selectedOrgUnitIDs = out
                .split(',')
                .map(x => parseInt(x))
                .sort();
            const availableIds = orgUnitTypes.map(out => out.value);

            const filteredIds = _.intersection(
                availableIds,
                selectedOrgUnitIDs,
            ).sort();

            if (!_.isEqual(filteredIds, selectedOrgUnitIDs)) {
                handleChange('orgUnitTypeIds', filteredIds.join(','));
            }
        }
    }, [handleChange, orgUnitTypes]);

    const periodType = useMemo(() => {
        if (filters.formId && forms) {
            const formIdStr = filters.formId as string;
            const selectedFormIds = formIdStr
                .split(',')
                .map(x => parseInt(x))
                .sort();
            const selectedForms = forms.filter(
                f => selectedFormIds.indexOf(f.value) != -1,
            );

            const periods = selectedForms
                .map(f => f.original.period_type)
                .filter(period_type => Boolean(period_type));
            const uniqPeriods = _.uniq(periods);
            return uniqPeriods ? uniqPeriods[0] : null;
        }
        return null;
    }, [filters]);

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('orgUnitId', id);
        },
        [orgUnitTypes, handleChange],
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
                    {/*<Box id="ou-tree-input">*/}
                    {/*    <OrgUnitTreeviewModal*/}
                    {/*        toggleOnLabelClick={false}*/}
                    {/*        titleMessage={MESSAGES.orgUnit}*/}
                    {/*        onConfirm={handleOrgUnitChange}*/}
                    {/*        initialSelection={initialOrgUnit}*/}
                    {/*    />*/}
                    {/*</Box>*/}
                </Grid>
                <Grid item xs={12} md={3}>
                    {/*FIXME Connect to the rest*/}
                    <PeriodPicker
                        hasError={false}
                        // hasError={periodError || startPeriodError}
                        // activePeriodString={formState.startPeriod.value}
                        // periodType={formState.periodType.value}
                        periodType={periodType}
                        title={'Period'}
                        // title={formatMessage(MESSAGES.startPeriod)}
                        keyName={'period'}
                        onChange={v => handleChange('period', v)}
                        activePeriodString={filters?.period as string}
                        // keyName="startPeriod"
                        // onChange={startPeriod =>
                        //     handleFormChange('startPeriod', startPeriod)
                        // }
                    />
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
                </Grid>

                <Grid item xs={12} md={3}>
                    <InputComponent
                        type="select"
                        multi
                        onChange={handleChange}
                        keyValue="orgUnitTypeIds"
                        label={MESSAGES.orgUnitTypeGroupBy}
                        value={filters.orgUnitTypeIds}
                        loading={fetchingTypes}
                        options={orgUnitTypes ?? []}
                    />
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <InputComponent
                            type="select"
                            disabled={isFetchingGroups}
                            keyValue="groupId"
                            onChange={handleChange}
                            value={filters?.groupId}
                            label={MESSAGES.group}
                            options={groups}
                            loading={isFetchingGroups}
                        />
                    </Grid>
                    <DisplayIfUserHasPerm
                        permission={'iaso.permissions.planning'}
                    >
                        <Grid item xs={12} md={3}>
                            <InputComponent
                                type="select"
                                multi
                                onChange={handleChange}
                                keyValue="planningId"
                                label={MESSAGES.planning}
                                value={filters.planningId}
                                loading={fetchingPlannings}
                                options={availablePlannings ?? []}
                            />
                        </Grid>
                    </DisplayIfUserHasPerm>
                    <Grid container item justifyContent="flex-end" md={9}>
                        <Grid item>
                            <FilterButton
                                disabled={!filtersUpdated}
                                onFilter={handleSearch}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
