import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

export const useGetFormsList = () => {
    return useSnackQuery({
        queryKey: ['formCopilotFormsList'],
        queryFn: () =>
            getRequest(
                '/api/forms/?fields=id,name,form_id,latest_form_version&limit=1000&order=name',
            ),
        options: {
            staleTime: 60000,
        },
    });
};
