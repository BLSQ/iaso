import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { Shape } from '../../orgUnits/types/shapes';
import { DropdownTeamsOptions } from '../../teams/types/team';
import { OrgUnitAssignedTeamUser, AssignedUser } from '../utils';
import { AssignmentApi } from './assigment';

export type BaseLocation = OrgUnit & {
    orgUnitTypeId: number;
    color?: string;
    otherAssignation?: OrgUnitAssignedTeamUser | undefined;
    assignment?: AssignmentApi | undefined;
    assignedTeam?: DropdownTeamsOptions | undefined;
    assignedUser?: AssignedUser | undefined;
    emptyAssignment?: AssignmentApi | undefined;
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

export type AssignmentUnit = OrgUnitShape | OrgUnitMarker | OrgUnit;
