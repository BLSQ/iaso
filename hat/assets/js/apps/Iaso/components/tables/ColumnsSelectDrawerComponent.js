import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
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
        height: 60,
    },
    title: {
        marginLeft: theme.spacing(1),
    },
    switch: {
        marginRight: theme.spacing(1),
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
                    <List>
                        {
                            options.map((o, i) => (
                                <ListItem key={o.key}>
                                    <Switch
                                        size="small"
                                        checked={o.active}
                                        onChange={handleChange(i)}
                                        color="primary"
                                        inputProps={{ 'aria-label': o.label }}
                                        className={classes.switch}
                                    />
                                    <ListItemText primary={o.label} />
                                </ListItem>
                            ))
                        }
                    </List>
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
