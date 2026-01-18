import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { FormState } from 'Iaso/domains/entities/components/EntitiesQuerybuilder/utils';
import { getRequest } from '../../../../libs/Api';
import { useSnackQueries, useSnackQuery } from '../../../../libs/apiHooks';
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
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
        },
    });
};
export const useDynamicFormDescriptors = (formStates: FormState[]) => {
    const formIds = useMemo(() => {
        const uniqueIds = new Set<number>();
        formStates?.forEach(state => {
            if (state.form?.id) {
                uniqueIds.add(state.form.id);
            }
        });
        return Array.from(uniqueIds);
    }, [formStates]);

    const queries = useMemo(() => {
        return formIds.map(formId => ({
            queryKey: ['formDescriptor', formId],
            queryFn: () => getVersion(formId),
            snackErrorMsg: 'Error fetching form descriptor',
            options: {
                enabled: Boolean(formId),
                select: data => processResult(data),
                staleTime: 60000,
                cacheTime: 1000 * 60 * 5,
            },
        }));
    }, [formIds]);

    const results = useSnackQueries(queries as any);

    const descriptorsMap = useMemo(() => {
        const map = new Map<number, FormDescriptor[]>();
        results.forEach((result, index) => {
            if (result.data && formIds[index]) {
                map.set(formIds[index], result.data as FormDescriptor[]);
            }
        });
        return map;
    }, [results, formIds]);

    return {
        descriptorsMap,
        isFetching: results.some(result => result.isFetching),
        isError: results.some(result => result.isError),
    };
};
