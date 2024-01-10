import React, { useState, FunctionComponent, ReactElement } from 'react';

import { Paper, Divider, Typography, Grid, Collapse, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const useStyles = makeStyles(theme => ({
    root: {
        // @ts-ignore
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
}));

type Props = {
    title: ReactElement | string;
    isExpanded?: boolean;
    expandable?: boolean;
    id?: string;
    padded?: boolean;
    IconButton?: FunctionComponent;
    iconButtonProps?: Record<string, any>;
    showHeader?: boolean;
    className?: string;
    elevation?: number;
};
export const WidgetPaper: FunctionComponent<Props> = ({
    IconButton,
    iconButtonProps,
    title,
    children,
    id = '',
    padded = false,
    expandable = false,
    showHeader = true,
    isExpanded = true,
    className = '',
    elevation = 1,
}) => {
    const classes: Record<string, string> = useStyles();
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
                    className={padded ? classes.padded : undefined}
                    id={id ? `${id}-body` : undefined}
                >
                    {children}
                </div>
            </Collapse>
        </Paper>
    );
};

export default WidgetPaper;
