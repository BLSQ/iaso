import React, { Component, Fragment } from 'react';
import { withStyles, IconButton, Tooltip } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import Add from '@material-ui/icons/Add';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';

import CustomColorShipComponent from '../chips/CustomColorShipComponent';
import MESSAGES from './messages';

const styles = theme => ({
    ...commonStyles(theme),
    mainContainer: {
        display: 'flex',
        position: 'relative',
    },
    chipsContainer: {
        position: 'relative',
        display: 'inline-block',
        marginBottom: theme.spacing(2),
    },
    iconButton: {
        height: 34,
        position: 'relative',
        top: -1,
    },
    chip: {
        marginRight: theme.spacing(1),
    },
});

class DynamicChipsComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chipIndex: parseInt(props.params[props.tabParamKey], 10) || 0,
        };
    }

    handleAdd() {
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
        newState.chipIndex = newItems.length;
        newItems.push(defaultItem);
        const newParams = {
            ...params,
        };
        newParams[tabParamKey] = newState.chipIndex.toString();
        newParams[paramKey] = JSON.stringify(newItems);
        redirectTo(baseUrl, newParams);
        onTabsUpdated();
        this.setState(newState);
    }

    handleDelete(chipIndex) {
        const {
            redirectTo,
            params,
            paramKey,
            baseUrl,
            tabParamKey,
            onTabsUpdated,
        } = this.props;
        const newItems = JSON.parse(params[paramKey]);
        newItems.splice(chipIndex, 1);
        const newParams = {
            ...params,
        };

        newParams[paramKey] = JSON.stringify(newItems);
        if (this.state.chipIndex > newItems.length - 1) {
            newParams[tabParamKey] = (newItems.length - 1).toString();
            this.setState({
                chipIndex: newItems.length - 1,
            });
        }
        onTabsUpdated();
        redirectTo(baseUrl, newParams);
    }

    handleChange(chipIndex) {
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
        newState.chipIndex = chipIndex;
        const newParams = {
            ...params,
        };
        newParams[tabParamKey] = newState.chipIndex.toString();
        newParams[paramKey] = JSON.stringify(newItems);
        redirectTo(baseUrl, newParams);
        this.setState(newState);
    }

    render() {
        const { classes, baseLabel, params, paramKey, maxItems } = this.props;
        const { chipIndex } = this.state;
        const itemsList = JSON.parse(params[paramKey]);
        return (
            <section className={classes.mainContainer}>
                <div className={classes.chipsContainer}>
                    {itemsList.map((item, currentIndex) => (
                        <CustomColorShipComponent
                            className={classes.chip}
                            color={`#${item.color}`}
                            key={currentIndex}
                            isSelected={chipIndex === currentIndex}
                            chipProps={{
                                label: `${baseLabel} - ${currentIndex + 1}`,
                                clickable: true,
                                onDelete: () => this.handleDelete(currentIndex),
                                onClick: () => this.handleChange(currentIndex),
                                className: classes.chip,
                            }}
                        />
                    ))}
                </div>
                {itemsList.length < maxItems && (
                    <Tooltip
                        size="small"
                        title={
                            <Fragment>
                                <FormattedMessage {...MESSAGES.add} />
                                {` ${baseLabel.toLowerCase()}`}
                            </Fragment>
                        }
                    >
                        <IconButton
                            onClick={() => this.handleAdd()}
                            className={classes.iconButton}
                            size="small"
                        >
                            <Add />
                        </IconButton>
                    </Tooltip>
                )}
            </section>
        );
    }
}
DynamicChipsComponent.defaultProps = {
    baseLabel: '',
    maxItems: 5,
    onTabsUpdated: () => ({}),
};

DynamicChipsComponent.propTypes = {
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

export default withStyles(styles)(DynamicChipsComponent);
