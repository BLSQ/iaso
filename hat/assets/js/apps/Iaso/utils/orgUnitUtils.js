export const getPolygonPositionsFromSimplifiedGeom = (field) => {
    const positionsArrays = field.split('((')[1].replace('))', '').replace(/, /gi, ',').split(',');
    const polygonPositions = [];
    positionsArrays.forEach((pos) => {
        const lat = pos.split(' ')[0];
        const lng = pos.split(' ')[1];
        polygonPositions.push([lng, lat]);
    });
    return polygonPositions;
};

export const fetchLatestOrgUnitLevelId = (levels) => {
    if (levels) {
        const levelsIds = levels.split(',');
        const latestId = parseInt(levelsIds[levelsIds.length - 1], 10);
        return latestId;
    }
    return null;
};

export const getAliasesArrayFromString = aliasString => aliasString.replace('[', '').replace(']', '').replace(/"/gi, '').split(',');
