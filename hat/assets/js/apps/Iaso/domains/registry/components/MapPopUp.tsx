import React, { FunctionComponent, useRef } from 'react';
import { Popup, useMap } from 'react-leaflet';

import ClearIcon from '@mui/icons-material/Clear';
import { Box, Card, CardContent, Divider, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';

import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import MESSAGES from '../messages';
import { LinkToRegistry } from './LinkToRegistry';

type Props = {
    orgUnit: OrgUnit;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...mapPopupStyles(theme),
    popupCardContent: {
        ...mapPopupStyles(theme).popupCardContent,
        margin: theme.spacing(2),
    },
    popup: {
        ...mapPopupStyles(theme).popup,
        '& .leaflet-popup-content': {
            ...mapPopupStyles(theme).popup['& .leaflet-popup-content'],
            width: '300px !important',
        },
        '& a.leaflet-popup-close-button': {
            display: 'none',
        },
    },
}));

export const MapPopUp: FunctionComponent<Props> = ({ orgUnit }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup: any = useRef();
    const map = useMap();
    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            <Card className={classes.popupCard}>
                <Box display="flex" justifyContent="flex-end" px={1} py="4px">
                    <Box mr="auto">
                        <Box display="inline-block" mr={1}>
                            <LinkToOrgUnit
                                orgUnit={orgUnit}
                                useIcon
                                iconSize="small"
                                size="small"
                            />
                        </Box>
                        <LinkToRegistry
                            orgUnit={orgUnit}
                            replace
                            useIcon
                            iconSize="small"
                            size="small"
                        />
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => map.closePopup(popup.current)}
                    >
                        <ClearIcon />
                    </IconButton>
                </Box>
                <Divider />
                <CardContent className={classes.popupCardContent}>
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.name)}
                        value={orgUnit.name}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.type)}
                        value={orgUnit.org_unit_type_name}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.source)}
                        value={orgUnit.source}
                    />
                </CardContent>
            </Card>
        </Popup>
    );
};
