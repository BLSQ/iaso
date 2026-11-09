import { LevelOrgUnitNode } from '../mainPanel/types';
import {
    FindOrgUnitRow,
    flattenFindOrgUnitRows,
    getOrgUnitChain,
    indexTree,
} from './utils';

const makeOrgUnit = (
    id: number,
    name: string,
    parent: number | null,
    children: LevelOrgUnitNode[] = [],
): LevelOrgUnitNode =>
    ({ id, name, parent, children }) as unknown as LevelOrgUnitNode;

const fullTreeRoots = [
    makeOrgUnit(1, 'Bas Uele', null, [
        makeOrgUnit(2, 'Aketi', 1, [
            makeOrgUnit(4, 'Aketi Centre', 2, [makeOrgUnit(7, 'CS Mobati', 4)]),
            makeOrgUnit(5, 'Aketi Nord', 2),
        ]),
        makeOrgUnit(3, 'Bambesa', 1, [makeOrgUnit(6, 'Bambesa Sud', 3)]),
    ]),
];

// The quick request stops at level 1: the zones come without their areas.
const quickTreeRoots = [
    makeOrgUnit(1, 'Bas Uele', null, [
        makeOrgUnit(2, 'Aketi', 1),
        makeOrgUnit(3, 'Bambesa', 1),
    ]),
];

const quickTree = indexTree(quickTreeRoots, 0);
const fullTree = indexTree(fullTreeRoots);

const rowSummary = (rows: FindOrgUnitRow[]) =>
    rows.map(({ orgUnit, depth, isExpanded, hasChildren }) => [
        orgUnit.id,
        depth,
        isExpanded,
        hasChildren,
    ]);

describe('indexTree', () => {
    it('knows the children of every org unit of a full tree', () => {
        expect(fullTree.childrenById.get(2)?.map(({ id }) => id)).toEqual([
            4, 5,
        ]);
        expect(fullTree.childrenById.get(5)).toEqual([]);
    });

    it('leaves the children unknown below the known depth', () => {
        expect(quickTree.childrenById.get(1)?.map(({ id }) => id)).toEqual([
            2, 3,
        ]);
        expect(quickTree.childrenById.has(2)).toBe(false);
        expect(quickTree.orgUnitById.has(2)).toBe(true);
    });
});

describe('getOrgUnitChain', () => {
    it('returns the org units from the root down to the searched one', () => {
        expect(
            getOrgUnitChain(fullTree.orgUnitById, 7).map(({ id }) => id),
        ).toEqual([1, 2, 4, 7]);
    });

    it('returns an empty chain when the org unit is not loaded', () => {
        expect(getOrgUnitChain(quickTree.orgUnitById, 7)).toEqual([]);
    });
});

describe('flattenFindOrgUnitRows', () => {
    it('lists only the children of expanded org units without a search', () => {
        expect(
            rowSummary(flattenFindOrgUnitRows(quickTree, new Set([1]), '')),
        ).toEqual([
            [1, 0, true, true],
            [2, 1, false, undefined],
            [3, 1, false, undefined],
        ]);
    });

    it('marks the children of an org unit as unknown until their level is loaded', () => {
        expect(
            rowSummary(flattenFindOrgUnitRows(quickTree, new Set([1, 2]), '')),
        ).toEqual([
            [1, 0, true, true],
            [2, 1, true, undefined],
            [3, 1, false, undefined],
        ]);
    });

    it('keeps the branches holding a match and expands them, ignoring the expanded ids', () => {
        expect(
            rowSummary(flattenFindOrgUnitRows(fullTree, new Set(), ' mobati')),
        ).toEqual([
            [1, 0, true, true],
            [2, 1, true, true],
            [4, 2, true, true],
            [7, 3, false, false],
        ]);
    });

    it('only searches the loaded levels', () => {
        expect(flattenFindOrgUnitRows(quickTree, new Set(), 'mobati')).toEqual(
            [],
        );
    });

    it('matches names regardless of case', () => {
        expect(
            flattenFindOrgUnitRows(fullTree, new Set(), 'BAMBESA').map(
                ({ orgUnit }) => orgUnit.id,
            ),
        ).toEqual([1, 3, 6]);
    });
});
