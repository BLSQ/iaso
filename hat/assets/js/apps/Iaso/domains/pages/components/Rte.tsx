import React, { FunctionComponent, useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import { makeStyles } from '@mui/styles';
import { FormControl, FormLabel } from '@mui/material';
import isEqual from 'lodash/isEqual';
import 'quill/dist/quill.snow.css';

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

type Props = {
    field?: { name: string; value?: string } & Record<string, any>;
    form?: {
        setFieldValue: (value: string, innerHtml: string) => void;
    } & Record<string, any>;
    label?: string;
};
const Rte: FunctionComponent<Props> = ({
    label,
    field = { name: '', value: undefined },
    form = { setFieldValue: (value: string, innerHtml: string) => {} },
} = {}) => {
    const value = field.value || '';
    const classes = useStyles();

    const theme = 'snow';
    const modules = {
        toolbar: [
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
    };

    const { quill, quillRef } = useQuill({
        theme,
        modules,
    });
    useEffect(() => {
        if (quill && !isEqual(value, quill.root.innerHTML)) {
            quill.clipboard.dangerouslyPasteHTML(value);
        }
    }, [quill, value]);

    useEffect(() => {
        if (quill) {
            quill.on('text-change', () => {
                form.setFieldValue(field.name, quill.root.innerHTML);
            });
        }
    }, [quill]);

    return (
        <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel className={classes.label} component="legend">
                {label}
            </FormLabel>
            <div className={classes.root}>
                <div ref={quillRef} />
            </div>
        </FormControl>
    );
};

export default Rte;
