import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';

import { Popup } from 'react-leaflet';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';

import {
    withStyles,
    Card,
    CardContent,
    Button,
    Grid,
    Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import {
    textPlaceholder,
    injectIntl,
    LoadingSpinner,
    commonStyles,
    mapPopupStyles,
} from 'bluesquare-components';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';

const styles = theme => ({
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
});

class OrgUnitPopupComponent extends Component {
    constructor(props) {
        super(props);
        this.popup = React.createRef();
    }

    confirmDialog() {
        this.props.useLocation(this.props.currentOrgUnit);
        this.popup.current.leafletElement.options.leaflet.map.closePopup();
    }

    render() {
        const {
            classes,
            currentOrgUnit,
            displayUseLocation,
            intl: { formatMessage },
        } = this.props;
        let groups = null;
        if (currentOrgUnit && currentOrgUnit.groups.length > 0) {
            groups = currentOrgUnit.groups.map(g => g.name).join(', ');
        }
        return (
            <Popup className={classes.popup} ref={this.popup}>
                {!currentOrgUnit && <LoadingSpinner />}
                {currentOrgUnit && (
                    <Card className={classes.popupCard}>
                        <CardContent className={classes.popupCardContent}>
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.name)}
                                value={currentOrgUnit.name}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.type)}
                                value={currentOrgUnit.org_unit_type_name}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.groups)}
                                value={groups}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.source)}
                                value={currentOrgUnit.source}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.parent)}
                                value={
                                    currentOrgUnit.parent
                                        ? currentOrgUnit.parent.name
                                        : textPlaceholder
                                }
                            />
                            {!currentOrgUnit.has_geo_json && (
                                <>
                                    <PopupItemComponent
                                        label={formatMessage(MESSAGES.latitude)}
                                        value={currentOrgUnit.latitude}
                                    />
                                    <PopupItemComponent
                                        label={formatMessage(
                                            MESSAGES.longitude,
                                        )}
                                        value={currentOrgUnit.longitude}
                                    />
                                </>
                            )}
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.created_at)}
                                value={moment
                                    .unix(currentOrgUnit.created_at)
                                    .format('DD/MM/YYYY HH:mm')}
                            />
                            <Box className={classes.actionBox}>
                                <Grid
                                    container
                                    spacing={0}
                                    justify={
                                        displayUseLocation
                                            ? 'center'
                                            : 'flex-end'
                                    }
                                    alignItems="center"
                                >
                                    {displayUseLocation && (
                                        <Box mb={1}>
                                            <ConfirmDialog
                                                btnMessage={formatMessage(
                                                    MESSAGES.associate,
                                                )}
                                                question={formatMessage(
                                                    MESSAGES.question,
                                                )}
                                                message={formatMessage(
                                                    MESSAGES.message,
                                                )}
                                                confirm={() =>
                                                    this.confirmDialog()
                                                }
                                            />
                                        </Box>
                                    )}
                                    <Button
                                        className={classes.marginLeft}
                                        variant="outlined"
                                        size="small"
                                        color="primary"
                                    >
                                        <Link
                                            to={`${baseUrls.orgUnitDetails}/orgUnitId/${currentOrgUnit.id}`}
                                            className={classes.linkButton}
                                        >
                                            <FormattedMessage
                                                {...MESSAGES.see}
                                            />
                                        </Link>
                                    </Button>
                                    <Button
                                        className={classes.marginLeft}
                                        variant="outlined"
                                        size="small"
                                        color="primary"
                                    >
                                        Add comment
                                    </Button>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Popup>
        );
    }
}
OrgUnitPopupComponent.defaultProps = {
    currentOrgUnit: null,
    displayUseLocation: false,
    useLocation: () => {},
};

OrgUnitPopupComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    currentOrgUnit: PropTypes.object,
    displayUseLocation: PropTypes.bool,
    useLocation: PropTypes.func,
};

const MapStateToProps = state => ({
    currentOrgUnit: state.orgUnits.currentSubOrgUnit,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(
    connect(
        MapStateToProps,
        MapDispatchToProps,
    )(injectIntl(OrgUnitPopupComponent)),
);
