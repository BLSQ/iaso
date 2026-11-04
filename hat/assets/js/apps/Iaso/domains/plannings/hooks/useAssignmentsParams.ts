import { useCallback } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { AssignmentsMode, AssignmentsParams, AssignmentsView } from '../types';

type UseAssignmentsParams = AssignmentsParams & {
    mode: AssignmentsMode;
    view: AssignmentsView;
    updateParams: (changes: Partial<AssignmentsParams>) => void;
    openTeam: (teamId: number) => void;
};

export const useAssignmentsParams = (): UseAssignmentsParams => {
    const params = useParamsObject(baseUrls.assignments);
    const redirectToReplace = useRedirectToReplace();
    const updateParams = useCallback(
        (changes: Partial<AssignmentsParams>) =>
            redirectToReplace(baseUrls.assignments, { ...params, ...changes }),
        [params, redirectToReplace],
    );
    const openTeam = useCallback(
        (teamId: number) => updateParams({ teamId: `${teamId}` }),
        [updateParams],
    );
    return {
        planningId: params.planningId,
        teamId: params.teamId,
        mode: (params.mode as AssignmentsMode) ?? 'explore',
        view: (params.view as AssignmentsView) ?? 'map',
        updateParams,
        openTeam,
    };
};
