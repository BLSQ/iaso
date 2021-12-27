import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Paper,
    Divider,
    Typography,
    Grid,
    Collapse,
    Box,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

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
    clickable: {
        cursor: 'pointer',
        display: 'flex',
    },
    clickableIcon: {
        marginLeft: 'auto',
        marginTop: theme.spacing(1),
    },
});

const WidgetPaper = ({
    classes,
    title,
    children,
    padded,
    IconButton,
    iconButtonProps,
    expandable,
    isExpanded,
}) => {
    const [open, setOpen] = useState(isExpanded);
    const handleClick = () => {
        if (expandable) {
            setOpen(!open);
        }
    };
    return (
        <Paper elevation={1} className={classes.root}>
            <div className={classes.paperTitle}>
                <Grid xs={IconButton ? 10 : 12} item>
                    <Box
                        onClick={handleClick}
                        className={
                            expandable && classes.clickable
                                ? classes.clickable
                                : ''
                        }
                    >
                        <Typography color="primary" variant="h5">
                            {title}
                        </Typography>
                        {expandable &&
                            (open ? (
                                <ExpandLess className={classes.clickableIcon} />
                            ) : (
                                <ExpandMore className={classes.clickableIcon} />
                            ))}
                    </Box>
                </Grid>
                {IconButton && (
                    <Grid
                        xs={2}
                        item
                        container
                        justifyContent="flex-end"
                        className={classes.paperTitleButtonContainer}
                    >
                        <div className={classes.paperTitleButton}>
                            <IconButton {...iconButtonProps} />
                        </div>
                    </Grid>
                )}
            </div>
            <Divider />

            <Collapse in={open} timeout="auto" unmountOnExit>
                <div className={padded ? classes.padded : null}>{children}</div>
            </Collapse>
        </Paper>
    );
};

WidgetPaper.defaultProps = {
    padded: false,
    IconButton: null,
    iconButtonProps: {},
    expandable: false,
    isExpanded: true,
};

WidgetPaper.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    padded: PropTypes.bool,
    IconButton: PropTypes.any,
    iconButtonProps: PropTypes.object,
    expandable: PropTypes.bool,
    isExpanded: PropTypes.bool,
};

export default withStyles(styles)(WidgetPaper);
