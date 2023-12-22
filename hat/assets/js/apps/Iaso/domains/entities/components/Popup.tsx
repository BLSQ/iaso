import React, { createRef, FunctionComponent } from 'react';

import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import classNames from 'classnames';

import {
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    Typography,
    Divider,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl, mapPopupStyles } from 'bluesquare-components';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';

import { Location } from './ListMap';
import { baseUrls } from '../../../constants/urls';
import { ExtraColumn } from '../types/fields';
import { useGetFieldValue } from '../hooks/useGetFieldValue';
import { formatLabel } from '../../instances/utils';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...mapPopupStyles(theme),
    popup: {
        ...mapPopupStyles(theme).popup,
        '& .leaflet-popup-content': {
            margin: 0,
            minHeight: 100,
            width: '450px !important',
        },
    },
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    titleMessage: {
        fontSize: 16,
        marginBottom: theme.spacing(1),
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
    },
}));

type Props = {
    titleMessage: string;
    location?: Location;
    extraColumns?: Array<ExtraColumn>;
};

export const PopupComponent: FunctionComponent<Props> = ({
    titleMessage,
    location,
    extraColumns,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup = createRef();
    const getValue = useGetFieldValue();
    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            <Card className={classes.popupCard}>
                <CardContent className={classNames(classes.popupCardContent)}>
                    {titleMessage && (
                        <Box mb={2}>
                            <Typography
                                variant="h6"
                                className={classes.titleMessage}
                            >
                                {titleMessage}
                            </Typography>
                            <Divider />
                        </Box>
                    )}
                    {location && (
                        <>
                            <PopupItemComponent
                                label="HC"
                                value={
                                    <LinkToOrgUnit orgUnit={location.orgUnit} />
                                }
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.type)}
                                value={location.original.entity_type}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.program)}
                                value={location.original.program}
                            />
                            {extraColumns?.map(extraColumn => (
                                <PopupItemComponent
                                    key={extraColumn.name}
                                    label={formatLabel(extraColumn)}
                                    value={getValue(
                                        extraColumn.name,
                                        location.original,
                                        extraColumn.type,
                                    )}
                                />
                            ))}
                            <Box className={classes.actionBox}>
                                <Grid
                                    container
                                    spacing={0}
                                    justifyContent="flex-end"
                                    alignItems="center"
                                >
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                    >
                                        <Link
                                            target="_blank"
                                            to={`/${baseUrls.entityDetails}/entityId/${location.id}`}
                                            className={classes.linkButton}
                                        >
                                            {formatMessage(MESSAGES.see)}
                                        </Link>
                                    </Button>
                                </Grid>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>
        </Popup>
    );
};
