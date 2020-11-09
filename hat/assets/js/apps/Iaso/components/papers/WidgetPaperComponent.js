import React from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Paper,
    Divider,
    Typography,
    Grid,
} from '@material-ui/core';

const styles = theme => ({
    root: {
        backgroundColor: theme.palette.ligthGray.background,
        marginBottom: theme.spacing(4),
        '&:last-child': {
            marginBottom: 0,
        },
    },
    paperTitle: {
        padding: theme.spacing(2),
        display: 'flex',
    },
    paperTitleButtonContainer: {
        position: 'relative',
    },
    paperTitleButton: {
        position: 'absolute',
        right: -theme.spacing(1),
        top: -theme.spacing(1),
    },
    padded: {
        padding: theme.spacing(2),
    },
});

const WidgetPaper = ({
    classes,
    title,
    children,
    padded,
    IconButton,
    iconButtonProps,
}) => (
    <Paper elevation={1} className={classes.root}>
        <div className={classes.paperTitle}>
            <Grid xs={IconButton ? 10 : 12} item>
                <Typography color="primary" variant="h5">
                    {title}
                </Typography>
            </Grid>
            {IconButton && (
                <Grid
                    xs={2}
                    item
                    container
                    justify="flex-end"
                    className={classes.paperTitleButtonContainer}
                >
                    <div className={classes.paperTitleButton}>
                        <IconButton {...iconButtonProps} />
                    </div>
                </Grid>
            )}
        </div>
        <Divider />
        <div className={padded ? classes.padded : null}>{children}</div>
    </Paper>
);

WidgetPaper.defaultProps = {
    padded: false,
    IconButton: null,
    iconButtonProps: {},
};

WidgetPaper.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    padded: PropTypes.bool,
    IconButton: PropTypes.any,
    iconButtonProps: PropTypes.object,
};

export default withStyles(styles)(WidgetPaper);
