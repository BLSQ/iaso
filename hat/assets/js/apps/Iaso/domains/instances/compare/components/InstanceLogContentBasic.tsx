import React, { FunctionComponent } from 'react';
import { Table, TableCell, TableRow, TableHead } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';

import { FileContent } from '../../types/instance';
import MESSAGES from '../messages';
import InstanceLogContentBodyTable from './InstanceLogContentBodyTable';

type Props = {
    fileContent: FileContent;
    fileDescriptor?: Record<string, any>;
};

const useStyles = makeStyles(theme => ({
    tableCellHead: {
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
}));

export const InstanceLogContentBasic: FunctionComponent<Props> = ({
    fileContent,
    fileDescriptor,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell align="left" className={classes.tableCellHead}>
                        {formatMessage(MESSAGES.label)}
                    </TableCell>
                    <TableCell align="left" className={classes.tableCellHead}>
                        {formatMessage(MESSAGES.instanceLogsVersionA)}
                    </TableCell>
                    <TableCell align="left" className={classes.tableCellHead}>
                        {formatMessage(MESSAGES.instanceLogsVersionB)}
                    </TableCell>
                </TableRow>
            </TableHead>
            <InstanceLogContentBodyTable
                fileContent={fileContent}
                fileDescriptor={fileDescriptor}
            />
        </Table>
    );
};
