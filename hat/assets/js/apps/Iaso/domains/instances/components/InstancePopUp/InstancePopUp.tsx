import { Theme } from '@mui/material/styles';
import L from 'leaflet';
import React, { createRef, FunctionComponent, useCallback } from 'react';
import { Popup, useMap } from 'react-leaflet';

import { Box, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    LinkButton,
    LoadingSpinner,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';
import ConfirmDialog from '../../../../components/dialogs/ConfirmDialogComponent';
import InstanceDetailsInfos from '../InstanceDetailsInfos';

import { baseUrls } from '../../../../constants/urls';
import { usePopupState } from '../../../../utils/map/usePopupState';
import { useGetInstance } from '../../../registry/hooks/useGetInstances';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import { INSTANCE_MAP_METAS_FIELDS } from '../../constants';

const useStyles = makeStyles((theme: Theme) => ({
    ...(commonStyles(theme) as Record<string, any>),
    ...(mapPopupStyles(theme) as Record<string, any>),
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

type Props = {
    replaceLocation?: (instance: Instance) => void;
    displayUseLocation?: boolean;
    instanceId: number;
};

export const InstancePopup: FunctionComponent<Props> = ({
    replaceLocation = () => null,
    displayUseLocation = false,
    instanceId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup = createRef<L.Popup>();
    const isOpen = usePopupState(popup);
    const map = useMap();
    const { data: currentInstance, isLoading } = useGetInstance(
        isOpen ? instanceId : undefined,
    );
    const confirmDialog = useCallback(() => {
        if (currentInstance) {
            replaceLocation(currentInstance);
            map.closePopup(popup.current);
        }
    }, [currentInstance, map, popup, replaceLocation]);

    const hasHero = (currentInstance?.files?.length ?? 0) > 0;

    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            {isLoading && <LoadingSpinner />}
            {currentInstance && (
                <Card className={classes.popupCard}>
                    {hasHero && (
                        <CardMedia
                            // TS doesn't recognize the href prop, but MUI passes it down to the native (root) element
                            // @ts-ignore
                            href={currentInstance?.files.slice(-1)[0]}
                            className={classes.popupCardMedia}
                            image={currentInstance?.files.slice(-1)[0]}
                            component="div"
                        />
                    )}
                    <CardContent className={classes.popupCardContent}>
                        <InstanceDetailsInfos
                            instance_metas_fields={INSTANCE_MAP_METAS_FIELDS}
                            currentInstance={currentInstance}
                            fieldsToHide={['device_id']}
                        />

                        <Box className={classes.actionBox}>
                            <Grid
                                container
                                spacing={0}
                                justifyContent={
                                    displayUseLocation ? 'center' : 'flex-end'
                                }
                                alignItems="center"
                            >
                                {displayUseLocation && (
                                    <ConfirmDialog
                                        btnSize="small"
                                        btnMessage={formatMessage(
                                            MESSAGES.associate,
                                        )}
                                        question={formatMessage(
                                            MESSAGES.question,
                                        )}
                                        message={formatMessage(
                                            MESSAGES.message,
                                        )}
                                        confirm={confirmDialog}
                                    />
                                )}
                                <LinkButton
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    target="_blank"
                                    to={`/${baseUrls.instanceDetail}/instanceId/${currentInstance.id}`}
                                    className={classes.linkButton}
                                >
                                    {formatMessage(MESSAGES.see)}
                                </LinkButton>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Popup>
    );
};
