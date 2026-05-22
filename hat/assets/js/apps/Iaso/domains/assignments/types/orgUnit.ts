import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { DropdownTeamsOptions } from '../../teams/types/team';
import { AssignedUser } from '../utils';
import { AssignmentApi } from './assigment';

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
