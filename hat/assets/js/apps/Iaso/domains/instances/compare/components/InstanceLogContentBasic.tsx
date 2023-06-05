import React, { FunctionComponent } from 'react';
import {
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
} from '@material-ui/core';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';

import { formatLabel } from '../../utils';
import { FileContent } from '../../types/instance';
import MESSAGES from '../messages';

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
    tableCell: {
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
                    <TableCell
                        width={80}
                        align="left"
                        className={classes.tableCellHead}
                    >
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
            <TableBody>
                {fileContent.logA &&
                    fileContent.logB &&
                    Object.keys(fileContent.logA.json).map(labelKey => {
                        const field = fileDescriptor?.children.find(
                            child => child.name === labelKey,
                        );

                        if (
                            labelKey !== 'meta' &&
                            labelKey !== 'uuid' &&
                            (fileContent.logA.json[labelKey] ||
                                fileContent.logB.json[labelKey])
                        ) {
                            return (
                                <TableRow key={labelKey}>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {fileDescriptor?.children && field
                                            ? formatLabel(field)
                                            : labelKey}
                                    </TableCell>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {/* TO DO : display section titles for groups */}
                                        {fileContent?.logA.json[labelKey]}
                                    </TableCell>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {fileContent?.logB.json[labelKey]}
                                    </TableCell>
                                </TableRow>
                            );
                        }
                        return null;
                    })}
            </TableBody>
        </Table>
    );
};
