import { FeatureCollection } from 'geojson';
import { useApiMicroplanningPlanningsOrgunitsLevelTreeGeometryRetrieve } from 'Iaso/api/plannings';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { OrgUnitFeatureProperties } from './types';

type LevelGeometry = {
    geoJson?: FeatureCollection<
        FeatureCollection['features'][number]['geometry'],
        OrgUnitFeatureProperties
    >;
    isFetching: boolean;
};

// Shapes (or locations) of the org units of a level of the planning level tree.
export const useLevelGeometry = (level: number): LevelGeometry => {
    const { planning } = useAssignmentsContext();
    const { data, isFetching } =
        useApiMicroplanningPlanningsOrgunitsLevelTreeGeometryRetrieve(
            `${planning.id}`,
            { level },
        );
    // The generated schema types each geometry as unknown: it is a GeoJSON geometry.
    return { geoJson: data as LevelGeometry['geoJson'], isFetching };
};
