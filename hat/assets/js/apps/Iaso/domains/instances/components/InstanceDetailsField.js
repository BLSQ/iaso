import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';

import { textPlaceholder, commonStyles } from 'bluesquare-components';

const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        padding: theme.spacing(2),
    },
    labelContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
        top: 2,
    },
    value: {
        wordBreak: 'break-all',
    },
});

const InstanceDetailsField = ({
    classes,
    label,
    value,
    Icon,
    valueTitle,
    renderValue,
}) => {
    return (
        <Grid container spacing={1}>
            <Grid xs={5} item>
                <div className={classes.labelContainer}>
                    {Icon && <Icon />}
                    <Typography
                        variant="body2"
                        noWrap
                        color="inherit"
                        title={label}
                    >
                        {label}
                    </Typography>
                    :
                </div>
            </Grid>
            <Grid
                xs={7}
                container
                item
                justifyContent="flex-start"
                alignItems="center"
            >
                <Typography
                    variant="body1"
                    color="inherit"
                    title={valueTitle !== '' ? valueTitle : value}
                    className={classes.value}
                >
                    {renderValue && renderValue(value)}
                    {!renderValue && (value || textPlaceholder)}
                </Typography>
            </Grid>
        </Grid>
    );
};

InstanceDetailsField.defaultProps = {
    Icon: null,
    valueTitle: '',
    value: null,
    renderValue: null,
};

InstanceDetailsField.propTypes = {
    classes: PropTypes.object.isRequired,
    renderValue: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    Icon: PropTypes.object,
    valueTitle: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};
export default withStyles(styles)(InstanceDetailsField);
