import React, { FunctionComponent, useRef } from 'react';
import {
    commonStyles,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import {
    Card,
    CardContent,
    Button,
    Box,
    Grid,
    Typography,
    Divider,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PopupItemComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/maps/popups/PopupItemComponent';
import MESSAGES from '../../../../../constants/messages';
import { LQAS_BASE_URL } from '../../../../../constants/routes';
import { COUNTRY, DISTRICT } from '../../../shared/constants';

const style = theme => {
    return { ...commonStyles(theme), ...mapPopupStyles(theme) };
};

const useStyle = makeStyles(style);

type View = 'district' | 'country';
type Props = {
    shape: any;
    view: View;
};

export const LqasAfroPopup: FunctionComponent<Props> = ({
    shape,
    view = COUNTRY,
}) => {
    const classes: Record<string, string> = useStyle();
    const { formatMessage } = useSafeIntl();
    const ref = useRef();
    const title =
        view === COUNTRY ? shape.data?.country_name : shape.data?.district_name;

    // District view needs more space for French translation
    const labelSize = view === COUNTRY ? 4 : 6;
    const valueSize = view === COUNTRY ? 8 : 6;
    const countryId = view === COUNTRY ? shape.id : shape.country_id;
    const roundNumber = shape?.data?.round_number ?? 1;

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
                            {title}
                        </Typography>
                        <Box mt={1}>
                            <Divider />
                        </Box>
                    </Box>
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.obrName)}
                        value={shape.data.campaign}
                        labelSize={labelSize}
                        valueSize={valueSize}
                    />
                    {view === DISTRICT && (
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.country)}
                            value={shape.country_name}
                            labelSize={labelSize}
                            valueSize={valueSize}
                        />
                    )}
                    {view === DISTRICT && (
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.region)}
                            value={shape.data.region_name}
                            labelSize={labelSize}
                            valueSize={valueSize}
                        />
                    )}
                    {shape.status !== 'inScope' && (
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.round)}
                            value={shape.data.round_number}
                            labelSize={labelSize}
                            valueSize={valueSize}
                        />
                    )}
                    {view === COUNTRY && shape.status !== 'inScope' && (
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.passing)}
                            value={`${shape.lqas_passed}/${shape.scope_count}`}
                            labelSize={labelSize}
                            valueSize={valueSize}
                        />
                    )}
                    {view === DISTRICT && shape.status !== 'inScope' && (
                        <>
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.childrenChecked)}
                                value={shape.data.total_child_checked}
                                labelSize={labelSize}
                                valueSize={valueSize}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.childrenMarked)}
                                value={shape.data.total_child_fmd}
                                labelSize={labelSize}
                                valueSize={valueSize}
                            />
                        </>
                    )}
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                    >
                        <Box mt={2}>
                            <Link
                                target="_blank"
                                to={`${LQAS_BASE_URL}/lqas/campaign/${shape.data.campaign}/country/${countryId}/rounds/${roundNumber},${roundNumber}/rightTab/list`}
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
