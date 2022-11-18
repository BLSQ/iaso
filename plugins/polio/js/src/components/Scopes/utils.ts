import { Scope, Shape } from './types';

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
