import React from 'react';
import PropTypes from 'prop-types';
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
    InputBase,
    Tooltip,
} from '@material-ui/core';
import Close from '@material-ui/icons/Close';
import ArrowBack from '@material-ui/icons/ArrowBack';

import {
    IconButton as IconButtonComponent,
    BlockPlaceholder,
    injectIntl,
} from 'bluesquare-components';

import { truncateText } from 'bluesquare-components/dist/utils';
import { MESSAGES } from './messages';
import { styles } from './styles';

const filterResults = (searchString, options) => {
    let displayedOptions = [...options];
    displayedOptions = displayedOptions.map((o, i) => ({ ...o, index: i }));
    if (searchString !== '') {
        const search = searchString.toLowerCase();
        displayedOptions = displayedOptions.filter(
            o =>
                o?.key.toLowerCase().includes(search) ||
                o?.label.toLowerCase().includes(search),
        );
    }
    return displayedOptions;
};

const ColumnsSelectDrawer = ({
    classes,
    options,
    setOptions,
    minColumns,
    intl: { formatMessage },
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
            <IconButtonComponent
                onClick={toggleDrawer(true)}
                icon="filter-list"
                color="white"
                tooltipMessage={MESSAGES.columnSelectTooltip}
            />
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
                                }}
                            />
                        </div>
                        {state.searchString !== '' && (
                            <Tooltip
                                title={formatMessage(MESSAGES.resetSearch)}
                            >
                                <IconButton onClick={handleSearch(true)}>
                                    <Close />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    <Divider />
                    <div className={classes.list}>
                        <List>
                            {displayedOptions.map(o => (
                                <InView key={o.key}>
                                    {({ inView, ref }) => (
                                        <div ref={ref} id={o.key}>
                                            <ListItem
                                                className={classes.listItem}
                                            >
                                                {inView && (
                                                    <>
                                                        <Switch
                                                            disabled={
                                                                activeOptionsCount ===
                                                                    minColumns &&
                                                                o.active
                                                            }
                                                            size="small"
                                                            checked={o.active}
                                                            onChange={handleChangeOptions(
                                                                o.index,
                                                            )}
                                                            color="primary"
                                                            inputProps={{
                                                                'aria-label':
                                                                    o.label,
                                                            }}
                                                            className={
                                                                classes.switch
                                                            }
                                                        />
                                                        <Tooltip
                                                            title={
                                                                o.label ?? o.key
                                                            }
                                                            placement="bottom-start"
                                                        >
                                                            <ListItemText
                                                                style={{
                                                                    cursor: 'default',
                                                                }}
                                                                primary={
                                                                    o.label
                                                                        ? truncateText(
                                                                              o.label,
                                                                              40,
                                                                          )
                                                                        : o.key
                                                                }
                                                                secondary={
                                                                    o.key
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </>
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
};

const styledAndTranslated = withStyles(styles)(injectIntl(ColumnsSelectDrawer));

export { styledAndTranslated as ColumnsSelectDrawer };
