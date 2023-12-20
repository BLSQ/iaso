import React, { createRef } from 'react';
import { useSelector } from 'react-redux';

import PropTypes from 'prop-types';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
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
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        '&:hover': { textDecoration: 'none' },
    },
}));

const OrgUnitPopupComponent = ({
    displayUseLocation,
    replaceLocation,
    titleMessage,
    currentOrgUnit,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const popup = createRef();
    const reduxCurrentOrgUnit = useSelector(
        state => state.orgUnits.currentSubOrgUnit,
    );
    const activeOrgUnit = currentOrgUnit || reduxCurrentOrgUnit;
    const confirmDialog = () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        replaceLocation(activeOrgUnit);
        popup.current.leafletElement.options.leaflet.map.closePopup();
    };
    let groups = null;
    if (activeOrgUnit && activeOrgUnit.groups.length > 0) {
        groups = activeOrgUnit.groups.map(g => g.name).join(', ');
    }
    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            {!activeOrgUnit && <LoadingSpinner />}
            {activeOrgUnit && (
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
                            value={activeOrgUnit.name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.type)}
                            value={activeOrgUnit.org_unit_type_name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.groups)}
                            value={groups}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.source)}
                            value={activeOrgUnit.source}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.parent)}
                            value={
                                activeOrgUnit.parent
                                    ? activeOrgUnit.parent.name
                                    : textPlaceholder
                            }
                        />
                        {!activeOrgUnit.has_geo_json && (
                            <>
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={activeOrgUnit.latitude}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={activeOrgUnit.longitude}
                                />
                            </>
                        )}
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.created_at)}
                            value={moment
                                .unix(activeOrgUnit.created_at)
                                .format('LTS')}
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
                                <Link
                                    target="_blank"
                                    to={`${baseUrls.orgUnitDetails}/orgUnitId/${activeOrgUnit.id}/tab/infos`}
                                    className={classes.linkButton}
                                >
                                    <Button
                                        className={classes.marginLeft}
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                    >
                                        <FormattedMessage {...MESSAGES.see} />
                                    </Button>
                                </Link>
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
    replaceLocation: () => {},
    titleMessage: null,
};

OrgUnitPopupComponent.propTypes = {
    currentOrgUnit: PropTypes.object,
    displayUseLocation: PropTypes.bool,
    replaceLocation: PropTypes.func,
    titleMessage: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default OrgUnitPopupComponent;
