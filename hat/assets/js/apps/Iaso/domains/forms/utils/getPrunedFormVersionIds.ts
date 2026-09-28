export type PrunableFormVersion = {
    value: string;
    formId: number;
};

// Prunes selected version IDs that do not belong to the selected form IDs.
export const getPrunedFormVersionIds = (
    currentVersionIdsStr: string | undefined | null,
    formIdsStr: string | undefined | null,
    formVersions: PrunableFormVersion[] = [],
): string | null => {
    if (!currentVersionIdsStr || !formIdsStr) return null;
    if (formVersions.length === 0) return currentVersionIdsStr;

    const formIdsSet = new Set(
        formIdsStr
            .split(',')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id)),
    );

    const versionToFormMap = new Map<string, number>(
        formVersions.map(v => [v.value, v.formId]),
    );

    const prunedVersionIds = currentVersionIdsStr.split(',').filter(vId => {
        const parentFormId = versionToFormMap.get(vId);
        return parentFormId !== undefined && formIdsSet.has(parentFormId);
    });

    return prunedVersionIds.length > 0 ? prunedVersionIds.join(',') : null;
};
