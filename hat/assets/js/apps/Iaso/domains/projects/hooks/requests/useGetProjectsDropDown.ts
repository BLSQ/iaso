import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';
import { Project } from '../../types/project';
import MESSAGES from '../../../plannings/messages';

export const useGetProjectsDropDown = (): UseQueryResult<
    DropdownOptions<number>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['projects'],
        queryFn: () => getRequest('/api/projects'),
        snackErrorMsg: MESSAGES.projectsError,
        options: {
            select: data => {
                return (
                    data?.projects?.map((project: Project) => {
                        return {
                            value: project.id,
                            label: project.name,
                        };
                    }) ?? []
                );
            },
        },
    });
};
