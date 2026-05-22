import { ReactNode, useMemo } from 'react';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';
import { useHumanReadableJsonLogic } from 'bluesquare-components';
import { isEqual } from 'lodash';
import uniqWith from 'lodash/uniqWith';
import { useGetFormDescriptor } from 'Iaso/domains/forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuilderListToReplace } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuilderListToReplace';
import { useGetQueryBuildersFields } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuildersFields';
import { useGetPossibleFieldsByFormVersion } from 'Iaso/domains/forms/hooks/useGetPossibleFields';
import { PossibleField } from 'Iaso/domains/forms/types/forms';
import { iasoFields } from '../config/followUps';

export const useGetFieldsForForm = (form_id: number) => {
    const { formVersions: targetPossibleFieldsByVersion } =
        useGetPossibleFieldsByFormVersion(form_id);
    const targetPossibleFields: PossibleField[] | undefined = useMemo(() => {
        if (!targetPossibleFieldsByVersion) return undefined;
        return uniqWith(
            targetPossibleFieldsByVersion.flatMap(
                formVersion => formVersion.possible_fields,
            ),
            isEqual,
        );
    }, [targetPossibleFieldsByVersion]);
    const { data: formDescriptors } = useGetFormDescriptor(form_id);
    return useGetQueryBuildersFields(
        formDescriptors,
        targetPossibleFields,
        iasoFields,
    );
};

export const useHumanReadableJsonLogicForForm = (
    form_id: number,
): ((logic?: JsonLogicTree) => ReactNode) => {
    const fields = useGetFieldsForForm(form_id);
    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    return useHumanReadableJsonLogic(fields, queryBuilderListToReplace);
};
