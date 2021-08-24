import React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';

import { MESSAGES } from './messages';

const useStyles = makeStyles(theme => ({
    box: {
        width: '100%',
        height: theme.spacing(10),
        backgroundColor: theme.palette.gray.background,
    },
}));
const NoResult = ({ data }) => {
    const classes = useStyles();
    if (data && data.length === 0) {
        return (
            <Box
                className={classes.box}
                alignItems="center"
                justifyContent="center"
                display="flex"
            >
                <FormattedMessage {...MESSAGES.noDataText} />
            </Box>
        );
    }
    return null;
};
NoResult.defaultProps = {
    data: [],
};

NoResult.propTypes = {
    data: PropTypes.array,
};

export { NoResult };
