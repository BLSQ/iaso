import { cloneDeep } from 'lodash';
import { Optional } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Scope, Shape } from './types';
import { OrgUnit } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';

export const findScopeWithOrgUnit = (
    scopes: Scope[],
    orgUnitId: number,
): Scope | undefined => {
    const scope = scopes.find(s => {
        return s.group?.org_units.includes(orgUnitId);
    });
    return scope;
};

export const findRegion = (shape: Shape, regionShapes: Shape[]): string => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0]?.name;
};

export const checkFullRegionIsPartOfScope = (
    selectedOrgUnit: Shape,
    selectedVaccine: string,
    districtShapes: Optional<OrgUnit[]>,
    scopes: Optional<Scope[]>,
): boolean => {
    const regionIds: number[] = (districtShapes || [])
        .filter(s => s.parent_id === selectedOrgUnit.parent_id)
        .map(s => s.id);

    // Find scope for vaccine
    const vaccineScope: Scope | undefined = cloneDeep(
        scopes?.find(s => s.vaccine === selectedVaccine),
    ) ?? {
        vaccine: selectedVaccine,
        group: {
            org_units: [],
        },
    };

    return regionIds.every(OrgUnitId =>
        // @ts-ignore
        vaccineScope.group.org_units.includes(OrgUnitId),
    );
};
