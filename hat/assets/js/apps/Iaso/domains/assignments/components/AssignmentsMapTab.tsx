import React, { FunctionComponent } from 'react';

import { AssignmentsMap } from './AssignmentsMap';
import { ParentDialog } from './ParentDialog';

import {
    AssignmentsApi,
    SaveAssignmentQuery,
    AssignmentParams,
} from '../types/assigment';
import { Planning } from '../types/planning';
import { Team, DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { OrgUnitMarker, OrgUnitShape, Locations } from '../types/locations';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

import { Profile } from '../../../utils/usersUtils';
import { getSaveParams } from '../utils';

import { useGetOrgUnitParentLocations } from '../hooks/requests/useGetOrgUnitParentLocations';
import { useGetOrgUnitParentIds } from '../hooks/useGetOrgUnitParentIds';

type Props = {
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    saveAssignment: (params: SaveAssignmentQuery) => void;
    // eslint-disable-next-line no-unused-vars
    saveMultiAssignments: (params: SaveAssignmentQuery) => void;
    params: AssignmentParams;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: OrgUnitShape | undefined) => void;
    childrenOrgunits: OrgUnit[];
    parentSelected: OrgUnitShape | undefined;
    selectedItem: SubTeam | User | undefined;
    locations: Locations | undefined;
    isFetchingLocations: boolean;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    allAssignments,
    planning,
    currentTeam,
    teams,
    profiles,
    saveAssignment,
    saveMultiAssignments,
    params,
    setParentSelected,
    childrenOrgunits,
    parentSelected,
    selectedItem,
    locations,
    isFetchingLocations,
}) => {
    const { parentPicking, parentOrgunitType } = params;

    const handleSave = (selectedOrgUnit: OrgUnitShape | OrgUnitMarker) => {
        if (planning && selectedItem) {
            const saveParams = getSaveParams({
                allAssignments,
                selectedOrgUnit,
                teams,
                profiles,
                currentType: currentTeam?.type,
                selectedItem,
                planning,
            });
            saveAssignment(saveParams);
        }
    };

    const { data: parentLocations, isFetching: isFetchingParentLocations } =
        useGetOrgUnitParentLocations({
            orgUnitParentIds: useGetOrgUnitParentIds({
                currentTeam,
                allAssignments,
                planning,
            }),
            baseOrgunitType:
                parentPicking === 'true' ? parentOrgunitType : undefined,
        });
    return (
        <>
            <ParentDialog
                locations={locations}
                childrenOrgunits={childrenOrgunits || []}
                parentSelected={parentSelected}
                setParentSelected={setParentSelected}
                allAssignments={allAssignments}
                selectedItem={selectedItem}
                currentTeam={currentTeam}
                teams={teams}
                profiles={profiles}
                saveMultiAssignments={saveMultiAssignments}
                planning={planning}
            />

            <AssignmentsMap
                locations={locations}
                isFetchingLocations={isFetchingLocations}
                handleClick={handleSave}
                handleParentClick={setParentSelected}
                parentLocations={parentLocations}
                isFetchingParentLocations={isFetchingParentLocations}
                teams={teams}
            />
        </>
    );
};
