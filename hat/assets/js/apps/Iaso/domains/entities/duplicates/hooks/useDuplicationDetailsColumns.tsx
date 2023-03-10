import React, { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import classNames from 'classnames';
import MESSAGES from '../messages';
import { formatLabel } from '../../../instances/utils';
import { convertValueIfDate } from '../../../../components/Cells/DateTimeCell';
import { Column } from '../../../../types/table';
import { DuplicateEntityForTable } from '../types';
import { ArrayUpdate, FullArrayUpdate } from '../../../../hooks/useArrayState';
import { useEntityCell } from './useEntityCell';

const useStyles = makeStyles({
    dropped: { color: 'rgba(0,0,0,0.6)' },
    selected: { fontWeight: 'bold' },
    hidden: { display: 'none' },
});

type UseDupliactionDetailsColumnsArgs = {
    state: DuplicateEntityForTable[];
    setState: (
        // eslint-disable-next-line no-unused-vars
        value:
            | ArrayUpdate<DuplicateEntityForTable>
            | FullArrayUpdate<DuplicateEntityForTable>,
    ) => void;
    setQuery: React.Dispatch<any>;
    onlyShowUnmatched: boolean;
};

export const useDuplicationDetailsColumns = ({
    state,
    setState,
    setQuery,
    onlyShowUnmatched,
}: UseDupliactionDetailsColumnsArgs): Column[] => {
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
                        setState,
                    });
                    // TODO remove when getCellProps works
                    const hidden =
                        entity1.status === 'identical' && onlyShowUnmatched
                            ? classes.hidden
                            : '';
                    return (
                        <Box
                            onClick={onClick}
                            className={classNames(
                                entity1.status,
                                classes[entity1.status],
                                hidden,
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
                    const onClick = useEntityCell({
                        field,
                        entity1,
                        entity2,
                        key: 'entity2',
                        setQuery,
                        state,
                        setState,
                    });

                    return (
                        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                        <div
                            onClick={onClick}
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
    }, [classes, formatMessage, onlyShowUnmatched, setQuery, setState, state]);
};
