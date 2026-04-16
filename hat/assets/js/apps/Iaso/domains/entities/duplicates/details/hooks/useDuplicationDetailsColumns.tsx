import { Box } from '@mui/material';
import { Column, useSafeIntl } from 'bluesquare-components';
import React, { useMemo } from 'react';
import { convertValueIfDate } from '../../../../../components/Cells/DateTimeCell';
import { findDescriptorInChildren } from '../../../../../utils';
import {
    ENTITY_DUPLICATES_SOFT_DELETE,
    hasFeatureFlag,
} from '../../../../../utils/featureFlags';
import { useCurrentUser } from '../../../../../utils/usersUtils';
import { formatLabel } from '../../../../instances/utils';
import MESSAGES from '../../messages';
import { DuplicateEntityForTable } from '../../types';
import { useEntityCell } from './useEntityCell';

type UseDuplicationDetailsColumnsArgs = {
    state: DuplicateEntityForTable[];
    updateCellState: (index: number, value: DuplicateEntityForTable) => void;
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
    const currentUser = useCurrentUser();

    return useMemo(() => {
        const columns = [
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

                    const fieldDescriptor = findDescriptorInChildren(
                        field.field,
                        descriptors.descriptor1,
                    );
                    const descr = fieldDescriptor?.children?.find(
                        child => child.name === entity1.value,
                    );
                    const result = convertValueIfDate(
                        descr ? formatLabel(descr) : entity1.value,
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
                    const fieldDescriptor = findDescriptorInChildren(
                        field.field,
                        descriptors.descriptor2,
                    );
                    const descr = fieldDescriptor?.children?.find(
                        child => child.name === entity2.value,
                    );
                    const result = convertValueIfDate(
                        descr ? formatLabel(descr) : entity2.value,
                    );

                    return (
                        <div onClick={onClick} role="button" tabIndex={0}>
                            {result}
                        </div>
                    );
                },
            },
        ];

        if (!hasFeatureFlag(currentUser, ENTITY_DUPLICATES_SOFT_DELETE)) {
            columns.push({
                Header: formatMessage(MESSAGES.finalValue),
                accessor: 'final',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { field, final } = settings.row.original;
                    const fieldDescriptor = findDescriptorInChildren(
                        field.field,
                        descriptors.descriptor1,
                    );
                    const descr = fieldDescriptor?.children?.find(
                        child => child.name === final.value,
                    );
                    const result = convertValueIfDate(
                        descr ? formatLabel(descr) : final.value,
                    );
                    return <div>{result}</div>;
                },
            });
        }

        return columns;
    }, [
        formatMessage,
        setQuery,
        state,
        updateCellState,
        descriptors.descriptor1,
        descriptors.descriptor2,
    ]);
};
