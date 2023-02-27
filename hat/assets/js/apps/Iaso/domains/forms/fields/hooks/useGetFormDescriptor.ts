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
            select: (
                data: FormVersionsList | undefined,
            ): FormDescriptor[] | undefined => {
                if (!data) return data;
                return data.form_versions?.map(version => version.descriptor);
            },
        },
    });
};
