import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';

type Team = {
    id: number;
    name: string;
    project: number;
};

type Teams = Team[];

const getTeams = (): Promise<Teams> => {
    return getRequest('/api/teams/');
};

export const useGetTeams = (
    projectId?: number,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryKey: any[] = ['teams', projectId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getTeams(),
        options: {
            select: data => {
                if (!data) return data;
                return data
                    .filter(team =>
                        projectId ? team.project === projectId : Boolean(team),
                    )
                    .map(team => {
                        return {
                            value: team.id.toString(),
                            label: team.name,
                            original: team,
                        };
                    });
            },
        },
    });
};
