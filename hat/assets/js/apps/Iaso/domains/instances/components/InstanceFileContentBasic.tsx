import React, { FunctionComponent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import MESSAGES from '../messages';

type Props = {
    fileContent: Record<string, any>;
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

const InstanceFileContentBasic: FunctionComponent<Props> = ({
    fileContent,
}) => {
    const classes = useStyles();

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell width={150} className={classes.tableCellHead}>
                        <FormattedMessage {...MESSAGES.field} />
                    </TableCell>
                    <TableCell
                        width={150}
                        align="right"
                        className={classes.tableCellHead}
                    >
                        <FormattedMessage {...MESSAGES.key} />
                    </TableCell>
                    <TableCell
                        width={250}
                        align="right"
                        className={classes.tableCellHead}
                    >
                        <FormattedMessage {...MESSAGES.value} />
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.keys(fileContent).map(k => {
                    if (k !== 'meta' && k !== 'uuid') {
                        return (
                            <TableRow key={k}>
                                {/* TO-DO: get field label from API */}
                                <TableCell className={classes.tableCell}>
                                    {k}
                                </TableCell>
                                <TableCell
                                    className={classes.tableCell}
                                    align="right"
                                >
                                    {k}
                                </TableCell>
                                <TableCell
                                    className={classes.tableCell}
                                    align="right"
                                >
                                    {fileContent[k] || textPlaceholder}
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

export default InstanceFileContentBasic;
