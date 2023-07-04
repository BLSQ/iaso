import React from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core';
import RadioButtonChecked from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked';
import Box from '@material-ui/core/Box';

import PropTypes from 'prop-types';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { innerDrawerStyles } from '../../nav/InnerDrawer/styles';

import tiles from '../../../constants/mapTiles';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    list: {
        padding: 0,
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
}));

function TileSwitchComponent(props) {
    const { currentTile } = props;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
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
    );
}

TileSwitchComponent.propTypes = {
    currentTile: PropTypes.object.isRequired,
    setCurrentTile: PropTypes.func.isRequired,
};

export default TileSwitchComponent;
