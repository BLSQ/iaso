import { Shape } from '../../orgUnits/types/shapes';

export type BaseLocation = {
    id: number;
    name: string;
    orgUnitTypeId: number;
    color?: string;
    otherAssignation?: any | undefined;
};

export type OrgUnitShape = BaseLocation & {
    geoJson: Shape;
};

export type OrgUnitMarker = BaseLocation & {
    latitude: number;
    longitude: number;
};

type Selection<T> = {
    selected: T[];
    unselected: T[];
    all: T[];
};

export type Locations = {
    shapes: Selection<OrgUnitShape>;
    markers: Selection<OrgUnitMarker>;
};
