import React, { useRef } from 'react';
import {
    commonStyles,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import {
    makeStyles,
    Card,
    CardContent,
    Button,
    Box,
    Grid,
    Typography,
    Divider,
} from '@material-ui/core';
import PopupItemComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/maps/popups/PopupItemComponent';
import MESSAGES from '../../../../../constants/messages';
import { LQAS_BASE_URL } from '../../../../../constants/routes';

const style = theme => {
    return { ...commonStyles(theme), ...mapPopupStyles(theme) };
};

const useStyle = makeStyles(style);

export const LqasAfroPopup = ({ shape }) => {
    const classes: Record<string, string> = useStyle();
    const { formatMessage } = useSafeIntl();
    const ref = useRef();
    if (shape.status === 'inScope') return null;
    return (
        // ignore classname TS error // @ts-ignore
        // @ts-ignore
        <Popup className={classes.popup} ref={ref} pane="popupPane">
            <Card className={classes.popupCard}>
                <CardContent className={classes.popupCardContent}>
                    <Box mb={2}>
                        <Typography
                            variant="h6"
                            className={classes.titleMessage}
                            style={{ fontSize: 16 }}
                        >
                            {shape.data.country_name}
                        </Typography>
                        <Box mt={1}>
                            <Divider />
                        </Box>
                    </Box>
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.obrName)}
                        value={shape.data.campaign}
                        labelSize={4}
                        valueSize={8}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.round)}
                        value={shape.data.round_number}
                        labelSize={4}
                        valueSize={8}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.passing)}
                        value={`${shape.lqas_passed}/${shape.scope_count}`}
                        labelSize={4}
                        valueSize={8}
                    />
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                    >
                        <Box>
                            <Link
                                target="_blank"
                                to={`${LQAS_BASE_URL}/lqas/campaign/${shape.data.campaign}/country/${shape.id}/`}
                            >
                                <Button
                                    className={classes.marginLeft}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                >
                                    {formatMessage(MESSAGES.gotoLqasForCountry)}
                                </Button>
                            </Link>
                        </Box>
                    </Grid>
                </CardContent>
            </Card>
        </Popup>
    );
};

export const makePopup = shape => {
    return <LqasAfroPopup shape={shape} />;
};
