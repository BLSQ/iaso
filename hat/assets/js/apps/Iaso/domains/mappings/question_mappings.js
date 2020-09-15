export const isNeverMapped = questionMapping =>
    questionMapping &&
    !questionMapping.id &&
    questionMapping.type === 'neverMapped';
export const isMapped = questionMapping =>
    questionMapping && (questionMapping.id || questionMapping.length > 0);
