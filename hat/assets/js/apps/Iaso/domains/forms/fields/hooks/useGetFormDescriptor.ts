import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { FormDescriptor } from '../../types/forms';

type FormVersions = {
    descriptor: FormDescriptor;
};
type FormVersionsList = {
    // eslint-disable-next-line camelcase
    form_versions: FormVersions[];
};

const getVersion = (formId: number | undefined): Promise<FormVersionsList> => {
    return getRequest(`/api/formversions/?form_id=${formId}&fields=descriptor`);
};

const processResult = (
    data: FormVersionsList | undefined,
): FormDescriptor[] | undefined => {
    if (!data) return data;
    return data.form_versions?.map(version => version.descriptor);
};

export const useGetFormDescriptor = (
    formId?: number,
): UseQueryResult<FormDescriptor[] | undefined, Error> => {
    const queryKey: [string, number | undefined] = [
        'instanceDescriptor',
        formId,
    ];
    return useSnackQuery({
        queryKey,
        queryFn: () => getVersion(formId),
        options: {
            enabled: Boolean(formId),
            select: data => processResult(data),
        },
    });
};

export const useGetAllFormDescriptors = (): UseQueryResult<
    FormDescriptor[] | undefined,
    Error
> => {
    return useSnackQuery({
        queryKey: ['instanceDescriptors'],
        queryFn: () => getRequest('/api/formversions/?fields=descriptor'),
        options: {
            select: data => processResult(data),
        },
    });
};
