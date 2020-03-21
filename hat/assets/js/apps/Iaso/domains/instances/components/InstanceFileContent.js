import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { textPlaceholder } from '../../../constants/uiConstants';

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

const InstanceFileContent = ({
    classes,
    fileContent,
}) => (
    <Table>
        <TableHead>
            <TableRow>
                <TableCell width={150} className={classes.tableCellHead}>
                    <FormattedMessage id="iaso.label.field" defaultMessage="Field" />
                </TableCell>
                <TableCell width={150} align="right" className={classes.tableCellHead}>
                    <FormattedMessage id="iaso.label.key" defaultMessage="Key" />
                </TableCell>
                <TableCell width={250} align="right" className={classes.tableCellHead}>
                    <FormattedMessage id="iaso.label.value" defaultMessage="Value" />
                </TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {
                Object.keys(fileContent).map((k) => {
                    if (k !== 'meta' && k !== 'uuid') {
                        return (
                            <TableRow key={k}>
                                {/* TO-DO: get field label from API */}
                                <TableCell className={classes.tableCell}>{k}</TableCell>
                                <TableCell className={classes.tableCell} align="right">{k}</TableCell>
                                <TableCell className={classes.tableCell} align="right">{fileContent[k] || textPlaceholder}</TableCell>
                            </TableRow>
                        );
                    }
                    return null;
                })
            }
        </TableBody>
    </Table>
);

InstanceFileContent.propTypes = {
    classes: PropTypes.object.isRequired,
    fileContent: PropTypes.object.isRequired,
};


export default withStyles(styles)(InstanceFileContent);
