import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptionsWithOriginal } from '../../../../types/utils';
import MESSAGES from '../../../plannings/messages';
import { Project } from '../../types/project';

export const useGetProjectsDropDown = (): UseQueryResult<
    DropdownOptionsWithOriginal<Project>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['projects'],
        queryFn: () => getRequest('/api/projects/'),
        snackErrorMsg: MESSAGES.projectsError,
        options: {
            select: data => {
                return (
                    data?.projects?.map((project: Project) => {
                        return {
                            value: project.id,
                            label: project.name,
                            original: project,
                            color: project.color,
                        };
                    }) ?? []
                );
            },
        },
    });
};
