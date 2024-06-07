import { cloneDeep } from 'lodash';
import { useMemo } from 'react';
import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Scope, Vaccine } from '../../../../constants/types';
import { FilteredDistricts, Shape } from './types';

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
        vaccine: selectedVaccine as Vaccine,
        group: {
            org_units: [],
        },
    };

    return regionIds.every(OrgUnitId =>
        vaccineScope?.group.org_units.includes(OrgUnitId),
    );
};

export const useFilteredDistricts = ({
    districtShapes,
    regionShapes,
    scopes,
    isPolio,
    searchScope,
    search,
}): FilteredDistricts[] | undefined => {
    return useMemo(() => {
        if (!districtShapes || !regionShapes) return undefined;
        const orgUnitIdToVaccine = new Map();
        if (isPolio && scopes) {
            scopes.forEach(scope => {
                scope.group.org_units.forEach(ouId => {
                    orgUnitIdToVaccine.set(ouId, scope.vaccine);
                });
            });
        }
        const filtered = districtShapes
            .filter(district => {
                const isInScope = scopes.some(sc =>
                    sc.group.org_units.includes(district.id),
                );
                return (
                    (district.validation_status === 'VALID' || isInScope) &&
                    (!searchScope || isInScope) &&
                    (!search ||
                        district.name
                            .toLowerCase()
                            .includes(search.toLowerCase()))
                );
            })
            .map(district => {
                const scope = findScopeWithOrgUnit(scopes, district.id);
                const vaccineName =
                    orgUnitIdToVaccine.get(district.id) || undefined;
                return {
                    ...cloneDeep(district),
                    region: findRegion(district, regionShapes),
                    scope,
                    vaccineName,
                };
            });

        return filtered;
    }, [districtShapes, regionShapes, isPolio, scopes, searchScope, search]);
};
