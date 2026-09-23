// Prunes selected version IDs that do not belong to the selected form IDs.
export const getPrunedFormVersionIds = (
    currentVersionIdsStr: string | undefined | null,
    formIdsStr: string | undefined | null,
    versionToFormMap: Map<string, number>,
): string | null => {
    if (!currentVersionIdsStr) return null;
    if (!formIdsStr) return null;
    if (versionToFormMap.size === 0) return currentVersionIdsStr;

    const formIdsSet = new Set(
        formIdsStr
            .split(',')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id)),
    );

    const prunedVersionIds = currentVersionIdsStr.split(',').filter(vId => {
        const parentFormId = versionToFormMap.get(vId);
        return parentFormId !== undefined && formIdsSet.has(parentFormId);
    });

    return prunedVersionIds.length > 0 ? prunedVersionIds.join(',') : null;
};
