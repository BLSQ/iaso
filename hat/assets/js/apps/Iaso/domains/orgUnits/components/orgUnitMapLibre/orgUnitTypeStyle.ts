import type { ExpressionSpecification } from 'maplibre-gl';
import { OrgUnitTypeCount } from './orgUnitTiles';

/** Stands for "no org unit type" in expressions and filters (a feature's missing `org_unit_type_id`) */
export const NO_TYPE = -1;
/** Color of the org units without a type, and of any type the palette can't give one */
export const NO_TYPE_COLOR = '#9e9e9e';

/** A feature's org unit type id, `NO_TYPE` when it has none */
export const featureTypeId: ExpressionSpecification = [
    'coalesce',
    ['get', 'org_unit_type_id'],
    NO_TYPE,
];

export const typeKey = (id: number | null): number => id ?? NO_TYPE;

/**
 * The color of an org unit type: picked from the palette by its id, so a type keeps its color whatever the
 * other types of the results (two types may share one when the palette is shorter than their ids are apart).
 */
export const typeColor = (id: number | null, palette: string[]): string =>
    id === null || palette.length === 0
        ? NO_TYPE_COLOR
        : palette[id % palette.length];

/** `fn(type)` per feature, as a MapLibre `match` on its type, `fallback` for the types not listed */
const byType = <T extends string | number>(
    types: OrgUnitTypeCount[],
    fn: (type: OrgUnitTypeCount) => T,
    fallback: T,
): ExpressionSpecification | T => {
    const cases = types
        .filter(type => type.id !== null)
        .flatMap(type => [type.id as number, fn(type)]);
    return cases.length === 0
        ? fallback
        : ([
              'match',
              featureTypeId,
              ...cases,
              fallback,
          ] as ExpressionSpecification);
};

/** Each feature in the color of its type */
export const typeColorExpression = (
    types: OrgUnitTypeCount[],
    palette: string[],
): ExpressionSpecification | string =>
    byType(types, type => typeColor(type.id, palette), NO_TYPE_COLOR);

/** Each feature's type depth: the shapes of the deeper types are drawn over the others (a zone over its province) */
export const typeDepthExpression = (
    types: OrgUnitTypeCount[],
): ExpressionSpecification | number =>
    byType(types, type => type.depth ?? 0, 0);

/** Leaves out the features of the `hidden` types (`typeKey`s) */
export const hiddenTypesFilter = (
    hidden: number[],
): ExpressionSpecification | undefined =>
    hidden.length === 0
        ? undefined
        : ['!', ['in', featureTypeId, ['literal', hidden]]];
