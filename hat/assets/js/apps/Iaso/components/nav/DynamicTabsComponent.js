import React, { Component, Fragment } from 'react';
import {
    withStyles,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import Add from '@material-ui/icons/Add';
import Remove from '@material-ui/icons/Remove';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';


const styles = theme => ({
    ...commonStyles(theme),
    tabs: {
        ...commonStyles(theme).tabs,
        paddingRight: 0,
    },
    mainContainer: {
        display: 'flex',
        position: 'relative',
    },
    tabsContainer: {
        position: 'relative',
    },
    iconButton: {
        color: 'white',
        height: 30,
        position: 'relative',
        top: 8,
    },
    removeIconButton: {
        color: 'white',
        position: 'relative',
        top: 8,
        height: '1em',
        '& svg': {
            width: '0.5em',
            height: '0.5em',
        },
    },
    removeContainer: {
        position: 'absolute',
        left: theme.spacing(4),
        top: -5,
        minHeight: 0,
        height: 1,
        width: '100%',
        display: 'flex',
        listStyleType: 'none',
        zIndex: 100000,
    },
    removeContainerItem: {
        display: 'inline-flex',
        justifyContent: 'flex-end',
        minWidth: 160,
        fontSize: 5,
    },
    roundColor: {
        display: 'inline-block',
        width: 15,
        height: 15,
        borderRadius: 15,
        position: 'relative',
        top: 4,
    },
});

class DynamicTabsComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tabIndex: parseInt(props.params[props.tabParamKey], 10) || 0,
        };
    }

    handleAddTab() {
        const {
            redirectTo,
            params,
            defaultItem,
            paramKey,
            baseUrl,
            tabParamKey,
            onTabsUpdated,
        } = this.props;
        const newState = {
            ...this.state,
        };
        const newItems = JSON.parse(params[paramKey]);
        newState.tabIndex = newItems.length;
        newItems.push(defaultItem);
        const newParams = {
            ...params,
        };
        newParams[tabParamKey] = newState.tabIndex.toString();
        newParams[paramKey] = JSON.stringify(newItems);
        redirectTo(baseUrl, newParams);
        onTabsUpdated();
        this.setState(newState);
    }


    handleDeleteTab(tabIndex) {
        const {
            redirectTo,
            params,
            paramKey,
            baseUrl,
            tabParamKey,
            onTabsUpdated,
        } = this.props;
        const newItems = JSON.parse(params[paramKey]);
        newItems.splice(tabIndex, 1);
        const newParams = {
            ...params,
        };

        newParams[paramKey] = JSON.stringify(newItems);
        if (this.state.tabIndex > newItems.length - 1) {
            newParams[tabParamKey] = (newItems.length - 1).toString();
            this.setState({
                tabIndex: newItems.length - 1,
            });
        }
        onTabsUpdated();
        redirectTo(baseUrl, newParams);
    }

    handleTabChange(tabIndex) {
        const {
            redirectTo,
            params,
            paramKey,
            baseUrl,
            tabParamKey,
        } = this.props;
        const newState = {
            ...this.state,
        };
        const newItems = JSON.parse(params[paramKey]);
        newState.tabIndex = tabIndex;
        const newParams = {
            ...params,
        };
        newParams[tabParamKey] = newState.tabIndex.toString();
        newParams[paramKey] = JSON.stringify(newItems);
        redirectTo(baseUrl, newParams);
        this.setState(newState);
    }

    render() {
        const {
            classes,
            baseLabel,
            params,
            paramKey,
            maxItems,
        } = this.props;
        const {
            tabIndex,
        } = this.state;
        const itemsList = JSON.parse(params[paramKey]);
        return (
            <section className={classes.mainContainer}>
                <div className={classes.tabsContainer}>

                    {
                        itemsList.length > 1
                        && (
                            <ul className={classes.removeContainer}>
                                {
                                    itemsList.map((item, currentTabIndex) => (
                                        <li className={classes.removeContainerItem} key={currentTabIndex}>
                                            <Tooltip
                                                size="small"
                                                title={(
                                                    <Fragment>
                                                        <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                                                        {` ${baseLabel.toLowerCase()}`}
                                                    </Fragment>
                                                )}
                                            >
                                                <IconButton
                                                    onClick={() => this.handleDeleteTab(currentTabIndex)}
                                                    className={classes.removeIconButton}
                                                    size="small"
                                                >
                                                    <Remove />
                                                </IconButton>
                                            </Tooltip>
                                        </li>
                                    ))
                                }
                            </ul>
                        )
                    }
                    <Tabs
                        value={tabIndex}
                        classes={{
                            root: classes.tabs,
                            indicator: classes.indicator,
                        }}
                        onChange={(event, newtab) => this.handleTabChange(newtab)
                        }
                    >
                        {
                            itemsList.map((item, currentTabIndex) => (
                                <Tab
                                    key={currentTabIndex}
                                    value={currentTabIndex}
                                    label={(
                                        <span>
                                            {`${baseLabel} - `}
                                            <span
                                                style={{
                                                    backgroundColor: `#${item.color}`,
                                                }}
                                                className={classes.roundColor}
                                            />
                                        </span>

                                    )}
                                />
                            ))
                        }
                    </Tabs>
                </div>
                {
                    itemsList.length < maxItems
                    && (
                        <Tooltip
                            size="small"
                            title={(
                                <Fragment>
                                    <FormattedMessage id="iaso.label.add" defaultMessage="Add" />
                                    {` ${baseLabel.toLowerCase()}`}
                                </Fragment>
                            )}
                        >
                            <IconButton
                                onClick={() => this.handleAddTab()}
                                className={classes.iconButton}
                                size="small"
                            >
                                <Add />
                            </IconButton>
                        </Tooltip>
                    )
                }
            </section>
        );
    }
}
DynamicTabsComponent.defaultProps = {
    baseLabel: 'tab',
    maxItems: 5,
    onTabsUpdated: () => ({}),
};

DynamicTabsComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    baseLabel: PropTypes.string,
    params: PropTypes.object.isRequired,
    defaultItem: PropTypes.object.isRequired,
    paramKey: PropTypes.string.isRequired,
    tabParamKey: PropTypes.string.isRequired,
    baseUrl: PropTypes.string.isRequired,
    redirectTo: PropTypes.func.isRequired,
    maxItems: PropTypes.number,
    onTabsUpdated: PropTypes.func,
};

export default withStyles(styles)(DynamicTabsComponent);
