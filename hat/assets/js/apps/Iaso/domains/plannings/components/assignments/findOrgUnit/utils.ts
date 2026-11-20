import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { LevelOrgUnitNode } from '../mainPanel/types';

// Children are missing for the org units below the loaded depth.
export type LoadedOrgUnits = {
    roots: LevelOrgUnitNode[];
    orgUnitById: Map<number, LevelOrgUnitNode>;
    childrenById: Map<number, LevelOrgUnitNode[]>;
};

export type FindOrgUnitRow = {
    orgUnit: LevelOrgUnitNode;
    depth: number;
    isExpanded: boolean;
    // Unknown until the full tree is loaded.
    hasChildren?: boolean;
};

// Children deeper than knownChildrenDepth were cut off by the request's max depth: they stay unknown.
export const indexTree = (
    roots: LevelOrgUnitNode[],
    knownChildrenDepth = Infinity,
): LoadedOrgUnits => {
    const orgUnitById = new Map<number, LevelOrgUnitNode>();
    const childrenById = new Map<number, LevelOrgUnitNode[]>();
    const visit = (orgUnit: LevelOrgUnitNode, depth: number) => {
        orgUnitById.set(orgUnit.id, orgUnit);
        if (depth > knownChildrenDepth) return;
        childrenById.set(orgUnit.id, orgUnit.children);
        orgUnit.children.forEach(child => visit(child, depth + 1));
    };
    roots.forEach(root => visit(root, 0));
    return { roots, orgUnitById, childrenById };
};

// From the root down to the org unit, empty when it is not loaded.
export const getOrgUnitChain = (
    orgUnitById: Map<number, LevelOrgUnitNode>,
    orgUnitId: number,
): LevelOrgUnitNode[] => {
    const chain: LevelOrgUnitNode[] = [];
    let orgUnit = orgUnitById.get(orgUnitId);
    while (orgUnit) {
        chain.unshift(orgUnit);
        orgUnit = orgUnit.parent ? orgUnitById.get(orgUnit.parent) : undefined;
    }
    return chain;
};

type LocatedOrgUnit = {
    teamId: number;
    // The found org unit, or its ancestor where the descent stopped.
    shownOrgUnitId: number;
};

// Each team assigns the level below its own. Going down the chain, the descent opens the sub-team
// an ancestor is assigned to, until it reaches the org unit or an ancestor no sub-team holds.
export const locateOrgUnit = (
    chain: LevelOrgUnitNode[],
    rootTeam: TeamTreeNode,
    teamIdByOrgUnitId: Map<number, number>,
): LocatedOrgUnit | undefined => {
    const orgUnit = chain.at(-1);
    if (!orgUnit) return undefined;
    let team = rootTeam;
    let shown = orgUnit;
    for (const ancestorOrSelf of chain.slice(1)) {
        shown = ancestorOrSelf;
        if (shown.id === orgUnit.id) break;
        const subTeam = team.children.find(
            child => child.id === teamIdByOrgUnitId.get(shown.id),
        );
        if (!subTeam) break;
        team = subTeam;
    }
    return { teamId: team.id, shownOrgUnitId: shown.id };
};

// While searching, every branch holding a match is expanded and the others are hidden.
export const flattenFindOrgUnitRows = (
    { roots, childrenById }: LoadedOrgUnits,
    expandedIds: Set<number>,
    search: string,
): FindOrgUnitRow[] => {
    const query = search.trim().toLowerCase();
    const visit = (
        orgUnit: LevelOrgUnitNode,
        depth: number,
    ): FindOrgUnitRow[] => {
        const children = childrenById.get(orgUnit.id);
        const hasChildren = children && children.length > 0;
        const visitChildren = () =>
            (children ?? []).flatMap(child => visit(child, depth + 1));
        if (query) {
            const childRows = visitChildren();
            const isMatch = orgUnit.name.toLowerCase().includes(query);
            if (!isMatch && !childRows.length) return [];
            return [
                {
                    orgUnit,
                    depth,
                    hasChildren,
                    isExpanded: childRows.length > 0,
                },
                ...childRows,
            ];
        }
        const isExpanded = expandedIds.has(orgUnit.id);
        return [
            { orgUnit, depth, hasChildren, isExpanded },
            ...(isExpanded ? visitChildren() : []),
        ];
    };
    return roots.flatMap(root => visit(root, 0));
};
