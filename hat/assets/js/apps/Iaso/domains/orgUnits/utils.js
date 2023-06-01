import React from 'react';

import { textPlaceholder, useSafeIntl, createUrl } from 'bluesquare-components';
import { getChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';

import { locationLimitMax } from './constants/orgUnitConstants';
import { orderOrgUnitsByDepth } from '../../utils/mapUtils.ts';

import MESSAGES from './messages';

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

export const orgUnitLabelString = (
    orgUnit,
    withType,
    formatMessage,
    withSource = true,
) => {
    let message = textPlaceholder;
    if (orgUnit && orgUnit.name) {
        message = orgUnit.name;
        if (orgUnit.source && withSource) {
            message += ` - ${formatMessage(MESSAGES.sourceLower)}: ${
                orgUnit.source
            }`;
        }
        if (orgUnit.org_unit_type_name && withType) {
            message += ` (${orgUnit.org_unit_type_name})`;
        }
    }
    return message;
};

export const OrgUnitLabel = ({ orgUnit, withType, withSource = false }) => {
    const intl = useSafeIntl();
    return orgUnitLabelString(
        orgUnit,
        withType,
        intl.formatMessage,
        withSource,
    );
};

const mapOrgUnitBySearch = (orgUnits, searches) => {
    const mappedOrgunits = [];
    searches.forEach((search, i) => {
        mappedOrgunits[i] = orgUnits.filter(o => o.search_index === i);
    });
    return mappedOrgunits;
};

export const mapOrgUnitByLocation = (orgUnits, searches) => {
    let shapes = orgUnits.filter(o => Boolean(o.geo_json));
    let locations = orgUnits.filter(o => Boolean(o.latitude && o.longitude));
    shapes = orderOrgUnitsByDepth(shapes);
    locations = orderOrgUnitsByDepth(locations);
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

export const decodeSearch = search => {
    try {
        return JSON.parse(search);
    } catch (e) {
        return [];
    }
};

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

export const getOrgUnitParents = orgUnit => {
    if (!orgUnit.parent) return [];
    return [orgUnit.parent, ...getOrgUnitParents(orgUnit.parent)];
};

export const getOrgUnitParentsString = orgUnit =>
    getOrgUnitParents(orgUnit)
        .map(ou => (ou.name !== '' ? ou.name : ou.org_unit_type_name))
        .reverse()
        .join(' > ');

export const getOrgUnitParentsIds = orgUnit =>
    getOrgUnitParents(orgUnit)
        .map(ou => ou.id)
        .reverse();

const getOrgUnitsParentsUntilRoot = (orgUnit, parents = []) => {
    let parentsList = [...parents];
    parentsList.push(orgUnit);
    if (orgUnit.parent) {
        parentsList = getOrgUnitsParentsUntilRoot(orgUnit.parent, parentsList);
    }
    return parentsList;
};

export const getOrgUnitAncestorsIds = orgUnit => {
    const result = getOrgUnitParentsIds(orgUnit);
    // Adding id of the org unit in case it's a root
    // and to be able to select it with the treeview
    result.push(orgUnit.id);
    return result;
};

export const getOrgUnitAncestors = orgUnit => {
    const result = new Map(
        getOrgUnitsParentsUntilRoot(orgUnit)
            .map(parent => [
                parent.id.toString(),
                {
                    // selecting the necessary fields, as there are many more than those returned by the API used in the treeview itself
                    // this will allow to use the same label formatting function in the TruncatedTreeview and in the Treeview
                    name: parent.name,
                    id: parent.id.toString(),
                    validation_status: parent.validation_status,
                },
            ])
            .reverse(),
    );
    return result;
};

export const getStatusMessage = (status, formatMessage) => {
    switch (status) {
        case 'NEW': {
            return formatMessage(MESSAGES.new);
        }
        case 'REJECTED': {
            return formatMessage(MESSAGES.rejected);
        }
        case 'CLOSED': {
            return formatMessage(MESSAGES.closed);
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

export const getLinksSources = (links, coloredSources, currentOrgUnit) => {
    let sources = [];
    links?.forEach(l => {
        const tempSources = getSourcesWithoutCurrentSource(
            coloredSources,
            currentOrgUnit.source_id,
        );
        const isSelectedSource = sourceId =>
            sources.find(ss => ss.id === sourceId);
        // getting the org unit source linked to current one and preselect them
        const linkSources = tempSources.filter(
            s =>
                (s.id === l.source.source_id &&
                    !isSelectedSource(l.source.source_id)) ||
                (s.id === l.destination.source_id &&
                    !isSelectedSource(l.destination.source_id)),
        );
        if (linkSources.length > 0) {
            sources = sources.concat(linkSources);
        }
    });
    return sources;
};

export const compareGroupVersions = (a, b) => {
    const comparison = a.name.localeCompare(b.name, undefined, {
        sensitivity: 'accent',
    });
    if (comparison === 0) {
        if (a.source_version.number < b.source_version.number) {
            return -1;
        }
        if (a.source_version.number > b.source_version.number) {
            return 1;
        }
        return 0;
    }
    return comparison;
};

export const getOrgUnitsUrl = accountId =>
    `${baseUrls.orgUnits}${createUrl(
        {
            accountId,
            locationLimit: locationLimitMax,
            order: 'id',
            pageSize: 50,
            page: 1,
            searchTabIndex: 0,
            searches: `[{"validation_status":"all", "color":"${getChipColors(
                0,
            ).replace('#', '')}"}]`,
        },
        '',
    )}`;
