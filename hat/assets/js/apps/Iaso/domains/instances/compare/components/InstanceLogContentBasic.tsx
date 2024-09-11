import React, { FunctionComponent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
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
    tableCellLabelName: {
        color: theme.palette.mediumGray.main,
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
            <TableBody>
                {fileContent.logA &&
                    fileContent.logB &&
                    fileContent?.fields.map(question => {
                        const field = fileDescriptor?.children.find(
                            child => child.name === question.name,
                        );

                        if (
                            question.name !== 'meta' &&
                            question.name !== 'instanceID' &&
                            (fileContent.logA.json[question.name] ||
                                fileContent.logB.json[question.name])
                        ) {
                            return (
                                <TableRow
                                    key={question.name}
                                    style={{
                                        backgroundColor:
                                            fileContent.logA.json[
                                                question.name
                                            ] !==
                                            fileContent.logB.json[question.name]
                                                ? 'yellow'
                                                : undefined,
                                    }}
                                >
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        <div>
                                            {fileDescriptor?.children && field
                                                ? formatLabel(field)
                                                : question.name}
                                        </div>
                                        <div
                                            className={
                                                classes.tableCellLabelName
                                            }
                                        >
                                            {question.name}
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {/* TO DO : display section titles for groups */}
                                        {fileContent?.logA.json[question.name]}
                                    </TableCell>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {fileContent?.logB.json[question.name]}
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
