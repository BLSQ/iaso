import React, { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import { cloneDeep } from 'lodash';
import classNames from 'classnames';
import MESSAGES from '../messages';
import { formatLabel } from '../../../instances/utils';
import { convertValueIfDate } from '../../../../components/Cells/DateTimeCell';

const getEntityStatus = (
    base,
    compare,
    final,
): 'selected' | 'dropped' | 'diff' | 'identical' => {
    if (base?.value !== compare?.value && !final?.value) return 'diff';
    if (base?.value !== compare?.value && base?.value === final?.value)
        return 'selected';
    if (base?.value !== compare?.value && base?.value !== final?.value)
        return 'dropped';
    return 'identical';
};

const useStyles = makeStyles({
    dropped: { color: 'rgba(0,0,0,0.6)' },
    selected: { fontWeight: 'bold' },
});

export const useDuplicationDetailsColumns = ({ state, setState, setQuery }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.field),
                accessor: 'field',
                resizable: false,
                sortable: true,
                Cell: settings => {
                    return formatLabel(settings.row.original.field);
                },
            },
            {
                Header: formatMessage(MESSAGES.entityA),
                accessor: 'entity1',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { field, entity1, entity2 } = settings.row.original;
                    const newRowValues = {
                        field,
                        entity1: {
                            ...cloneDeep(entity1),
                            status: getEntityStatus(entity1, entity2, entity1),
                        },
                        entity2: {
                            ...cloneDeep(entity2),
                            status: getEntityStatus(entity2, entity1, entity1),
                        },
                        final: {
                            ...cloneDeep(entity1),
                            status: getEntityStatus(entity1, entity2, entity1),
                        },
                    };
                    const rowIndex = state.findIndex(
                        row => row.field === field,
                    );

                    return (
                        <Box
                            onClick={() => {
                                if (entity1.status !== 'identical') {
                                    setState({
                                        index: rowIndex,
                                        value: newRowValues,
                                    });
                                    setQuery({ [field.field]: entity1.id });
                                }
                            }}
                            className={classNames(
                                entity1.status,
                                classes[entity1.status],
                            )}
                        >
                            {convertValueIfDate(
                                settings.row.original.entity1.value,
                            )}
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
                    const newRowValues = {
                        field,
                        entity1: {
                            ...cloneDeep(entity1),
                            status: getEntityStatus(entity1, entity2, entity2),
                        },
                        entity2: {
                            ...cloneDeep(entity2),
                            status: getEntityStatus(entity2, entity1, entity2),
                        },
                        final: {
                            ...cloneDeep(entity2),
                            status: getEntityStatus(entity2, entity1, entity2),
                        },
                    };
                    const rowIndex = state.findIndex(
                        row => row.field === field,
                    );

                    return (
                        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                        <div
                            onClick={() => {
                                if (entity2.status !== 'identical') {
                                    setState({
                                        index: rowIndex,
                                        value: newRowValues,
                                    });
                                    setQuery({ [field.field]: entity2.id });
                                }
                            }}
                            className={classNames(
                                entity2.status,
                                classes[entity2.status],
                            )}
                        >
                            {convertValueIfDate(
                                settings.row.original.entity2.value,
                            )}
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
                    return (
                        // the class should apply to the td as empty sring has no width
                        <div
                            className={classNames(
                                final.status,
                                classes[final.status],
                            )}
                        >
                            {convertValueIfDate(final.value)}
                        </div>
                    );
                },
            },
        ];
    }, [classes, formatMessage, setQuery, setState, state]);
};
