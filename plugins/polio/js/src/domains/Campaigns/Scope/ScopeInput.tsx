import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useState,
} from 'react';
import { Box, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { FieldProps, useField } from 'formik';
import cloneDeep from 'lodash/cloneDeep';

// @ts-ignore
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OrgUnit } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import MESSAGES from '../../../constants/messages';

import { CampaignFormValues, Scope, Vaccine } from '../../../constants/types';
import { PolioVaccine } from '../../../constants/virus';
import { useIsPolioCampaign } from '../hooks/useIsPolioCampaignCheck';
import { DistrictScopeTable } from './Scopes/DistrictScopeTable';
import { MapScope } from './Scopes/MapScope';
import { FilteredDistricts } from './Scopes/types';

type ExtraProps = {
    filteredDistricts: FilteredDistricts[];
    searchScope: boolean;
    onChangeSearchScope: () => void;
    isFetchingDistricts: boolean;
    isFetchingRegions: boolean;
    districtShapes?: OrgUnit[];
    regionShapes?: OrgUnit[];
    searchComponent: ReactNode;
    page: number;
    setPage: (page: number) => void;
    campaign: CampaignFormValues; // Passing the campaign i.o getting it from formik context so we can re-use the component for subactivities
    availableVaccines?: PolioVaccine[];
    searchInputWithMargin?: boolean; // needed to remove the margin on the serach component without breaking existing scope form
};

type Props = FieldProps<Scope[], CampaignFormValues> & ExtraProps;

export const ScopeInput: FunctionComponent<Props> = ({
    field,
    filteredDistricts,
    searchScope,
    onChangeSearchScope,
    isFetchingDistricts,
    isFetchingRegions,
    districtShapes,
    regionShapes,
    searchComponent,
    page,
    setPage,
    campaign,
    availableVaccines,
    searchInputWithMargin = true,
}) => {
    const [selectRegion, setSelectRegion] = useState(false);
    const [selectedVaccine, setSelectedVaccine] = useState<Vaccine>('nOPV2');
    const isPolio = useIsPolioCampaign(campaign);
    const [, , helpers] = useField(field.name);
    const { formatMessage } = useSafeIntl();
    const { value: scopes = [] } = field;
    const { setValue: setScopes } = helpers;

    const isFetching = isFetchingDistricts || isFetchingRegions;

    const toggleRegionSelect = () => {
        setSelectRegion(!selectRegion);
    };

    const toggleRegion = useCallback(
        (selectOrgUnit: FilteredDistricts) => {
            const orgUnitsInSameRegion: OrgUnit[] = (
                districtShapes || []
            ).filter(s => s.parent_id === selectOrgUnit.parent_id);

            const validOrgUnitIdsInSameRegion: number[] = orgUnitsInSameRegion
                .filter(orgUnit => orgUnit.validation_status === 'VALID')
                .map(orgUnit => orgUnit.id);

            const newScopes: Scope[] = cloneDeep(scopes);
            let scope: Scope | undefined;
            if (!isPolio) {
                [scope] = newScopes;
            } else {
                // Find scope for vaccine
                scope = newScopes.find(s => s.vaccine === selectedVaccine);
            }
            if (!scope) {
                scope = {
                    group: {
                        org_units: [],
                    },
                };
                if (isPolio) {
                    scope.vaccine = selectedVaccine;
                }
                newScopes.push(scope);
            }
            // if all the orgunits from this region are already in this vaccine scope, remove them
            // @ts-ignore
            if (
                validOrgUnitIdsInSameRegion.every(OrgUnitId =>
                    // @ts-ignore
                    scope.group.org_units.includes(OrgUnitId),
                )
            ) {
                const orgUnits: Array<number> = [];

                scope.group.org_units = orgUnits;
            } else {
                // Remove the OrgUnits from all the scopes
                newScopes.forEach(s => {
                    const newScope = { ...s };
                    newScope.group.org_units = s.group.org_units.filter(
                        OrgUnitId =>
                            !validOrgUnitIdsInSameRegion.includes(OrgUnitId),
                    );
                });

                // Add the OrgUnit in the scope for selected vaccine
                scope.group.org_units = [
                    ...scope.group.org_units,
                    ...validOrgUnitIdsInSameRegion,
                ];
            }
            setScopes(newScopes);
        },
        [districtShapes, isPolio, scopes, selectedVaccine, setScopes],
    );
    const toggleDistrictInVaccineScope = useCallback(
        district => {
            const newScopes: Scope[] = cloneDeep(scopes);
            // check if a scope exists for currently selected vaccine
            let scope: Scope | undefined;
            if (!isPolio) {
                [scope] = newScopes;
            } else {
                scope = newScopes.find(s => s.vaccine === selectedVaccine);
            }
            // if not create one that is initially empty
            if (!scope) {
                scope = {
                    group: {
                        org_units: [],
                    },
                };
                if (isPolio) {
                    scope.vaccine = selectedVaccine;
                }
                newScopes.push(scope);
            }
            // Remove org unit from selection if it's part of the scope
            if (scope.group.org_units.includes(district.id)) {
                scope.group.org_units = scope.group.org_units.filter(
                    OrgUnitId => OrgUnitId !== district.id,
                );
            } else {
                // Remove the orgunit from all the scope in case it's part of another scope
                newScopes.forEach(s => {
                    if (s.group.org_units.includes(district.id)) {
                        const newScope = { ...s };
                        newScope.group.org_units = s.group.org_units.filter(
                            OrgUnitId => OrgUnitId !== district.id,
                        );
                    }
                });
                // Add org unit to proper scope
                // scope.group.org_units = [...scope.group.org_units, district.id];
                scope.group.org_units = [...scope.group.org_units, district.id];
            }
            setScopes(newScopes);
        },
        [scopes, setScopes, selectedVaccine, isPolio],
    );

    const onSelectOrgUnit = useCallback(
        shape => {
            if (selectRegion && districtShapes) {
                toggleRegion(shape);
            } else {
                toggleDistrictInVaccineScope(shape);
            }
        },
        [
            districtShapes,
            selectRegion,
            toggleDistrictInVaccineScope,
            toggleRegion,
        ],
    );

    return (
        <Box width="100%" overflow="hidden">
            <Grid container spacing={2}>
                <Grid xs={5} item>
                    <Box mb={2} mt={searchInputWithMargin ? 2 : 0}>
                        {searchComponent}
                        <InputComponent
                            keyValue="searchScope"
                            type="checkbox"
                            withMarginTop={false}
                            onChange={onChangeSearchScope}
                            value={searchScope}
                            label={MESSAGES.searchInScopeOrAllDistricts}
                        />
                    </Box>
                    <DistrictScopeTable
                        field={field}
                        regionShapes={regionShapes || []}
                        filteredDistricts={filteredDistricts}
                        toggleDistrictInVaccineScope={
                            toggleDistrictInVaccineScope
                        }
                        toggleRegion={toggleRegion}
                        setPage={setPage}
                        page={page}
                        isFetching={isFetching}
                        districtShapes={districtShapes || []}
                        selectedVaccine={selectedVaccine}
                        isPolio={isPolio}
                    />
                </Grid>
                <Grid xs={7} item>
                    {isFetching && <LoadingSpinner />}
                    <MapScope
                        field={field}
                        values={campaign}
                        regionShapes={regionShapes || []}
                        districtShapes={districtShapes || []}
                        onSelectOrgUnit={onSelectOrgUnit}
                        selectedVaccine={selectedVaccine}
                        setSelectedVaccine={setSelectedVaccine}
                        isPolio={isPolio}
                        availableVaccines={availableVaccines}
                    />
                    <FormGroup>
                        <FormControlLabel
                            style={{ width: 'max-content' }}
                            control={
                                <Switch
                                    size="medium"
                                    checked={selectRegion}
                                    onChange={toggleRegionSelect}
                                    color="primary"
                                />
                            }
                            label={formatMessage(MESSAGES.selectRegion)}
                        />
                    </FormGroup>
                </Grid>
            </Grid>
        </Box>
    );
};
