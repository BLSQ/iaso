import React from 'react';

import { Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes, { number } from 'prop-types';

import { textPlaceholder, mapPopupStyles } from 'bluesquare-components';

const styles = theme => ({
    ...mapPopupStyles(theme),
});

const PopupItemComponent = props => {
    const { label, value, classes, labelSize = 4, valueSize = 8 } = props;
    return (
        <Grid container spacing={0}>
            <Grid item xs={labelSize} className={classes.popupListItemLabel}>
                {label}:
            </Grid>
            <Grid item xs={valueSize} className={classes.popuplistItem}>
                {value || textPlaceholder}
            </Grid>
        </Grid>
    );
};
PopupItemComponent.defaultProps = {
    value: null,
    labelSize: 4,
    valueSize: 8,
};

PopupItemComponent.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    classes: PropTypes.object.isRequired,
    labelSize: number,
    valueSize: number,
};

export default withStyles(styles)(PopupItemComponent);
