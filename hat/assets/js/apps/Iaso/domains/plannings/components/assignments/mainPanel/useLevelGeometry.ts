import { useMemo } from 'react';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import {
    OrgUnitBuildTreeWithGeom,
    useApiMicroplanningPlanningsOrgUnitTreeWithGeomList,
} from 'Iaso/api/plannings';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { MapPresence, OrgUnitFeatureProperties } from './types';
import { getLevelTreeParams } from './utils';

export type OrgUnitFeatureCollection = FeatureCollection<
    Geometry,
    OrgUnitFeatureProperties
>;

type LevelGeometry = {
    area?: OrgUnitFeatureCollection;
    members?: OrgUnitFeatureCollection;
    membersPresence: MapPresence[];
    isFetching: boolean;
};

const toFeatureCollection = (
    orgUnits: OrgUnitBuildTreeWithGeom[],
): OrgUnitFeatureCollection => ({
    type: 'FeatureCollection',
    features: orgUnits.flatMap(({ id, name, simplified_geom, location }) => {
        const geometry = simplified_geom ?? location;
        if (!geometry) return [];
        const feature: Feature<Geometry, OrgUnitFeatureProperties> = {
            type: 'Feature',
            id,
            // The generated schema types the GeoJSON `type` as optional.
            geometry: geometry as Geometry,
            properties: { id, name },
        };
        return [feature];
    }),
});

// Shapes (or locations) of the org units of a level, and of the level below.
export const useLevelGeometry = (level: number): LevelGeometry => {
    const { planning } = useAssignmentsContext();
    const { data, isFetching } =
        useApiMicroplanningPlanningsOrgUnitTreeWithGeomList(
            planning.id,
            getLevelTreeParams(level, 2),
        );
    return useMemo(() => {
        if (!data) return { membersPresence: [], isFetching };
        const members = data.flatMap(orgUnit => orgUnit.children);
        return {
            area: toFeatureCollection(data),
            members: toFeatureCollection(members),
            membersPresence: members.map(member => ({
                has_geo_json: Boolean(member.simplified_geom),
                has_location: Boolean(member.location),
            })),
            isFetching,
        };
    }, [data, isFetching]);
};
