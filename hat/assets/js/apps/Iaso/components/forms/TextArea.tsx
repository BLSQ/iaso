import React, { FunctionComponent, useState } from 'react';

import {
    // @ts-ignore
    FormControl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';
import classnames from 'classnames';
import { makeStyles, InputLabel } from '@material-ui/core';

type Props = {
    value?: string;
    label: string;
    // eslint-disable-next-line no-unused-vars
    onChange: (newValue: string) => void;
    errors?: string[];
    required?: boolean;
};

const useStyles = makeStyles(theme => ({
    inputLabelFocus: {
        color: theme.palette.primary.main,
    },
    inputLabel: {
        ...commonStyles.inputLabel,
        left: 4,
        backgroundColor: 'white',
    },
    inputLabelShrink: {
        transform: 'translate(14px, -5px) scale(0.75) !important',
    },
    textArea: {
        width: '100%',
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100px',
        padding: theme.spacing(2),
        outline: 'none',
        borderRadius: 5,
        fontSize: 16,
        fontFamily: '"Roboto", "Arial", sans-serif',
        // @ts-ignore
        border: `1px solid rgba(0, 0, 0, 0.23)`,
        '&:hover': {
            border: `1px solid rgba(0, 0, 0, 0.87)`,
        },
        '&:focus': {
            border: `1px solid ${theme.palette.primary.main}`,
        },
    },
    errorArea: {
        border: `1px solid ${theme.palette.error.main}`,
        '&:focus': {
            border: `1px solid ${theme.palette.error.main}`,
        },
        '&:hover': {
            border: `1px solid ${theme.palette.error.main}`,
        },
    },
    errorText: { color: theme.palette.error.main },
}));

export const TextArea: FunctionComponent<Props> = ({
    value,
    onChange,
    label,
    errors = [],
    required = false,
}) => {
    const classes: Record<string, string> = useStyles();
    const [focus, setFocus] = useState<boolean>(false);
    const hasErrors = errors.length > 0;

    return (
        <FormControl errors={errors}>
            <InputLabel
                shrink={Boolean(value)}
                className={classnames(
                    classes.inputLabel,
                    focus && classes.inputLabelFocus,
                    Boolean(value) && classes.inputLabelShrink,
                    hasErrors && classes.errorText,
                )}
                required={required}
            >
                {label}
            </InputLabel>
            <textarea
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                className={classnames(
                    classes.textArea,
                    hasErrors && classes.errorArea,
                )}
                onChange={e => onChange(e.target.value)}
                value={value}
            />
        </FormControl>
    );
};
