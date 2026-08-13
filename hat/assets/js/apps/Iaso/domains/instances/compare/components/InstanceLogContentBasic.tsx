import React, { FunctionComponent } from 'react';
import {
    Box,
    Table,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    IntlFormatMessage,
    IntlMessage,
} from 'bluesquare-components';
import classNames from 'classnames';
import { getStickyTableHeadStyles } from 'Iaso/styles/utils';

import { FileContent } from '../../types/instance';
import MESSAGES from '../messages';
import InstanceLogContentBodyTable from './InstanceLogContentBodyTable';

type Props = {
    fileContent: FileContent;
    headerA?: IntlMessage;
    headerB?: IntlMessage;
    tableMaxHeight?: string;
};

export const DEFAULT_TABLE_MAX_HEIGHT = 'calc(100vh - 200px)';

const useStyles = makeStyles(theme => ({
    tableCellHead: {
        fontWeight: 'bold',
        backgroundColor: theme.palette.background.paper,
        borderTop: 'none !important',
        borderLeft: 'none !important',
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.lightGray.border}  !important`,
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.lightGray.border}  !important`,
    },
    labelTableCellFixWith: {
        width: '25.35%',
        maxWidth: '25.35%',
        minWidth: '25.35%',
    },
    versionValueTableCellFix: {
        width: '37.35%',
        maxWidth: '37.35%',
        minWidth: '37.35%',
    },
}));

export const InstanceLogContentBasic: FunctionComponent<Props> = ({
    fileContent,
    headerA = MESSAGES.instanceLogsVersionA,
    headerB = MESSAGES.instanceLogsVersionB,
    tableMaxHeight = DEFAULT_TABLE_MAX_HEIGHT,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <Box sx={getStickyTableHeadStyles(tableMaxHeight)}>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                align="left"
                                className={classNames(
                                    classes.tableCellHead,
                                    classes.labelTableCellFixWith,
                                )}
                            >
                                {formatMessage(MESSAGES.label)}
                            </TableCell>
                            <TableCell
                                align="left"
                                className={classNames(
                                    classes.tableCellHead,
                                    classes.versionValueTableCellFix,
                                )}
                            >
                                <Typography
                                    color={
                                        fileContent?.logA?.deleted
                                            ? 'error'
                                            : 'inherit'
                                    }
                                >
                                    {formatMessage(headerA)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                align="left"
                                className={classNames(
                                    classes.tableCellHead,
                                    classes.versionValueTableCellFix,
                                )}
                            >
                                <Typography
                                    color={
                                        fileContent?.logB?.deleted
                                            ? 'error'
                                            : undefined
                                    }
                                >
                                    {formatMessage(headerB)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <InstanceLogContentBodyTable fileContent={fileContent} />
                </Table>
            </TableContainer>
        </Box>
    );
};
