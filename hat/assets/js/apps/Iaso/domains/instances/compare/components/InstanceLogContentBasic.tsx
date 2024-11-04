import React, { FunctionComponent } from 'react';
import {
    Table,
    TableCell,
    TableRow,
    TableHead,
    Typography,
} from '@mui/material';
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
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}  !important`,
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
                    <TableCell
                        width="25.35%"
                        align="left"
                        className={classes.tableCellHead}
                    >
                        {formatMessage(MESSAGES.label)}
                    </TableCell>
                    <TableCell
                        width="37.35%"
                        align="left"
                        className={classes.tableCellHead}
                    >
                        <Typography
                            color={
                                fileContent?.logA?.deleted ? 'error' : 'inherit'
                            }
                        >
                            {formatMessage(MESSAGES.instanceLogsVersionA)}
                        </Typography>
                    </TableCell>
                    <TableCell
                        width="37.35%"
                        align="left"
                        className={classes.tableCellHead}
                    >
                        <Typography
                            color={
                                fileContent?.logB?.deleted ? 'error' : undefined
                            }
                        >
                            {formatMessage(MESSAGES.instanceLogsVersionB)}
                        </Typography>
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
