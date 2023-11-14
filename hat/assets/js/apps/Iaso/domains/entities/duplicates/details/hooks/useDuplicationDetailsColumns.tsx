import React, { useMemo } from 'react';
import { useSafeIntl, Column } from 'bluesquare-components';
import { Box } from '@mui/material';
import MESSAGES from '../../messages';
import { formatLabel } from '../../../../instances/utils';
import { convertValueIfDate } from '../../../../../components/Cells/DateTimeCell';
import { DuplicateEntityForTable } from '../../types';
import { useEntityCell } from './useEntityCell';
import { findDescriptorInChildren } from '../../../../../utils';

type UseDuplicationDetailsColumnsArgs = {
    state: DuplicateEntityForTable[];
    updateCellState: (
        // eslint-disable-next-line no-unused-vars
        index: number,
        // eslint-disable-next-line no-unused-vars
        value: DuplicateEntityForTable,
    ) => void;
    setQuery: React.Dispatch<any>;
    descriptors: { descriptor1: any; descriptor2: any };
};

export const useDuplicationDetailsColumns = ({
    state,
    updateCellState,
    setQuery,
    descriptors,
}: UseDuplicationDetailsColumnsArgs): Column[] => {
    const { formatMessage } = useSafeIntl();

    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.field),
                accessor: 'field',
                resizable: false,
                sortable: true,
                Cell: settings => {
                    return (
                        <span>{formatLabel(settings.row.original.field)}</span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.entityA),
                accessor: 'entity1',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { field, entity1, entity2 } = settings.row.original;
                    const onClick = useEntityCell({
                        field,
                        entity1,
                        entity2,
                        key: 'entity1',
                        setQuery,
                        state,
                        updateCellState,
                    });

                    const descr = findDescriptorInChildren(
                        settings.row.original.entity1.value,
                        descriptors.descriptor1,
                    );
                    const result = convertValueIfDate(
                        descr
                            ? formatLabel(descr)
                            : settings.row.original.entity1.value,
                    );

                    return (
                        <Box onClick={onClick} role="button" tabIndex={0}>
                            {result}
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.entityB),
                accessor: 'entity2',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { field, entity1, entity2 } = settings.row.original;
                    const onClick = useEntityCell({
                        field,
                        entity1,
                        entity2,
                        key: 'entity2',
                        setQuery,
                        state,
                        updateCellState,
                    });
                    const descr = findDescriptorInChildren(
                        settings.row.original.entity2.value,
                        descriptors.descriptor2,
                    );
                    console.log('value', settings.row.original.entity2.value)
                    console.log('descr', descr)
                    const result = convertValueIfDate(
                        descr
                            ? formatLabel(descr)
                            : settings.row.original.entity2.value,
                    );
                    console.log('result', result)

                    return (
                        <div onClick={onClick} role="button" tabIndex={0}>
                            {result}
                        </div>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.finalValue),
                accessor: 'final',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { final } = settings.row.original;
                    const descr = findDescriptorInChildren(
                        final.value,
                        descriptors.descriptor1,
                    );
                    const result = convertValueIfDate(
                        descr ? formatLabel(descr) : final.value,
                    );
                    return <div>{result}</div>;
                },
            },
        ];
    }, [
        formatMessage,
        setQuery,
        state,
        updateCellState,
        descriptors.descriptor1,
        descriptors.descriptor2,
    ]);
};
