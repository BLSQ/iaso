import { textPlaceholder } from '../../constants/uiConstants';

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

export const getOrgUnitsTree = (orgUnit) => {
    let tree = [orgUnit];
    const orgUnitLoop = (parent, tempTree) => {
        let treeCopy = [
            parent,
            ...tempTree,
        ];
        if (parent.parent) {
            treeCopy = orgUnitLoop(parent.parent, treeCopy);
        }
        return treeCopy;
    };

    if (orgUnit.parent) {
        tree = orgUnitLoop(orgUnit.parent, tree);
    }
    return tree;
};

export const getAliasesArrayFromString = aliasString => aliasString.replace('[', '').replace(']', '').replace(/"/gi, '').split(',');

export const getSourcesWithoutCurrentSource = (sourcesList, currentSourceId) => {
    const sources = [];
    sourcesList.forEach((s) => {
        if (s.id !== currentSourceId) {
            sources.push(s);
        }
    });
    return sources;
};


export const getOrgunitMessage = (orgUnit, withType) => {
    let message = textPlaceholder;
    if (orgUnit) {
        message = orgUnit.name;
        if (orgUnit.org_unit_type_name && withType) {
            message += `(${orgUnit.org_unit_type_name})`;
        }
    }
    return message;
};
