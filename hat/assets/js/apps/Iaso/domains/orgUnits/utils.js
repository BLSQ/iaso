import React from 'react';
import orderBy from 'lodash/orderBy';
import { textPlaceholder } from '../../constants/uiConstants';
import MESSAGES from './messages';

export const getPolygonPositionsFromSimplifiedGeom = field => {
    const positionsArrays = field
        .split('((')[1]
        .replace('))', '')
        .replace(/, /gi, ',')
        .split(',');
    const polygonPositions = [];
    positionsArrays.forEach(pos => {
        const lat = pos.split(' ')[0];
        const lng = pos.split(' ')[1];
        polygonPositions.push([lng, lat]);
    });
    return polygonPositions;
};

export const fetchLatestOrgUnitLevelId = levels => {
    if (levels) {
        const levelsIds = levels.split(',');
        const latestId = parseInt(levelsIds[levelsIds.length - 1], 10);
        return latestId;
    }
    return null;
};

export const getOrgUnitsTree = orgUnit => {
    let tree = [orgUnit];
    const orgUnitLoop = (parent, tempTree) => {
        let treeCopy = [parent, ...tempTree];
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

export const getAliasesArrayFromString = aliasString =>
    aliasString.replace('[', '').replace(']', '').replace(/"/gi, '').split(',');

export const getSourcesWithoutCurrentSource = (
    sourcesList,
    currentSourceId,
) => {
    const sources = [];
    sourcesList.forEach(s => {
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
            message += ` (${orgUnit.org_unit_type_name})`;
        }
    }
    return message;
};

const mapOrgUnitBySearch = (orgUnits, searches) => {
    const mappedOrgunits = [];
    searches.forEach((search, i) => {
        mappedOrgunits[i] = orgUnits.filter(o => o.search_index === i);
    });
    return mappedOrgunits;
};

const orderOrgUnitsByDepthAndSearch = orgUnits =>
    orderBy(
        orgUnits,
        [o => o.org_unit_type_depth],
        [o => o.search_index],
        ['asc', 'asc'],
    );

export const mapOrgUnitByLocation = (orgUnits, searches) => {
    let shapes = orgUnits.filter(o => Boolean(o.geo_json));
    let locations = orgUnits.filter(o => Boolean(o.latitude && o.longitude));

    shapes = orderOrgUnitsByDepthAndSearch(shapes);
    locations = orderOrgUnitsByDepthAndSearch(locations);
    const mappedOrgunits = {
        shapes,
        locations,
    };
    mappedOrgunits.locations = mapOrgUnitBySearch(
        mappedOrgunits.locations,
        searches,
    );
    return mappedOrgunits;
};

export const getColorsFromParams = params => {
    const searches = JSON.parse(params.searches);
    return searches.map(s => s.color);
};

export const decodeSearch = search => JSON.parse(search);

export const encodeUriSearches = searches => {
    const newSearches = [...searches];

    newSearches.forEach((s, i) => {
        Object.keys(s).forEach(key => {
            const value = s[key];
            newSearches[i][key] =
                key === 'search' ? encodeURIComponent(value) : value;
        });
    });
    return JSON.stringify(newSearches);
};

export const encodeUriParams = params => {
    const searches = encodeUriSearches([...decodeSearch(params.searches)]);
    const newParams = {
        ...params,
        searches,
    };
    return newParams;
};

export const getOrgUnitParents = (orgUnit, parents = []) => {
    let parentsList = [...parents];
    if (orgUnit.parent) {
        parentsList.push(orgUnit);
        if (orgUnit.parent.parent) {
            parentsList = getOrgUnitParents(orgUnit.parent, parentsList);
        }
    }
    return parentsList;
};

export const getOrgUnitParentsString = orgUnit =>
    getOrgUnitParents(orgUnit)
        .map(ou =>
            ou.parent_name !== '' ? ou.parent_name : ou.org_unit_type_name,
        )
        .reverse()
        .join(' > ');

export const getOrgUnitParentsIds = orgUnit =>
    getOrgUnitParents(orgUnit)
        .map(ou => ou.parent_id)
        .reverse();

export const getStatusMessage = (status, formatMessage) => {
    switch (status) {
        case 'NEW': {
            return formatMessage(MESSAGES.new);
        }
        case 'REJECTED': {
            return formatMessage(MESSAGES.rejected);
        }
        default:
            return formatMessage(MESSAGES.validated);
    }
};

export const getOrgUnitGroups = orgUnit => (
    <span>
        {orgUnit.groups &&
            orgUnit.groups.length > 0 &&
            orgUnit.groups.map(g => g.name).join(', ')}
        {(!orgUnit.groups || orgUnit.groups.length === 0) && textPlaceholder}
    </span>
);
