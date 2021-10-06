import React from 'react';
import SearchIcon from '@material-ui/icons/Search';
import {
    FormControl,
    InputAdornment,
    InputLabel,
    OutlinedInput,
} from '@material-ui/core';
import { useStyles } from '../../styles/theme';

export const SearchInput = ({ onChange }) => {
    const classes = useStyles();

    return (
        <FormControl fullWidth className={classes.margin} variant="outlined">
            <InputLabel
                htmlFor="search-campaigns"
                style={{ backgroundColor: 'white' }}
            >
                Search
            </InputLabel>
            <OutlinedInput
                id="search-campaigns"
                key="search-campaigns-key"
                startAdornment={
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                }
                onChange={onChange}
            />
        </FormControl>
    );
};
