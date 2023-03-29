import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

export const useGetFormsOptions = () => {
    const params = {
        all: 'true',
        order: 'name',
        fields: 'name,id,period_type',
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery({
        queryKey: ['forms', params],
        queryFn: () => getRequest(`/api/forms/?${queryString.toString()}`),
        options: {
            select: data => {
                if (!data) return [];
                return data.forms.map(form => ({
                    value: form.id,
                    label: form.name,
                    original: form,
                }));
            },
        },
    });
};
