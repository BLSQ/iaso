import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

import { Selection } from '../../orgUnits/types/selection';
import { Profile } from '../../teams/types/profile';
import MESSAGES from '../messages';

type OrgUnit = {
    id: string;
};

export type BulkSaveQuery = {
    addRoles: string[];
    removeRoles: string[];
    addProjects: string[];
    removeProjects: string[];
    language?: 'en' | 'fr';
    addLocations: OrgUnit[];
    removeLocations: OrgUnit[];
    selection: Selection<Profile>;
    search?: string;
    permissions?: string;
    location?: string;
    orgUnitTypes?: string;
    ouParent?: string;
    ouChildren?: string;
    projectsIds?: string;
};

const bulkSaveProfiles = (data: BulkSaveQuery) => {
    const url = `/api/tasks/create/profilesbulkupdate/`;
    const {
        addRoles,
        removeRoles,
        addProjects,
        removeProjects,
        language,
        addLocations,
        removeLocations,
        selection: { selectAll, selectedItems, unSelectedItems },
        search,
        permissions,
        location,
        orgUnitTypes,
        ouParent,
        ouChildren,
        projectsIds,
    } = data;
    return postRequest(url, {
        roles_id_added: addRoles.map(roleId => parseInt(roleId, 10)),
        roles_id_removed: removeRoles.map(roleId => parseInt(roleId, 10)),
        projects_ids_added: addProjects.map(projectId =>
            parseInt(projectId, 10),
        ),
        projects_ids_removed: removeProjects.map(projectId =>
            parseInt(projectId, 10),
        ),
        location_ids_added: addLocations.map(loc => parseInt(loc.id, 10)),
        location_ids_removed: removeLocations.map(loc => parseInt(loc.id, 10)),
        language,
        select_all: selectAll,
        selected_ids: selectedItems.map(item => item.id),
        unselected_ids: unSelectedItems.map(item => item.id),
        search,
        permissions,
        location,
        orgUnitTypes,
        ouParent,
        ouChildren,
        projects: projectsIds,
    });
};

export const useBulkSaveProfiles = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: bulkSaveProfiles,
        snackSuccessMessage: MESSAGES.taskLaunched,
    });
};
