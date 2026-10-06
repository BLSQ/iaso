import { describe, expect, it } from 'vitest';
import { OrgUnitTypeCount } from './orgUnitTiles';
import {
    hiddenTypesFilter,
    NO_TYPE,
    NO_TYPE_COLOR,
    typeColor,
    typeColorExpression,
    typeDepthExpression,
    typeKey,
} from './orgUnitTypeStyle';

const type = (
    id: number | null,
    depth: number | null = null,
): OrgUnitTypeCount => ({
    id,
    name: id === null ? null : `Type ${id}`,
    depth,
    count: 1,
    located_count: 1,
});
const palette = ['#a', '#b', '#c'];

describe('orgUnitTypeStyle', () => {
    it('gives a type the same color whatever the other types', () => {
        expect(typeColor(42, palette)).toBe('#a');
        expect(typeColor(41, palette)).toBe('#c');
        expect(typeColor(null, palette)).toBe(NO_TYPE_COLOR);
        expect(typeColor(42, [])).toBe(NO_TYPE_COLOR);
    });

    it('colors each feature by its type, grey without one', () => {
        expect(
            typeColorExpression([type(42), type(null), type(41)], palette),
        ).toEqual([
            'match',
            ['coalesce', ['get', 'org_unit_type_id'], NO_TYPE],
            42,
            '#a',
            41,
            '#c',
            NO_TYPE_COLOR,
        ]);
        expect(typeColorExpression([type(null)], palette)).toBe(NO_TYPE_COLOR);
    });

    it('sorts shapes by the depth of their type', () => {
        expect(
            typeDepthExpression([type(38, 1), type(40, 3), type(41)]),
        ).toEqual([
            'match',
            ['coalesce', ['get', 'org_unit_type_id'], NO_TYPE],
            38,
            1,
            40,
            3,
            41,
            0,
            0,
        ]);
    });

    it('hides the features of the hidden types, the untyped ones included', () => {
        expect(hiddenTypesFilter([])).toBeUndefined();
        expect(hiddenTypesFilter([42, typeKey(null)])).toEqual([
            '!',
            [
                'in',
                ['coalesce', ['get', 'org_unit_type_id'], NO_TYPE],
                ['literal', [42, NO_TYPE]],
            ],
        ]);
    });
});
