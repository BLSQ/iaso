import React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';

import { MESSAGES } from './messages';

const useStyles = makeStyles(() => ({
    input: {
        width: 60,
    },
}));
const PageSelect = ({ pageIndex, pages, onPageChange }) => {
    const classes = useStyles();
    return (
        <Box
            display="inline-flex"
            justifyContent="center"
            alignItems="center"
            ml={8}
        >
            <Box display="inline-block" mr={1}>
                <FormattedMessage {...MESSAGES.pageText} />
            </Box>

            <TextField
                className={classes.input}
                size="small"
                label=""
                type="number"
                value={pageIndex}
                variant="outlined"
                onChange={e => onPageChange(e.currentTarget.value)}
            />
            <Box display="inline-block" ml={1}>
                <FormattedMessage {...MESSAGES.ofText} />
            </Box>

            <Box display="inline-block" ml={1}>
                {pages}
            </Box>
        </Box>
    );
};

PageSelect.defaultProps = {
    pages: 0,
    pageIndex: 0,
};

PageSelect.propTypes = {
    pages: PropTypes.number,
    pageIndex: PropTypes.number,
    onPageChange: PropTypes.func.isRequired,
};

export { PageSelect };
