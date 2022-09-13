import { useGetForm } from './requests/forms';

import { PossibleField } from '../../../forms/types/forms';

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
