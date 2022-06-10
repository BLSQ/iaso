import { Shape } from '../../orgUnits/types/shapes';

export type BaseLocation = {
    id: number;
    name: string;
    orgUnitTypeId: number;
};

export type OrgUnitShape = BaseLocation & {
    geoJson: Shape;
};

export type OrgUnitMarker = BaseLocation & {
    latitude: number;
    longitude: number;
};

export type Locations = {
    shapes: OrgUnitShape[];
    markers: OrgUnitMarker[];
};
