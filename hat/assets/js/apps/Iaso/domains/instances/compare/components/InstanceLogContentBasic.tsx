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

import classNames from 'classnames';
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
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <Table>
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
                                fileContent?.logA?.deleted ? 'error' : 'inherit'
                            }
                        >
                            {formatMessage(MESSAGES.instanceLogsVersionA)}
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
                />
        </Table>
    );
};
