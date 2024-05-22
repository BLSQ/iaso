/* eslint-disable react/require-default-props */
import React, { FunctionComponent, ReactElement } from 'react';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ExcellSvg from '../svg/ExcellSvgComponent';

type Props = {
    xlsxUrl: string;
    variant?: 'contained' | 'outlined' | 'text';
    children?: ReactElement;
    disabled?: boolean;
};

const styles = theme => ({
    button: {
        marginLeft: theme.spacing(2),
        '& svg, & i': {
            marginRight: theme.spacing(1),
        },
    },
    icon: {
        height: theme.spacing(3),
        width: 'auto',
        marginRight: theme.spacing(1),
    },
});

const useStyles = makeStyles(styles);

export const XlsxButton: FunctionComponent<Props> = ({
    xlsxUrl,
    children,
    disabled = false,
    variant = 'contained',
}) => {
    const classes = useStyles();
    return (
        <Button
            data-test="xlsx-export-button"
            variant={variant}
            disabled={disabled}
            className={classes.button}
            color="primary"
            href={xlsxUrl}
        >
            <ExcellSvg className={classes.icon} />
            {children ?? 'XLSX'}
        </Button>
    );
};
