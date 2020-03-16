import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { InView } from 'react-intersection-observer';

import {
    withStyles,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Switch,
    Typography,
} from '@material-ui/core';
import FilterList from '@material-ui/icons/FilterList';
import ArrowBack from '@material-ui/icons/ArrowBack';

import RowButtonComponent from '../buttons/RowButtonComponent';

const styles = theme => ({
    root: {
        width: 400,
    },
    colorPrimary: {
        color: 'white',
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        height: 64,
    },
    title: {
        marginLeft: theme.spacing(1),
    },
    list: {
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    listItem: {
        height: 48,
    },
    switch: {
        marginRight: theme.spacing(1),
    },
    placeholder: {
        height: 15,
        backgroundColor: theme.palette.ligthGray.main,
        borderRadius: 5,
        marginRight: theme.spacing(1),
        width: '50%',
    },
});

const ColumnsSelectDrawerComponent = (
    {
        classes,
        iconColor,
        options,
        setOptions,
    },
) => {
    const [state, setState] = React.useState({
        open: false,
    });

    const toggleDrawer = open => () => {
        setState({ ...state, open });
    };

    const handleChange = index => (event) => {
        const newOptions = [...options];
        newOptions[index] = {
            ...newOptions[index],
            active: event.target.checked,
        };
        setOptions(newOptions);
    };

    return (
        <>
            <RowButtonComponent
                onClick={toggleDrawer(true)}
                tooltipMessage={{
                    id: 'iaso.table.columnSelect.tooltip',
                    defaultMessage: 'Select visible columns',
                }}
            >
                <FilterList
                    color={iconColor}
                    classes={{
                        colorPrimary: classes.colorPrimary,
                    }}
                />
            </RowButtonComponent>
            <Drawer anchor="right" open={state.open} onClose={toggleDrawer(false)}>
                <div
                    className={classes.root}
                >
                    <div className={classes.toolbar}>
                        <IconButton onClick={toggleDrawer(false)}>
                            <ArrowBack />
                        </IconButton>
                        <Typography
                            className={classes.title}
                            type="body2"
                        >
                            <FormattedMessage
                                id="iaso.table.columnSelect.tooltip"
                                defaultMessage="Select visible columns"
                            />
                        </Typography>
                    </div>
                    <Divider />
                    <div className={classes.list}>
                        <List>
                            {
                                options.map((o, i) => (

                                    <InView key={o.key}>
                                        {({ inView, ref }) => (
                                            <div ref={ref}>
                                                <ListItem className={classes.listItem}>
                                                    {
                                                        inView
                                                        && (
                                                            <>
                                                                <Switch
                                                                    size="small"
                                                                    checked={o.active}
                                                                    onChange={handleChange(i)}
                                                                    color="primary"
                                                                    inputProps={{ 'aria-label': o.label }}
                                                                    className={classes.switch}
                                                                />
                                                                <ListItemText primary={o.label} />
                                                            </>
                                                        )
                                                    }
                                                    {
                                                        !inView
                                                        && (
                                                            <>
                                                                <div
                                                                    className={classes.placeholder}
                                                                    style={
                                                                        {
                                                                            width: 30,
                                                                        }
                                                                    }
                                                                />
                                                                <div
                                                                    className={classes.placeholder}
                                                                />
                                                            </>
                                                        )
                                                    }
                                                </ListItem>
                                            </div>
                                        )}
                                    </InView>
                                ))
                            }
                        </List>
                    </div>
                </div>
            </Drawer>
        </>
    );
};


ColumnsSelectDrawerComponent.defaultProps = {
    iconColor: 'primary',
};

ColumnsSelectDrawerComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    iconColor: PropTypes.string,
    options: PropTypes.array.isRequired,
    setOptions: PropTypes.func.isRequired,
};


export default withStyles(styles)(ColumnsSelectDrawerComponent);
