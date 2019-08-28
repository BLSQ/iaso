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

export const getAliasesArrayFromString = aliasString => aliasString.replace('[', '').replace(']', '').replace(/"/gi, '').split(',');
