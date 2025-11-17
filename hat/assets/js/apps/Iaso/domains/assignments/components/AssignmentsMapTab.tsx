import React, { FunctionComponent } from 'react';

import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';

import { Profile } from '../../../utils/usersUtils';

import { ParentOrgUnit } from '../../orgUnits/types/orgUnit';
import { DropdownTeamsOptions, Team } from '../../teams/types/team';
import { useGetOrgUnitParentLocations } from '../hooks/requests/useGetOrgUnitParentLocations';
import { useGetOrgUnitParentIds } from '../hooks/useGetOrgUnitParentIds';
import { AssignmentParams, AssignmentsApi } from '../types/assigment';
import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { Planning } from '../types/planning';

import { AssignmentsMap } from './AssignmentsMap';

type Props = {
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    params: AssignmentParams;
    setParentSelected: (orgUnit: ParentOrgUnit | undefined) => void;
    locations: Locations | undefined;
    isFetchingLocations: boolean;
    isLoadingAssignments: boolean;
    handleSaveAssignment: (
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => void;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    allAssignments,
    planning,
    currentTeam,
    teams,
    profiles,
    handleSaveAssignment,
    params,
    setParentSelected,
    locations,
    isFetchingLocations,
    isLoadingAssignments,
    orgunitTypes,
    isFetchingOrgunitTypes,
}) => {
    const { parentOrgunitType } = params;

    const { data: parentLocations, isFetching: isFetchingParentLocations } =
        useGetOrgUnitParentLocations({
            orgUnitParentIds: useGetOrgUnitParentIds({
                currentTeam,
                allAssignments,
                planning,
                isLoadingAssignments,
            }),
            baseOrgunitType: parentOrgunitType,
        });
    return (
        <AssignmentsMap
            locations={locations}
            isFetchingLocations={isFetchingLocations}
            handleClick={handleSaveAssignment}
            handleParentClick={setParentSelected}
            parentLocations={parentLocations}
            isFetchingParentLocations={isFetchingParentLocations}
            teams={teams}
            profiles={profiles}
            assignments={allAssignments}
            orgunitTypes={orgunitTypes}
            isFetchingOrgunitTypes={isFetchingOrgunitTypes}
            params={params}
        />
    );
};
