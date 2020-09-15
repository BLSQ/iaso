import React from 'react';

import { withStyles, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';

import mapPopupStyles from '../../../styles/mapPopup';
import { textPlaceholder } from '../../../constants/uiConstants';

const styles = theme => ({
    ...mapPopupStyles(theme),
});

const PopupItemComponent = props => {
    const { label, value, classes } = props;
    return (
        <Grid container spacing={0}>
            <Grid item xs={4} className={classes.popupListItemLabel}>
                {label}:
            </Grid>
            <Grid item xs={8} className={classes.popuplistItem}>
                {value || textPlaceholder}
            </Grid>
        </Grid>
    );
};
PopupItemComponent.defaultProps = {
    value: null,
};

PopupItemComponent.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PopupItemComponent);
