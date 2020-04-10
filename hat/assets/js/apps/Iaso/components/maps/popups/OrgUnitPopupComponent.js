import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import {
    Popup,
} from 'react-leaflet';
import { injectIntl, FormattedMessage } from 'react-intl';

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

import LoadingSpinner from '../../LoadingSpinnerComponent';
import PopupItemComponent from './PopupItemComponent';
import ConfirmDialog from '../../dialogs/ConfirmDialogComponent';

import { createUrl } from '../../../../../utils/fetchData';
import { textPlaceholder } from '../../../constants/uiConstants';

import commonStyles from '../../../styles/common';
import mapPopupStyles from '../../../styles/mapPopup';
import { orgUnitsDetailsPath } from '../../../constants/paths';

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

const MESSAGES = {
    name: {
        id: 'iaso.label.name',
        defaultMessage: 'Name',
    },
    source: {
        id: 'iaso.label.source',
        defaultMessage: 'Source',
    },
    type: {
        id: 'iaso.label.type',
        defaultMessage: 'Type',
    },
    parent: {
        id: 'iaso.label.parent',
        defaultMessage: 'Parent',
    },
    groups: {
        id: 'iaso.label.groups',
        defaultMessage: 'Groups',
    },
    created_at: {
        id: 'iaso.instance.created_at',
        defaultMessage: 'Created at',
    },
    latitude: {
        id: 'iaso.label.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'iaso.label.longitude',
        defaultMessage: 'Longitude',
    },
    associate: {
        id: 'iaso.label.useOrgUnitLocation.btn',
        defaultMessage: 'Use this location',
    },
    question: {
        id: 'iaso.label.useOrgUnitLocation.question',
        defaultMessage: 'Are you sure you want to use this location for the current org unit ?',
    },
    message: {
        id: 'iaso.label.useOrgUnitLocation.message',
        defaultMessage: 'Don\'t forget to save',
    },
};

class OrgUnitPopupComponent extends Component {
    constructor(props) {
        super(props);
        this.popup = React.createRef();
    }

    goToOrgUnit() {
        const { redirectTo, currentOrgUnit } = this.props;
        const newParams = {
            orgUnitId: currentOrgUnit.id,
            tab: 'infos',
        };
        redirectTo(orgUnitsDetailsPath.baseUrl, newParams);
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
            intl: {
                formatMessage,
            },
        } = this.props;
        let groups = null;
        if (currentOrgUnit && currentOrgUnit.groups.length > 0) {
            groups = currentOrgUnit.groups.map(g => g.name).join(', ');
        }
        return (
            <Popup className={classes.popup} ref={this.popup}>
                {
                    !currentOrgUnit
                    && <LoadingSpinner />
                }
                {
                    currentOrgUnit
                    && (
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
                                    value={currentOrgUnit.parent ? currentOrgUnit.parent.name : textPlaceholder}
                                />
                                {
                                    !currentOrgUnit.has_geo_json && (
                                        <Fragment>
                                            <PopupItemComponent
                                                label={formatMessage(MESSAGES.latitude)}
                                                value={currentOrgUnit.latitude}
                                            />
                                            <PopupItemComponent
                                                label={formatMessage(MESSAGES.longitude)}
                                                value={currentOrgUnit.longitude}
                                            />
                                        </Fragment>
                                    )
                                }
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.created_at)}
                                    value={moment.unix(currentOrgUnit.created_at).format('DD/MM/YYYY HH:mm')}
                                />
                                <Box className={classes.actionBox}>
                                    <Grid
                                        container
                                        spacing={0}
                                        justify={displayUseLocation ? 'center' : 'flex-end'}
                                        alignItems="center"
                                    >
                                        {
                                            displayUseLocation
                                            && (
                                                <ConfirmDialog
                                                    btnMessage={formatMessage(MESSAGES.associate)}
                                                    question={formatMessage(MESSAGES.question)}
                                                    message={formatMessage(MESSAGES.message)}
                                                    confirm={() => this.confirmDialog()}
                                                />
                                            )
                                        }
                                        <Button
                                            className={classes.marginLeft}
                                            variant="outlined"
                                            size="small"
                                            color="primary"
                                            onClick={() => this.goToOrgUnit()}
                                        >
                                            <FormattedMessage id="iaso.label.see" defaultMessage="See" />
                                        </Button>
                                    </Grid>
                                </Box>
                            </CardContent>
                        </Card>
                    )
                }
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
    redirectTo: PropTypes.func.isRequired,
    displayUseLocation: PropTypes.bool,
    useLocation: PropTypes.func,
};

const MapStateToProps = state => ({
    currentOrgUnit: state.orgUnits.currentSubOrgUnit,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitPopupComponent)),
);
