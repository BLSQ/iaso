import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

export const useGetFormsOptions = (
    additionalFields?: string,
): UseQueryResult => {
    const params = {
        all: 'true',
        order: 'name',
        fields: `name,id,${additionalFields ?? ''}`,
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery({
        queryKey: ['forms', params],
        queryFn: () => getRequest(`/api/forms/?${queryString.toString()}`),
        options: {
            select: data => {
                if (!data) return [];
                if (additionalFields) {
                    return data.forms.map(form => ({
                        value: form.id,
                        label: form.name,
                        original: form,
                    }));
                }
                return data.forms.map(form => ({
                    value: form.id,
                    label: form.name,
                }));
            },
        },
    });
};
