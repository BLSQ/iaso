import { Shape } from '../../orgUnits/types/shapes';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

export type BaseLocation = OrgUnit & {
    orgUnitTypeId: number;
    color?: string;
    otherAssignation?: any | undefined;
    assignment?: any | undefined;
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
    all: Array<OrgUnitShape | OrgUnitMarker>;
};

export type AssignmentUnit = OrgUnitShape | OrgUnitMarker | OrgUnit;
