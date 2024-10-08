import React, { FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { Popup, useMap } from 'react-leaflet';
import { useSelector } from 'react-redux';

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
import InstanceDetailsField from '../InstanceDetailsField';
import InstanceDetailsInfos from '../InstanceDetailsInfos';

import { baseUrls } from '../../../../constants/urls';
import { getOrgUnitsTree } from '../../../orgUnits/utils';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';

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

type Props = {
    replaceLocation?: (instance: Instance) => void;
    displayUseLocation?: boolean;
};

export const InstancePopup: FunctionComponent<Props> = ({
    replaceLocation = () => null,
    displayUseLocation = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup: any = useRef();
    const map = useMap();
    const currentInstance = useSelector(
        (state: any) => state.instances.current,
    );

    const confirmDialog = useCallback(() => {
        replaceLocation(currentInstance);
        map.closePopup(popup.current);
    }, [currentInstance, map, replaceLocation]);

    const hasHero = (currentInstance?.files?.length ?? 0) > 0;

    const orgUnitTree: any[] = useMemo(() => {
        if (currentInstance?.org_unit) {
            return getOrgUnitsTree(currentInstance.org_unit).reverse();
        }
        return [];
    }, [currentInstance?.org_unit]);

    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            {!currentInstance && <LoadingSpinner />}
            {currentInstance && (
                <Card className={classes.popupCard}>
                    {hasHero && (
                        <CardMedia
                            // TS doesn't recognize the href prop, but MUI passes it down to the native (root) element
                            // @ts-ignore
                            href={currentInstance.files[0]}
                            className={classes.popupCardMedia}
                            image={currentInstance.files[0]}
                            component="div"
                        />
                    )}
                    <CardContent className={classes.popupCardContent}>
                        <InstanceDetailsInfos
                            currentInstance={currentInstance}
                            fieldsToHide={['device_id']}
                        />
                        {currentInstance.org_unit && (
                            <InstanceDetailsField
                                label={formatMessage(MESSAGES.groups)}
                                value={
                                    currentInstance.org_unit.groups &&
                                    currentInstance.org_unit.groups.length > 0
                                        ? currentInstance.org_unit.groups
                                              .map(g => g.name)
                                              .join(', ')
                                        : null
                                }
                            />
                        )}
                        {orgUnitTree.map(o => (
                            <InstanceDetailsField
                                key={o.id}
                                label={o.org_unit_type_name}
                                value={o ? o.name : null}
                            />
                        ))}
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
