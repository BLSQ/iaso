import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

import { Selection } from '../../orgUnits/types/selection';
import { Profile } from '../../../utils/usersUtils';

type OrgUnit = {
    id: string;
};

export type BulkSaveQuery = {
    addRole?: string;
    removeRole?: string;
    addProjects: string[];
    removeProjects: string[];
    language?: 'en' | 'fr';
    locations: OrgUnit[];
    selection: Selection<Profile>;
};

const bulkSaveProfiles = (data: BulkSaveQuery) => {
    const url = `/api/profiles/bulk_save/`;
    const {
        addRole,
        removeRole,
        addProjects,
        removeProjects,
        language,
        locations,
        selection,
    } = data;
    return postRequest(url, {
        addRoleId: addRole ? parseInt(addRole, 10) : undefined,
        removeRoleId: removeRole ? parseInt(removeRole, 10) : undefined,
        addProjectsId: addProjects.map(projectId => parseInt(projectId, 10)),
        removeProjectsIds: removeProjects.map(projectId =>
            parseInt(projectId, 10),
        ),
        locationId: locations.map(location => parseInt(location.id, 10)),
        language,
        selection,
    });
};

export const useBulkSaveProfiles = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: bulkSaveProfiles,
        showSucessSnackBar: false,
        invalidateQueryKey: ['profiles'],
    });
};
