import { useSnackQuery } from '../../../libs/apiHooks';
import { useCurrentUser } from '../../../utils/usersUtils';
import { getRootData } from '../../orgUnits/components/TreeView/requests';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

/**
 * Id of the top-level org unit of the hierarchy, used to preselect the parent org unit
 * filter of the promptness page when arriving from the form details page.
 *
 * Uses the root level of the org unit treeview: the org units assigned to the user,
 * or the root org units of the pyramid if the user is not restricted to a part of it.
 * The first one (they are ordered by name) is used.
 */
export const useGetPromptnessDefaultParentId = (
    enabled = true,
): string | undefined => {
    const currentUser = useCurrentUser();
    const defaultVersionId = currentUser?.account?.default_version?.id;

    const { data } = useSnackQuery<OrgUnit[]>({
        queryKey: ['promptnessDefaultParentOrgUnit', defaultVersionId],
        queryFn: () => getRootData(defaultVersionId, 'version'),
        options: {
            enabled,
            staleTime: Infinity,
            cacheTime: 1000 * 60 * 5,
        },
    });

    return data?.[0]?.id?.toString();
};
