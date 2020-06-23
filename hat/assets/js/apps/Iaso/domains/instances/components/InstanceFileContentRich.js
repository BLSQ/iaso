import React from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import FunctionsIcon from '@material-ui/icons/Functions';
import CommentIcon from '@material-ui/icons/Comment';
import isPlainObject from 'lodash/isPlainObject';

import { textPlaceholder } from '../../../constants/uiConstants';

const useStyle = makeStyles(theme => ({
    tableCellHead: {
        fontWeight: 'bold',
        backgroundColor: theme.palette.gray,
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
    tableCellLabelWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tableCellLabel: {
        display: 'inline-block',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        marginLeft: 5,
    },
}));

/**
 * Translate the provided label if it is translatable
 *
 * @param label
 * @returns {*}
 */
function translateLabel(label) {
    // TODO: pick current locale - not trivial since keys could be "FR", "French", "En français"...
    if (isPlainObject(label)) {
        return label[Object.keys(label)[0]];
    }

    return label;
}

/**
 * Extract the value from data using the descriptor
 * (handles the different scenarios, such as select fields)
 *
 * @param descriptor
 * @param data
 * @returns {string|*}
 */
function getDisplayedValue(descriptor, data) {
    const value = data[descriptor.name];
    if (value === undefined) {
        return textPlaceholder;
    }

    if (descriptor.type === 'select one') {
        const choice = descriptor.children.find(c => c.name === value);
        return choice !== undefined ? translateLabel(choice.label) : textPlaceholder;
    }

    return value !== '' ? value : textPlaceholder;
}

export default function InstanceFileContentRich({
    instanceData,
    formDescriptor,
}) {
    return (
        <Table>
            <TableBody>
                {formDescriptor.children.filter(c => c.name !== 'meta').map(childDescriptor => (
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
        case 'start':
        case 'end':
        case 'today':
        case 'deviceid':
        case 'subscriberid':
        case 'simserial':
        case 'phonenumber':
            return <FormMetaField descriptor={descriptor} data={data} />;
        case 'note':
            return <FormNoteField descriptor={descriptor} />;
        case 'calculate':
            return <FormField descriptor={descriptor} data={data} icon={<FunctionsIcon color="disabled" />} />;
        default:
            console.log(descriptor.type, descriptor, data);
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
                <TableCell colSpan={2} align="center" className={classes.tableCellHead}>
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

function FormField({ descriptor, data, icon }) {
    const classes = useStyle();

    return (
        <TableRow>
            <TableCell className={classes.tableCell}>
                <div className={classes.tableCellLabelWrapper}>
                    {icon !== null && icon}
                    <Label descriptor={descriptor} />
                </div>
            </TableCell>
            <TableCell className={classes.tableCell} align="right">
                {getDisplayedValue(descriptor, data)}
            </TableCell>
        </TableRow>
    );
}
FormField.defaultProps = {
    icon: null,
};
FormField.propTypes = {
    descriptor: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    icon: PropTypes.element,
};

function FormMetaField({ descriptor, data }) {
    const classes = useStyle();

    return (
        <TableRow>
            <TableCell className={classes.tableCell} colSpan={2}>
                <Label descriptor={descriptor} value={getDisplayedValue(descriptor, data)} />
            </TableCell>
        </TableRow>
    );
}
FormMetaField.propTypes = {
    descriptor: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

function FormNoteField({ descriptor }) {
    const classes = useStyle();

    return (
        <TableRow>
            <TableCell className={classes.tableCell} colSpan={2}>
                <div className={classes.tableCellLabelWrapper}>
                    <CommentIcon color="disabled" />
                    <Label descriptor={descriptor} />
                </div>
            </TableCell>
        </TableRow>
    );
}
FormNoteField.propTypes = {
    descriptor: PropTypes.object.isRequired,
};

function Label({ descriptor, value }) {
    const classes = useStyle();

    let label;
    if ('label' in descriptor) {
        label = translateLabel(descriptor.label);

        if (value !== null) { // useful for meta questions, whose labels are like "subscriberid ${subscriberid}"
            label = label.replace(`\${${descriptor.name}}`, value);
        }
    } else {
        label = descriptor.name;
    }

    return <div className={classes.tableCellLabel}>{label}</div>;
}
Label.defaultProps = {
    value: null,
};
Label.propTypes = {
    descriptor: PropTypes.object.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
