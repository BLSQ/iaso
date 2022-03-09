import React, { createRef } from 'react';
import { useSelector } from 'react-redux';

import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
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

import moment from 'moment';

import {
    textPlaceholder,
    useSafeIntl,
    LoadingSpinner,
    commonStyles,
    mapPopupStyles,
} from 'bluesquare-components';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...mapPopupStyles(theme),
    fileList: {
        listStyleType: 'none',
    },
    fileListItem: {
        padding: theme.spacing(1, 1, 1, 0),
        display: 'inline-block',
    },
    fileItem: {
        display: 'inline-block',
    },
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    titleMessage: {
        fontSize: 16,
        marginBottom: theme.spacing(1),
    },
    popupCardContentWithTitle: {
        marginTop: theme.spacing(1),
    },
}));

const OrgUnitPopupComponent = ({
    displayUseLocation,
    useLocation,
    titleMessage,
    currentOrgUnit,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const popup = createRef();
    const reduxCurrentOrgUnit = useSelector(
        state => state.orgUnits.currentSubOrgUnit,
    );
    const ou = currentOrgUnit || reduxCurrentOrgUnit;
    const confirmDialog = () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useLocation(ou);
        popup.current.leafletElement.options.leaflet.map.closePopup();
    };
    let groups = null;
    if (ou && ou.groups.length > 0) {
        groups = ou.groups.map(g => g.name).join(', ');
    }
    return (
        <Popup className={classes.popup} ref={popup}>
            {!ou && <LoadingSpinner />}
            {ou && (
                <Card className={classes.popupCard}>
                    <CardContent
                        className={classNames(
                            classes.popupCardContent,
                            titleMessage && classes.popupCardContentWithTitle,
                        )}
                    >
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
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.name)}
                            value={ou.name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.type)}
                            value={ou.org_unit_type_name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.groups)}
                            value={groups}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.source)}
                            value={ou.source}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.parent)}
                            value={ou.parent ? ou.parent.name : textPlaceholder}
                        />
                        {!ou.has_geo_json && (
                            <>
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={ou.latitude}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={ou.longitude}
                                />
                            </>
                        )}
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.created_at)}
                            value={moment.unix(ou.created_at).format('LTS')}
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
                                        confirm={() => confirmDialog()}
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
                                        to={`${baseUrls.orgUnitDetails}/orgUnitId/${ou.id}/tab/infos`}
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

OrgUnitPopupComponent.defaultProps = {
    currentOrgUnit: null,
    displayUseLocation: false,
    useLocation: () => {},
    titleMessage: null,
};

OrgUnitPopupComponent.propTypes = {
    currentOrgUnit: PropTypes.object,
    displayUseLocation: PropTypes.bool,
    useLocation: PropTypes.func,
    titleMessage: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default OrgUnitPopupComponent;
