import React, { createRef, FunctionComponent } from 'react';

import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import classNames from 'classnames';

import {
    makeStyles,
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    Typography,
    Divider,
} from '@material-ui/core';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    mapPopupStyles,
} from 'bluesquare-components';
import PopupItemComponent from '../../../../components/maps/popups/PopupItemComponent';
import { LastVisit } from './fieldsValue/LastVisit';
import { RegistrationDate } from './fieldsValue/RegistrationDate';
import { VaccinationNumber } from './fieldsValue/VaccinationNumber';
import { Gender } from './fieldsValue/Gender';
import { Age } from './fieldsValue/Age';
import { LinkToOrgUnit } from '../../../orgUnits/components/LinkToOrgUnit';

import { Location } from './ListMap';
import { baseUrls } from '../../../../constants/urls';

import MESSAGES from '../../messages';

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
};

export const PopupComponent: FunctionComponent<Props> = ({
    titleMessage,
    location,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup = createRef();
    return (
        <Popup className={classes.popup} ref={popup}>
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
                                label={formatMessage(MESSAGES.name)}
                                value={location.original.name}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.id)}
                                value={location.original.uuid}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.lastVisit)}
                                value={
                                    <LastVisit
                                        instances={
                                            location?.original?.instances || []
                                        }
                                    />
                                }
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.program)}
                                value={
                                    location.original.attributes?.file_content
                                        ?.program
                                }
                            />
                            <PopupItemComponent
                                label="HC"
                                value={
                                    <LinkToOrgUnit orgUnit={location.orgUnit} />
                                }
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.registrationDate)}
                                value={
                                    <RegistrationDate
                                        beneficiary={location?.original}
                                    />
                                }
                            />
                            <PopupItemComponent
                                label={formatMessage(
                                    MESSAGES.vaccinationNumber,
                                )}
                                value={
                                    <VaccinationNumber
                                        beneficiary={location?.original}
                                    />
                                }
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.age)}
                                value={<Age beneficiary={location?.original} />}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.gender)}
                                value={
                                    <Gender beneficiary={location?.original} />
                                }
                            />
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
