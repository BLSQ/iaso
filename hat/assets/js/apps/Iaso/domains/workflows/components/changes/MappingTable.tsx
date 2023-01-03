import React, { FunctionComponent, useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    Table,
} from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';

import { Change, Mapping } from '../../types';
import { Column } from '../../../../types/table';
import { IntlFormatMessage } from '../../../../types/intl';

import MESSAGES from '../../messages';

type Props = {
    change?: Change;
};
const useStyles = makeStyles(theme => ({
    tableContainer: {
        maxHeight: '70vh',
        overflow: 'auto',
        // @ts-ignore
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        // @ts-ignore
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
    },
}));
export const MappingTable: FunctionComponent<Props> = ({ change }) => {
    const classes = useStyles();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const mappings: Mapping[] = useMemo(
        () =>
            change
                ? Object.entries(change.mapping).map(([key, value]) => ({
                      source: key,
                      target: value,
                  }))
                : [],
        [change],
    );
    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.target),
            sortable: false,
            accessor: 'target',
        },
        {
            Header: formatMessage(MESSAGES.source),
            sortable: false,
            accessor: 'source',
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'id',
            sortable: false,
            resizable: false,
            Cell: settings => {
                return <>EDIT DELETE</>;
            },
        },
    ];
    return (
        <Box className={classes.tableContainer}>
            <Table
                data={mappings}
                showPagination={false}
                defaultSorted={[{ id: 'name', desc: false }]}
                marginBottom={false}
                marginTop={false}
                columns={columns}
                countOnTop={false}
                count={mappings?.length ?? 0}
            />
        </Box>
    );
};
