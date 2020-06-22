import React from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { textPlaceholder } from '../../../constants/uiConstants';

const useStyle = makeStyles(theme => ({
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
        minWidth: '200px',
    },
    tableCellLabel: {
        width: '100%',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
    },
}));

export default function InstanceFileContentRich({
    instanceData,
    formDescriptor,
}) {
    return (
        <Table>
            <TableBody>
                {formDescriptor.children.map(childDescriptor => (
                    <FormChild key={childDescriptor.name} descriptor={childDescriptor} data={instanceData} />
                ))}
            </TableBody>
        </Table>
    );
}

InstanceFileContentRich.propTypes = {
    instanceData: PropTypes.object.isRequired,
    formDescriptor: PropTypes.object.isRequired,
};

function FormChild({ descriptor, data }) {
    switch (descriptor.type) {
        case 'group':
            return <FormGroup descriptor={descriptor} data={data} />;
        default:
            return <FormField descriptor={descriptor} data={data} />;
    }
}
FormChild.propTypes = {
    descriptor: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

function FormGroup({ descriptor, data }) {
    const classes = useStyle();

    return (
        <>
            <TableRow>
                <TableCell colSpan={3} align="center" className={classes.tableCellHead}>
                    <Label descriptor={descriptor} />
                </TableCell>
            </TableRow>
            {
                descriptor.children.map(childDescriptor => (
                    <FormChild
                        key={childDescriptor.name}
                        descriptor={childDescriptor}
                        data={data}
                    />
                ))
            }
        </>
    );
}
FormGroup.propTypes = {
    descriptor: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

function FormField({ descriptor, data }) {
    const classes = useStyle();
    const value = descriptor.name in data ? data[descriptor.name] : textPlaceholder;

    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <Label descriptor={descriptor} />
            </TableCell>
            <TableCell className={classes.tableCell} align="right">{value}</TableCell>
        </TableRow>
    );
}
FormField.propTypes = {
    descriptor: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

function Label({ descriptor }) {
    const classes = useStyle();

    let labelText;
    if ('label' in descriptor) {
        labelText = descriptor.label;
    } else {
        labelText = descriptor.name;
    }

    return <div className={classes.tableCellLabel}>{labelText}</div>;
}
Label.propTypes = {
    descriptor: PropTypes.object.isRequired,
};
