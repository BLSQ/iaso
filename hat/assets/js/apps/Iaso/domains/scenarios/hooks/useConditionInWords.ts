import { ReactNode, useCallback } from 'react';
import { useGetFormDescriptor } from 'Iaso/domains/forms/fields/hooks/useGetFormDescriptor';
import { useHumanReadableJsonLogicForForm } from 'Iaso/domains/workflows/hooks/useHumanReadableJsonLogicForForm';
import { isJsonLogic } from '../utils';

/** A follow-up condition in words, from the fields of the reference form (by its id); its JsonLogic when it can't be. */
export const useConditionInWords = (
    referenceFormId: number,
): ((condition: unknown) => ReactNode) => {
    const humanReadable = useHumanReadableJsonLogicForForm(referenceFormId);
    // a select question gets its choices from the form descriptor: until it is loaded, the query builder would throw
    const { data: formDescriptors } = useGetFormDescriptor(referenceFormId);
    return useCallback(
        (condition: unknown) => {
            if (!formDescriptors || !isJsonLogic(condition)) {
                return null;
            }
            try {
                return humanReadable(condition);
            } catch {
                // a condition the query builder can't put in words: its JsonLogic
                return JSON.stringify(condition);
            }
        },
        [formDescriptors, humanReadable],
    );
};
