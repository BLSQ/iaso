import React, { FunctionComponent } from 'react';
import {
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { IntlFormatMessage } from '../../../../types/intl';
import MESSAGES from '../messages';

type Props = {
    fileContent: Record<any, any>;
};

const styles = theme => ({
    tableCellHead: {
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
    tableCell: {
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
});

const useStyles = makeStyles(styles);

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
                        width={150}
                        align="left"
                        className={classes.tableCellHead}
                    >
                        {formatMessage(MESSAGES.label)}
                    </TableCell>
                    <TableCell
                        width={150}
                        align="left"
                        className={classes.tableCellHead}
                    >
                        {formatMessage(MESSAGES.instanceLogsVersionA)}
                    </TableCell>
                    <TableCell
                        width={150}
                        align="left"
                        className={classes.tableCellHead}
                    >
                        {formatMessage(MESSAGES.instanceLogsVersionB)}
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {fileContent.logA &&
                    fileContent.logB &&
                    Object.keys(fileContent.logA.json).map(labelKey => {
                        if (labelKey !== 'meta' && labelKey !== 'uuid') {
                            return (
                                <TableRow key={labelKey}>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
                                        {labelKey}
                                    </TableCell>
                                    <TableCell
                                        className={classes.tableCell}
                                        align="left"
                                    >
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
