import { QuestionMapping } from './types';

/** Marker saved when the user chose "will never map" for a question. */
export const isNeverMapped = (
    questionMapping?: QuestionMapping | null,
): boolean => {
    if (!questionMapping || Array.isArray(questionMapping)) {
        return false;
    }
    return !questionMapping.id && questionMapping.type === 'neverMapped';
};

/** True when the question has a DHIS2 target (object with id, or non-empty list). */
export const isMapped = (questionMapping?: QuestionMapping | null): boolean => {
    if (!questionMapping) {
        return false;
    }
    if (Array.isArray(questionMapping)) {
        return questionMapping.length > 0;
    }
    return Boolean(questionMapping.id);
};
