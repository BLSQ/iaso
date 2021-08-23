import React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import { useSafeIntl } from 'bluesquare-components';

import { MESSAGES } from '../messages';

const useStyles = makeStyles(theme => ({
    select: {
        height: 40,
        marginLeft: theme.spacing(10),
    },
}));
const PageRowSelect = ({
    rowsPerPage,
    rowsPerPageOptions,
    onRowPerPageChange,
}) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const { formatMessage } = intl;
    const handleChange = event => {
        onRowPerPageChange(event.target.value);
    };
    return (
        <Box
            display="inline-flex"
            justifyContent="center"
            alignItems="center"
            mr={8}
        >
            <FormControl variant="outlined">
                <Select
                    className={classes.select}
                    value={rowsPerPage}
                    onChange={handleChange}
                >
                    {rowsPerPageOptions.map(o => (
                        <MenuItem key={o} value={o}>
                            {`${o} ${formatMessage(MESSAGES.rowsText)}`}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

PageRowSelect.propTypes = {
    rowsPerPage: PropTypes.number.isRequired,
    rowsPerPageOptions: PropTypes.array.isRequired,
    onRowPerPageChange: PropTypes.func.isRequired,
};

export { PageRowSelect };
