import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { AssignmentApi } from './assigment';
import { DropdownTeamsOptions } from './team';
import { AssignedUser } from '../utils';

export type ChildrenOrgUnitsArrayItem = OrgUnit & {
    assignment?: AssignmentApi | undefined;
    assignedTeam?: DropdownTeamsOptions | undefined;
    assignedUser?: AssignedUser | undefined;
    emptyAssignment?: AssignmentApi | undefined;
};

export type ChildrenOrgUnitsArray = Array<ChildrenOrgUnitsArrayItem>;

export type ChildrenOrgUnits = {
    orgUnits: ChildrenOrgUnitsArray;
    orgUnitsToUpdate: Array<number>;
};

export type ParentOrgUnit = {
    id: number;
    name: string;
    parent: ParentOrgUnit;
};
