import React, { Fragment } from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core';
import RadioButtonChecked from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import PropTypes from 'prop-types';
import { injectIntl, commonStyles } from 'bluesquare-components';
import { innerDrawerStyles } from '../../nav/InnerDrawer/styles';

import tiles from '../../../constants/mapTiles';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    list: {
        padding: theme.spacing(0, 0, 2, 0),
    },
    icon: {
        marginRight: theme.spacing(1),
        width: 18,
        height: 18,
    },
    title: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        textAlign: 'center',
        fontSize: 15,
    },
    listItem: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
    },
    item: {
        fontSize: 14,
    },
});

function TileSwitchComponent(props) {
    const {
        currentTile,
        classes,
        intl: { formatMessage },
    } = props;
    return (
        <>
            <Box px={2} className={classes.innerDrawerToolbar} component="div">
                <Typography variant="subtitle1">
                    {formatMessage(MESSAGES.layersTitle)}
                </Typography>
            </Box>
            <Box py={2} component="div">
                <List className={classes.list}>
                    {Object.keys(tiles).map(key => {
                        const tile = tiles[key];
                        const isCurrentTile = currentTile.url === tile.url;
                        return (
                            <ListItem
                                selected={isCurrentTile}
                                className={classes.listItem}
                                key={key}
                                button
                                onClick={() => props.setCurrentTile(tile)}
                            >
                                {isCurrentTile && (
                                    <RadioButtonChecked
                                        color="primary"
                                        className={classes.icon}
                                    />
                                )}
                                {!isCurrentTile && (
                                    <RadioButtonUnchecked
                                        className={classes.icon}
                                    />
                                )}
                                <ListItemText
                                    primary={formatMessage(MESSAGES[key])}
                                    classes={{
                                        primary: classes.item,
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </>
    );
}

TileSwitchComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentTile: PropTypes.object.isRequired,
    setCurrentTile: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(TileSwitchComponent));
