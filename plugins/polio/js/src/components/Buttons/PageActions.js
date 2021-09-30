import React from 'react';
import { Grid } from '@material-ui/core';
import { useStyles } from '../../styles/theme';
import { SearchInput } from '../Inputs/SearchInput';

export const PageActions = ({ onSearch, children }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={4}
            justifyContent="flex-end"
            alignItems="center"
        >
            {onSearch && (
                <Grid item xs={8}>
                    <SearchInput onChange={onSearch} />
                </Grid>
            )}
            <Grid
                item
                xs={4}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                {children}
            </Grid>
        </Grid>
    );
};
