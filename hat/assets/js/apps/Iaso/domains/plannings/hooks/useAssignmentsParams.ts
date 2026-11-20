import { useCallback } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { AssignmentsMode, AssignmentsParams, AssignmentsView } from '../types';

type UseAssignmentsParams = Omit<AssignmentsParams, 'onlyUnassigned'> & {
    mode: AssignmentsMode;
    view: AssignmentsView;
    onlyUnassigned: boolean;
    updateParams: (changes: Partial<AssignmentsParams>) => void;
    openTeam: (teamId: number) => void;
    toggleOnlyUnassigned: () => void;
    pickAssignee: (teamId: number, memberKey: string) => void;
};

export const useAssignmentsParams = (): UseAssignmentsParams => {
    const params = useParamsObject(baseUrls.assignments);
    const redirectToReplace = useRedirectToReplace();
    const updateParams = useCallback(
        (changes: Partial<AssignmentsParams>) =>
            redirectToReplace(baseUrls.assignments, { ...params, ...changes }),
        [params, redirectToReplace],
    );
    // The found org unit belongs to the team it was found in.
    const openTeam = useCallback(
        (teamId: number) =>
            updateParams({ teamId: `${teamId}`, focusOrgUnitId: undefined }),
        [updateParams],
    );
    const onlyUnassigned = params.onlyUnassigned === 'true';
    const toggleOnlyUnassigned = useCallback(
        () =>
            updateParams({
                onlyUnassigned: onlyUnassigned ? undefined : 'true',
            }),
        [onlyUnassigned, updateParams],
    );
    const pickAssignee = useCallback(
        (teamId: number, memberKey: string) =>
            updateParams({ teamId: `${teamId}`, assignee: memberKey }),
        [updateParams],
    );
    return {
        planningId: params.planningId,
        teamId: params.teamId,
        focusOrgUnitId: params.focusOrgUnitId,
        mode: (params.mode as AssignmentsMode) ?? 'explore',
        view: (params.view as AssignmentsView) ?? 'map',
        onlyUnassigned,
        updateParams,
        assignee: params.assignee,
        openTeam,
        toggleOnlyUnassigned,
        pickAssignee,
    };
};
