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
