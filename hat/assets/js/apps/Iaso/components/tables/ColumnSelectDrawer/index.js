import React from 'react';
import PropTypes from 'prop-types';
import { InView } from 'react-intersection-observer';
import {
    withStyles,
    Drawer,
    IconButton,
    List,
    ListItem,
    Divider,
    InputBase,
    Tooltip,
    Button,
    Box,
} from '@material-ui/core';
import Close from '@material-ui/icons/Close';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

import { BlockPlaceholder, injectIntl } from 'bluesquare-components';

import { MESSAGES } from './messages';
import { styles } from './styles';
import { ColumnDrawerSwitch } from './ColumnDrawerSwitch';

const filterResults = (searchString, options) => {
    let displayedOptions = [...options];
    displayedOptions = displayedOptions.map((o, i) => ({ ...o, index: i }));
    if (searchString !== '') {
        const search = searchString.toLowerCase();
        displayedOptions = displayedOptions.filter(
            o =>
                o?.key?.toLowerCase().includes(search) ||
                o?.label?.toLowerCase().includes(search),
        );
    }
    return displayedOptions;
};

const makeTooltipTitle = option => {
    if (!option.label) return option.key;
    return (
        <div>
            {option.label} -
            <br />
            {option.key}
        </div>
    );
};

const ColumnsSelectDrawer = ({
    classes,
    options,
    setOptions,
    minColumns,
    intl: { formatMessage },
    disabled,
}) => {
    const [state, setState] = React.useState({
        open: false,
        searchString: '',
    });

    const toggleDrawer = open => () => {
        setState({ ...state, open });
    };

    const handleSearch = reset => event => {
        setState({ ...state, searchString: reset ? '' : event.target.value });
    };

    const handleChangeOptions = index => event => {
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
            <Button
                disabled={disabled}
                variant="contained"
                color="primary"
                onClick={toggleDrawer(true)}
                id="ColumnsSelectDrawer-toggleDrawer"
            >
                <Box mr={1} display="inline-flex">
                    <ViewColumnIcon />
                </Box>
                {formatMessage(MESSAGES.columnSelect)}
            </Button>
            <Drawer
                anchor="right"
                open={state.open}
                onClose={toggleDrawer(false)}
            >
                <div className={classes.root}>
                    <div className={classes.toolbar}>
                        <Tooltip title={formatMessage(MESSAGES.close)}>
                            <IconButton onClick={toggleDrawer(false)}>
                                <ArrowBack />
                            </IconButton>
                        </Tooltip>
                        <div className={classes.search}>
                            <InputBase
                                value={state.searchString}
                                onChange={handleSearch()}
                                className={classes.input}
                                placeholder={formatMessage(MESSAGES.search)}
                                inputProps={{
                                    'aria-label': formatMessage(
                                        MESSAGES.search,
                                    ),
                                    className: classes.input,
                                    id: 'ColumnsSelectDrawer-search',
                                }}
                            />
                        </div>
                        {state.searchString !== '' && (
                            <Tooltip
                                title={formatMessage(MESSAGES.resetSearch)}
                            >
                                <IconButton
                                    onClick={handleSearch(true)}
                                    id="ColumnsSelectDrawer-search-empty"
                                >
                                    <Close />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    <Divider />
                    <div className={classes.list} id="ColumnsSelectDrawer-list">
                        <List>
                            {displayedOptions.map(o => (
                                <InView key={o.key}>
                                    {({ inView, ref }) => (
                                        <div ref={ref} id={o.key}>
                                            <ListItem
                                                className={classes.listItem}
                                            >
                                                {inView && (
                                                    <ColumnDrawerSwitch
                                                        disabled={
                                                            activeOptionsCount ===
                                                                minColumns &&
                                                            o.active
                                                        }
                                                        checked={o.active}
                                                        onChange={handleChangeOptions(
                                                            o.index,
                                                        )}
                                                        className={
                                                            classes.switch
                                                        }
                                                        toolTipTitle={makeTooltipTitle(
                                                            o,
                                                        )}
                                                        primaryText={
                                                            o.label
                                                                ? o.label
                                                                : o.key
                                                        }
                                                        secondaryText={o.key}
                                                    />
                                                )}
                                                {!inView && (
                                                    <>
                                                        <BlockPlaceholder width="30px" />
                                                        <BlockPlaceholder />
                                                    </>
                                                )}
                                            </ListItem>
                                        </div>
                                    )}
                                </InView>
                            ))}
                        </List>
                    </div>
                </div>
            </Drawer>
        </>
    );
};

ColumnsSelectDrawer.defaultProps = {
    minColumns: 2,
};

ColumnsSelectDrawer.propTypes = {
    classes: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    setOptions: PropTypes.func.isRequired,
    minColumns: PropTypes.number,
    intl: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
};

const styledAndTranslated = withStyles(styles)(injectIntl(ColumnsSelectDrawer));

export { styledAndTranslated as ColumnsSelectDrawer };
