import { useGetForm } from '../../entities/entityTypes/hooks/requests/forms';

import { PossibleField } from '../types/forms';

type Result = {
    possibleFields: PossibleField[];
    isFetchingForm: boolean;
};

export const useGetPossibleFields = (formId?: number): Result => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        formId,
        Boolean(formId),
        'possible_fields',
    );
    return {
        possibleFields: currentForm?.possible_fields || [],
        isFetchingForm,
    };
};
