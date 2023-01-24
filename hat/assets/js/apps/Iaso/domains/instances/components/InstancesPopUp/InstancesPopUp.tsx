/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Popup } from 'react-leaflet';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import {
    Card,
    CardMedia,
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
    LoadingSpinner,
} from 'bluesquare-components';
import ConfirmDialog from '../../../../components/dialogs/ConfirmDialogComponent';
import InstanceDetailsInfos from '../InstanceDetailsInfos';
import InstanceDetailsField from '../InstanceDetailsField';

import { getOrgUnitsTree } from '../../../orgUnits/utils';
import { baseUrls } from '../../../../constants/urls';

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
    },
}));

type Props = {
    // eslint-disable-next-line no-unused-vars
    replaceLocation?: (instance: Instance) => void;
    displayUseLocation?: boolean;
};

export const InstancePopupComponent: FunctionComponent<Props> = ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    replaceLocation = () => {},
    displayUseLocation = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup: any = useRef();
    const currentInstance = useSelector(
        (state: any) => state.instances.current,
    );

    const confirmDialog = useCallback(() => {
        replaceLocation(currentInstance);
        popup.current.leafletElement.options.leaflet.map.closePopup();
    }, [currentInstance, replaceLocation]);

    const hasHero = (currentInstance?.files?.length ?? 0) > 0;

    const orgUnitTree: any[] = useMemo(() => {
        if (currentInstance?.org_unit) {
            return getOrgUnitsTree(currentInstance.org_unit).reverse();
        }
        return [];
    }, [currentInstance.org_unit]);

    return (
        <Popup className={classes.popup} ref={popup}>
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
                                <Button
                                    className={classes.marginLeft}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                >
                                    <Link
                                        target="_blank"
                                        to={`${baseUrls.instanceDetail}/instanceId/${currentInstance.id}`}
                                        className={classes.linkButton}
                                    >
                                        <FormattedMessage {...MESSAGES.see} />
                                    </Link>
                                </Button>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Popup>
    );
};
