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

    title: {
        [theme.breakpoints.down('md')]: {
            fontSize: '1.4rem',
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
    id,
    showHeader,
    className,
    elevation = 1,
}) => {
    const [open, setOpen] = useState(isExpanded);
    const handleClick = () => {
        if (expandable) {
            setOpen(!open);
        }
    };
    return (
        <Paper
            elevation={elevation}
            className={`${classes.root} ${className}`}
            id={id}
        >
            {showHeader && (
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
                            <Typography
                                color="primary"
                                variant="h5"
                                className={classes.title}
                            >
                                {title}
                            </Typography>
                            {expandable &&
                                (open ? (
                                    <ExpandLess
                                        className={classes.clickableIcon}
                                    />
                                ) : (
                                    <ExpandMore
                                        className={classes.clickableIcon}
                                    />
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

                    <Divider />
                </div>
            )}

            <Collapse in={open} timeout="auto" unmountOnExit>
                <div
                    className={padded ? classes.padded : null}
                    id={id ? `${id}-body` : undefined}
                >
                    {children}
                </div>
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
    id: undefined,
    showHeader: true,
    className: '',
    elevation: 1,
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
    id: PropTypes.string,
    showHeader: PropTypes.bool,
    className: PropTypes.string,
    elevation: PropTypes.number,
};

export default withStyles(styles)(WidgetPaper);
