import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { teamsList } from '../../mockTeamsList';

export type SavePlanningQuery = {
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    forms: number[];
    selectedOrgUnits: number[];
    selectedTeam: number;
    publishingStatus: boolean;
};

export const waitFor = (delay: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, delay));

// TODO delete when backend available
const makePlanning = (body: SavePlanningQuery) => {
    return {
        id: body.id ?? Math.floor(Math.random() * 20), // TODO make the rnge from 9 to 20
        name: body.name,
        start_date: body.startDate,
        end_date: body.endDate,
        team:
            teamsList.teams.filter(team => team.id === body.selectedTeam)[0] ??
            null,
        status: body.publishingStatus,
    };
};

const mockSavePlanning = async (body: SavePlanningQuery) => {
    await waitFor(1500);
    return makePlanning(body);
};

export const useSavePlanning = (type: 'create' | 'edit'): UseMutationResult => {
    // TODO replace with patch request
    const savePlanning = useSnackMutation(
        (data: SavePlanningQuery) => mockSavePlanning(data),
        undefined,
        undefined,
        ['planningsList'],
    );
    // TODO replace with post request
    const createPlanning = useSnackMutation(
        (data: SavePlanningQuery) => mockSavePlanning(data),
        undefined,
        undefined,
        ['planningsList'],
    );

    return type === 'create' ? createPlanning : savePlanning;
};
