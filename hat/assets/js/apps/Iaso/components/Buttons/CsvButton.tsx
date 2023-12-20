/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
// @ts-ignore
import { CsvSvg } from 'bluesquare-components';

type Props = {
    csvUrl: string;
    variant?: 'contained' | 'outlined' | 'text';
};

const styles = theme => ({
    button: {
        marginLeft: theme.spacing(2),
        '& svg, & i': {
            marginRight: theme.spacing(1),
        },
    },
});

const useStyles = makeStyles(styles);

export const CsvButton: FunctionComponent<Props> = ({
    csvUrl,
    variant = 'contained',
}) => {
    const classes = useStyles();
    return (
        <Button
            data-test="csv-export-button"
            variant={variant}
            className={classes.button}
            color="primary"
            href={csvUrl}
        >
            <CsvSvg />
            CSV
        </Button>
    );
};
