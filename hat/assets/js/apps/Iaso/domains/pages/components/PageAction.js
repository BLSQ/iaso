import React from 'react';
import PropTypes from 'prop-types';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import { Button } from '@mui/material';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const PageAction = ({ icon: Icon, onClick, children }) => {
    const classes = useStyles();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            className={classes.pageAction}
        >
            <Icon className={classes.buttonIcon} />
            {children}
        </Button>
    );
};

PageAction.defaultProps = {
    children: <></>,
    onClick: () => null,
};

PageAction.propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
    icon: PropTypes.any.isRequired,
};

export default PageAction;
