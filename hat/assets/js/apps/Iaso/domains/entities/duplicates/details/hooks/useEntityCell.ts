import { useCallback, Dispatch } from 'react';
import { isEqual } from 'lodash';
import { DuplicateEntityForTable, EntityForTableData } from '../../types';

const getEntityStatus = (
    base: EntityForTableData | undefined,
    compare: EntityForTableData | undefined,
    final: EntityForTableData | undefined,
): 'selected' | 'dropped' | 'diff' | 'identical' => {
    if (base?.value !== compare?.value && !final?.value) return 'diff';
    if (base?.value !== compare?.value && base?.value === final?.value)
        return 'selected';
    if (base?.value !== compare?.value && base?.value !== final?.value)
        return 'dropped';
    return 'identical';
};

const makeNewRowValues = (
    field: {
        field: string;
        label: string | Record<string, string>;
    },
    entity1: EntityForTableData | undefined,
    entity2: EntityForTableData | undefined,
    base: 'entity1' | 'entity2',
): DuplicateEntityForTable => {
    const final = base === 'entity1' ? entity1 : entity2;
    const compare = base === 'entity1' ? entity2 : entity1;
    return {
        field,
        entity1: {
            ...entity1,
            status: getEntityStatus(entity1, entity2, final),
        },
        entity2: {
            ...entity2,
            status: getEntityStatus(entity2, entity1, final),
        },
        final: {
            ...final,
            status: getEntityStatus(final, compare, final),
        },
    };
};

type UseEntityCellArgs = {
    field: {
        field: string;
        label: string | Record<string, string>;
    };
    entity1: EntityForTableData | undefined;
    entity2: EntityForTableData | undefined;
    state: DuplicateEntityForTable[];
    updateCellState: (
        // eslint-disable-next-line no-unused-vars
        index: number,
        // eslint-disable-next-line no-unused-vars
        value: DuplicateEntityForTable,
    ) => void;
    setQuery: Dispatch<any>;
    key: 'entity1' | 'entity2';
};

export const useEntityCell = ({
    field,
    entity1,
    entity2,
    state,
    updateCellState,
    setQuery,
    key,
}: UseEntityCellArgs): (() => void) => {
    const newRowValues = makeNewRowValues(field, entity1, entity2, key);
    const rowIndex = state.findIndex(row => isEqual(row.field, field));
    const onClick = useCallback(() => {
        const reference = key === 'entity1' ? entity1 : entity2;
        if (reference?.status !== 'identical') {
            updateCellState(rowIndex, newRowValues);
            setQuery({ [field.field]: reference?.id });
        }
    }, [
        key,
        entity1,
        entity2,
        updateCellState,
        setQuery,
        field.field,
        rowIndex,
        newRowValues,
    ]);
    return onClick;
};
