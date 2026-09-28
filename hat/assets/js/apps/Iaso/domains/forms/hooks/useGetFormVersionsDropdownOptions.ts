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

export const useGetFormVersionsDropdownOptions = (
    formIds?: string,
): UseQueryResult<FormVersionDropdownOption[], Error> => {
    const normalizedFormIds = useMemo(
        () =>
            formIds
                ? formIds
                      .split(',')
                      .map(id => id.trim())
                      .filter(Boolean)
                      .sort((a, b) => {
                          const numA = Number(a);
                          const numB = Number(b);
                          if (!isNaN(numA) && !isNaN(numB)) {
                              return numA - numB;
                          }
                          return a.localeCompare(b);
                      })
                      .join(',') || undefined
                : undefined,
        [formIds],
    );

    const queryKey = ['formVersionsDropdownOptions', normalizedFormIds];

    const queryString = [
        'order=form__name,-version_id',
        'fields=id,version_id,form_id,form_name,full_name',
        normalizedFormIds ? `form_ids=${normalizedFormIds}` : '',
    ]
        .filter(Boolean)
        .join('&');

    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/formversions/?${queryString}`),
        options: {
            enabled: Boolean(normalizedFormIds),
            keepPreviousData: true,
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
