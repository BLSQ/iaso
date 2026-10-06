import React, { FunctionComponent } from 'react';
import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import tiles from '../../../constants/mapTiles';
import MESSAGES from '../messages';
import {
    Basemap,
    DEFAULT_BASEMAP,
    PROTOMAPS_FLAVORS,
    ProtomapsFlavor,
} from './basemaps';

const FLAVOR_MESSAGES: Record<ProtomapsFlavor, IntlMessage> = {
    light: MESSAGES.protomapsLight,
    dark: MESSAGES.protomapsDark,
    white: MESSAGES.protomapsWhite,
    grayscale: MESSAGES.protomapsGrayscale,
    black: MESSAGES.protomapsBlack,
};

type ItemProps = {
    label: string;
    selected: boolean;
    onClick: () => void;
    /** a flavor, under its basemap */
    nested?: boolean;
};

const Item: FunctionComponent<ItemProps> = ({
    label,
    selected,
    onClick,
    nested = false,
}) => (
    <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{ pl: nested ? 6 : 3, pr: 3, py: nested ? 0.25 : 0.75 }}
    >
        <ListItemIcon sx={{ minWidth: 26 }}>
            {selected ? (
                <RadioButtonChecked color="primary" sx={{ fontSize: 18 }} />
            ) : (
                <RadioButtonUnchecked sx={{ fontSize: 18 }} />
            )}
        </ListItemIcon>
        <ListItemText
            primary={label}
            primaryTypographyProps={{ fontSize: nested ? 13 : 14 }}
        />
    </ListItemButton>
);

type Props = {
    basemap: Basemap;
    onChange: (basemap: Basemap) => void;
};

/**
 * The basemaps of the MapLibre maps: the Protomaps vector basemap and its flavors, then the raster tiles the
 * leaflet maps also use.
 */
export const BasemapList: FunctionComponent<Props> = ({
    basemap,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const isProtomaps = basemap.kind === 'protomaps';
    return (
        <Box py={1}>
            <List disablePadding>
                <Item
                    label={formatMessage(MESSAGES.protomaps)}
                    selected={isProtomaps}
                    onClick={() => !isProtomaps && onChange(DEFAULT_BASEMAP)}
                />
                {PROTOMAPS_FLAVORS.map(flavor => (
                    <Item
                        key={flavor}
                        nested
                        label={formatMessage(FLAVOR_MESSAGES[flavor])}
                        selected={isProtomaps && basemap.flavor === flavor}
                        onClick={() => onChange({ kind: 'protomaps', flavor })}
                    />
                ))}
                {Object.keys(tiles).map(key => (
                    <Item
                        key={key}
                        label={formatMessage(
                            MESSAGES[key as keyof typeof MESSAGES],
                        )}
                        selected={
                            basemap.kind === 'raster' && basemap.key === key
                        }
                        onClick={() => onChange({ kind: 'raster', key })}
                    />
                ))}
            </List>
        </Box>
    );
};
