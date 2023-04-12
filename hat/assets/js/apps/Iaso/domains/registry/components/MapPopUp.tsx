import React, { FunctionComponent, useRef } from 'react';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router';

import {
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    makeStyles,
} from '@material-ui/core';

import {
    useSafeIntl,
    commonStyles,
    mapPopupStyles,
} from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

type Props = {
    orgUnit: OrgUnit;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...mapPopupStyles(theme),
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        '&:hover': { textDecoration: 'none' },
    },
}));

export const MapPopUp: FunctionComponent<Props> = ({ orgUnit }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup: any = useRef();

    return (
        <Popup className={classes.popup} ref={popup}>
            <Card className={classes.popupCard}>
                <CardContent className={classes.popupCardContent}>
                    {orgUnit.name}
                    <Box className={classes.actionBox}>
                        <Grid
                            container
                            spacing={0}
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            <Link
                                target="_blank"
                                to={`${baseUrls.registryDetail}/orgunitId/${orgUnit.id}`}
                                className={classes.linkButton}
                            >
                                <Button
                                    className={classes.marginLeft}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                >
                                    {formatMessage(MESSAGES.see)}
                                </Button>
                            </Link>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Popup>
    );
};
