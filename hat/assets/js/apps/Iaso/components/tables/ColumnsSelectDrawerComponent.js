import React from 'react';
import PropTypes from 'prop-types';
import { InView } from 'react-intersection-observer';
import { injectIntl } from 'react-intl';

import {
    withStyles,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Switch,
    InputBase,
    Tooltip,
} from '@material-ui/core';
import FilterList from '@material-ui/icons/FilterList';
import Close from '@material-ui/icons/Close';

import RowButtonComponent from '../buttons/RowButtonComponent';
import BlockPlaceholder from '../placeholders/BlockPlaceholder';

const MESSAGES = {
    search: {
        id: 'iaso.label.textSearch',
        defaultMessage: 'Search',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
};

const filterResults = (searchString, options) => {
    let displayedOptions = [...options];
    if (searchString !== '') {
        displayedOptions = displayedOptions.filter(o => (o.key && o.key.includes(searchString))
            || (o.label && o.label.includes(searchString)));
    }
    return displayedOptions;
};

const styles = theme => ({
    root: {
        width: 400,
        overflow: 'hidden',
    },
    colorPrimary: {
        color: 'white',
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        height: theme.spacing(8),
    },
    search: {
        marginLeft: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    list: {
        height: `calc(100vh - ${theme.spacing(8)}px)`,
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    listItem: {
        height: theme.spacing(6),
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
        minColumns,
        intl: {
            formatMessage,
        },
    },
) => {
    const [state, setState] = React.useState({
        open: false,
        searchString: '',
    });

    const toggleDrawer = open => () => {
        setState({ ...state, open });
    };

    const handleSearch = () => (event) => {
        setState({ ...state, searchString: event.target.value });
    };

    const handleChangeOptions = index => (event) => {
        const newOptions = [...options];
        newOptions[index] = {
            ...newOptions[index],
            active: event.target.checked,
        };
        setOptions(newOptions);
    };

    const activeOptionsCount = options.filter(o => o.active).length;

    const displayedOptions = filterResults(state.searchString, options);

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
                        <div className={classes.search}>
                            <InputBase
                                onChange={handleSearch()}
                                className={classes.input}
                                placeholder={formatMessage(MESSAGES.search)}
                                inputProps={{ 'aria-label': formatMessage(MESSAGES.search) }}
                            />
                        </div>
                        <Tooltip title={formatMessage(MESSAGES.close)}>
                            <IconButton onClick={toggleDrawer(false)}>
                                <Close />
                            </IconButton>
                        </Tooltip>
                    </div>
                    <Divider />
                    <div className={classes.list}>
                        <List>
                            {
                                displayedOptions.map((o, i) => (

                                    <InView key={o.key}>
                                        {({ inView, ref }) => (
                                            <div ref={ref}>
                                                <ListItem className={classes.listItem}>
                                                    {
                                                        inView
                                                        && (
                                                            <>
                                                                <Switch
                                                                    disabled={activeOptionsCount === minColumns && o.active}
                                                                    size="small"
                                                                    checked={o.active}
                                                                    onChange={handleChangeOptions(i)}
                                                                    color="primary"
                                                                    inputProps={{ 'aria-label': o.label }}
                                                                    className={classes.switch}
                                                                />
                                                                <ListItemText primary={o.label || o.key} />
                                                            </>
                                                        )
                                                    }
                                                    {
                                                        !inView
                                                        && (
                                                            <>
                                                                <BlockPlaceholder width="30px" />
                                                                <BlockPlaceholder />
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
    minColumns: 2,
};

ColumnsSelectDrawerComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    iconColor: PropTypes.string,
    options: PropTypes.array.isRequired,
    setOptions: PropTypes.func.isRequired,
    minColumns: PropTypes.number,
    intl: PropTypes.object.isRequired,
};


export default withStyles(styles)(injectIntl(ColumnsSelectDrawerComponent));
