import { Box } from '@mui/material';
import { FieldInputProps } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { ColorsHashedPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/HashedPatterns/ColorsHashedPattern';
import {
    HASHED_MAP_PATTERN_N_OPV2_B_OPV,
    OTHER_VACCINE_COLOR,
    PolioVaccine,
    polioVaccines,
} from '../../../../constants/virus';
import { MapComponent } from '../../MapComponent/MapComponent';

import {
    initialDistrict,
    selectedPathOptions,
    unselectedPathOptions,
} from '../../../../styles/constants';

import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import {
    CampaignFormValues,
    Scope,
    Vaccine,
} from '../../../../constants/types';
import { ScopeMapLegend } from './ScopeMapLegend';
import { Shape } from './types';
import { findScopeWithOrgUnit } from './utils';

const ScopeHashedPattern = () => (
    <ColorsHashedPattern
        id={HASHED_MAP_PATTERN_N_OPV2_B_OPV}
        strokeColor="#00b0f0"
        fillColor="#ffff00"
    />
);

type Props = {
    field: FieldInputProps<Scope[]>;
    values: CampaignFormValues;
    regionShapes: OrgUnit[];
    districtShapes: OrgUnit[];
    onSelectOrgUnit: (id: Shape) => void;
    selectedVaccine: string;
    setSelectedVaccine: (selected: Vaccine) => void;
    isPolio?: boolean;
    availableVaccines?: PolioVaccine[];
};

const getBackgroundLayerStyle = () => {
    return {
        color: 'grey',
        opacity: '1',
        fillColor: 'transparent',
    };
};

export const MapScope: FunctionComponent<Props> = ({
    field,
    values,
    regionShapes,
    districtShapes,
    onSelectOrgUnit,
    selectedVaccine,
    setSelectedVaccine,
    isPolio,
    availableVaccines = polioVaccines,
}) => {
    const { value: scopes = [] } = field;

    const getShapeStyle = useCallback(
        shape => {
            const scope = findScopeWithOrgUnit(scopes, shape.id);

            if (scope) {
                const vaccine = availableVaccines.find(
                    v => v.value === scope.vaccine,
                );
                const styles = {
                    ...selectedPathOptions,
                    color: vaccine?.color || OTHER_VACCINE_COLOR,
                };
                return styles;
            }
            if (values.org_unit?.id === shape.id) return initialDistrict;
            return unselectedPathOptions;
        },
        [scopes, values.org_unit?.id, availableVaccines],
    );
    const filterOrgUnits = useCallback(
        (orgUnits: OrgUnit[]) =>
            orgUnits.filter(
                orgUnit =>
                    (orgUnit.has_geo_json ||
                        (orgUnit.latitude && orgUnit.longitude)) &&
                    (orgUnit.validation_status === 'VALID' ||
                        // display REJECTED or NEW org unit if already present in a scope
                        findScopeWithOrgUnit(scopes, orgUnit.id)),
            ),
        [scopes],
    );

    const districts = useMemo(
        () => filterOrgUnits(districtShapes),
        [districtShapes, filterOrgUnits],
    );
    const regions = useMemo(
        () => filterOrgUnits(regionShapes),
        [regionShapes, filterOrgUnits],
    );

    return (
        <Box position="relative">
            <MapComponent
                name="ScopeMap"
                mainLayer={districts}
                backgroundLayer={regions}
                onSelectShape={onSelectOrgUnit}
                getMainLayerStyle={getShapeStyle}
                getBackgroundLayerStyle={getBackgroundLayerStyle}
                tooltipLabels={{
                    main: 'District',
                    background: 'Region',
                }}
                height={540}
                shapePatternIds={[HASHED_MAP_PATTERN_N_OPV2_B_OPV]}
                shapePatterns={[ScopeHashedPattern]}
            />
            {isPolio && (
                <ScopeMapLegend
                    field={field}
                    selectedVaccine={selectedVaccine}
                    setSelectedVaccine={setSelectedVaccine}
                    availableVaccines={availableVaccines}
                />
            )}
        </Box>
    );
};
