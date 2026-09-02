import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

export type FormVersionDropdownOption = {
    label: string;
    value: string;
    formName: string;
    versionId: string;
    formId: number;
};

type FormVersionApiResult = {
    form_versions: Array<{
        id: number;
        version_id: string;
        form_id: number;
        form_name: string;
        full_name: string;
    }>;
};

export const useGetFormVersionsDropdownOptions = (): UseQueryResult<
    FormVersionDropdownOption[],
    Error
> => {
    const queryKey = useMemo(() => ['formVersionsAllDropdownOptions'], []);

    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(
                '/api/formversions/?order=form__name,-version_id&fields=id,version_id,form_id,form_name,full_name',
            ),
        options: {
            staleTime: 1000 * 60 * 15,
            select: (data: FormVersionApiResult) => {
                if (!data?.form_versions) return [];
                return data.form_versions.map(version => ({
                    label: `V${version.version_id} - ${version.form_name}`,
                    value: version.id.toString(),
                    formName: version.form_name,
                    versionId: version.version_id,
                    formId: version.form_id,
                }));
            },
        },
    });
};
