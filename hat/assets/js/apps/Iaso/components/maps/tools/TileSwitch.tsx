import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    makeStyles,
    Typography,
} from '@material-ui/core';
import RadioButtonChecked from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked';
import tiles from '../../../constants/mapTiles';

import MESSAGES from '../messages';

export type Tile = {
    maxZoom: number;
    url: string;
    attribution?: string;
};

type Props = {
    currentTile: Tile;
    // eslint-disable-next-line no-unused-vars
    setCurrentTile: (newTile: Tile) => void;
};
export const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute',
        bottom: theme.spacing(2),
        left: theme.spacing(2),
        zIndex: 1000,
    },
    list: {
        padding: 0,
    },
    icon: {
        marginRight: theme.spacing(1),
        width: 18,
        height: 18,
    },
    title: {
        padding: theme.spacing(1, 2),
        fontSize: 14,
        fontWeight: 'bold',
    },
    listItem: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    item: {
        fontSize: 12,
    },
}));

// Please use this component in a relative box container containing the map

export const TilesSwitch: FunctionComponent<Props> = ({
    currentTile = tiles.osm,
    setCurrentTile,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper className={classes.root}>
            <Typography variant="subtitle1" className={classes.title}>
                {formatMessage(MESSAGES.layersTitle)}
            </Typography>
            <Box>
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
                                onClick={() => setCurrentTile(tile)}
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
        </Paper>
    );
};
