import React from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import { makeStyles } from '@material-ui/core/styles';
import { FormControl, FormLabel } from '@material-ui/core';

import 'react-quill/dist/quill.snow.css';

const useStyles = makeStyles(theme => ({
    formControl: {
        width: '100%',
    },
    root: {
        width: '100%',
        marginTop: theme.spacing(1),
        '& .quill': {
            minHeight: 300,
        },
        '& .quill .ql-container': {
            minHeight: 300,
        },
        '& .quill .ql-tooltip': {
            // transform: 'translateX(120px)',
        },
        '& .quill .ql-container p': {
            maxWidth: '100vw',
        },
    },
    label: {
        fontSize: 12,
    },
}));
const Rte = ({ label, field, form } = {}) => {
    const value = field.value || '';
    const classes = useStyles();
    return (
        <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel className={classes.label} component="legend">
                {label}
            </FormLabel>
            <div className={classes.root}>
                <ReactQuill
                    modules={{
                        toolbar: {
                            container: [
                                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                [
                                    { align: '' },
                                    { align: 'center' },
                                    { align: 'right' },
                                    { align: 'justify' },
                                ],
                                ['link', 'image'],
                                [{ color: [] }],
                                ['clean'],
                            ],
                        },
                    }}
                    value={value}
                    onChange={data => form.setFieldValue(field.name, data)}
                />
            </div>
        </FormControl>
    );
};

Rte.defaultProps = {
    field: {},
    form: {},
    label: '',
};

Rte.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    label: PropTypes.string,
};

export default Rte;
