import React, { FunctionComponent, ReactNode } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
// @ts-ignore
import { FormControl } from 'bluesquare-components';
import { Paper, InputLabel, Box } from '@material-ui/core';

const childrenStyle = theme => ({
    // replicated from .MuiTypography-body1 (except font-family and letter spacing)
    textStyle: {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1,
        paddingTop: 0.5,
        paddingBottom: 0.5,
        flex: '1',
        marginLeft: theme.spacing(1.5),
    },
});

export const useCustomInputTextStyle = makeStyles(childrenStyle);

const styles = theme => ({
    placeholder: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '14px',
        cursor: 'default',
        color: 'transparent',
        paddingTop: 0.5,
        paddingBottom: 0.5,
    },
    treeviews: {
        alignItems: 'center',
        fontSize: '16px',
        flex: '1',
        marginLeft: '10px',
    },
    paper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.23)', // aligning with AutoSelect
    },
    paperWithIcon: {
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: theme.spacing(2),
    },
    inputLabel: {
        backgroundColor: 'white',
        color: theme.palette.mediumGray.main,
    },
    shrinkInputLabel: {
        fontSize: '20px',
    },
    enabled: {
        '&:hover': {
            border: '1px solid rgba(0,0,0,0.87)', // aligning with AutoSelect
        },
    },
    pointer: { cursor: 'pointer' },
    clearButton: {
        marginRight: 5,
    },
    error: {
        '&:hover': { border: `1px solid ${theme.palette.error.main}` },
        border: `1px solid ${theme.palette.error.main}`,
    },
    errorLabel: {
        color: theme.palette.error.main,
    },
});

const useStyles = makeStyles(styles);
const noOp = () => null;

const PlaceHolderText: FunctionComponent<{
    text: string;
    disabled?: boolean;
}> = ({ text, disabled = false }) => {
    const classes = useStyles();
    const placeholderStyle = disabled
        ? classes.placeholder
        : `${classes.placeholder} ${classes.pointer}`;
    return <Box className={placeholderStyle}>{text}</Box>;
};

type Props = {
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
    errors?: string[];
    children?: ReactNode;
    onClick?: () => void;
    icon?: ReactNode;
};

export const CustomInput: FunctionComponent<Props> = ({
    placeholder,
    disabled = false,
    required = false,
    errors = [],
    children,
    onClick = noOp,
    icon,
}) => {
    const classes = useStyles();
    const hasError = errors.length > 0;

    const errorStyle = hasError && !disabled ? classes.error : '';
    const errorLabelStyle = hasError && !disabled ? classes.errorLabel : '';
    const enabledStyle = disabled ? '' : classes.enabled;
    const additionalPaperStyle = icon
        ? classes.paperWithIcon
        : 'MuiOutlinedInput-multiline';

    return (
        <FormControl errors={errors}>
            <InputLabel
                shrink={Boolean(children)}
                required={required}
                className={`${classnames(
                    classes.inputLabel,
                    Boolean(children) && classes.shrinkInputLabel,
                    'input-label',
                )} ${errorLabelStyle}`}
            >
                {placeholder}
            </InputLabel>
            <Paper
                variant="outlined"
                elevation={0}
                className={classnames(
                    classes.paper,
                    enabledStyle,
                    errorStyle,
                    additionalPaperStyle,
                )}
                onClick={disabled ? noOp : onClick}
            >
                {!children && (
                    <PlaceHolderText text={placeholder} disabled={disabled} />
                )}
                {children}
                {icon}
            </Paper>
        </FormControl>
    );
};
