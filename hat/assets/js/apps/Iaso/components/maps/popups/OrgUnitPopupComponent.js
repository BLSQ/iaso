import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Popup,
} from 'react-leaflet';
import { injectIntl } from 'react-intl';

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

import commonStyles from '../../../styles/common';
import mapPopupStyles from '../../../styles/mapPopup';

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
};

class OrgUnitPopupComponent extends Component {
    render() {
        const {
            classes,
            currentOrgUnit,
            itemId,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <Popup className={classes.popup}>
                {
                    !currentOrgUnit
                    && <LoadingSpinner />
                }
                {
                    currentOrgUnit
                    && currentOrgUnit.id === itemId
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
                                    label={formatMessage(MESSAGES.source)}
                                    value={currentOrgUnit.source}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.parent)}
                                    value={currentOrgUnit.parent ? currentOrgUnit.parent.name : '/'}
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
                                    <Grid container spacing={0} justify="flex-end" alignItems="center">
                                        <Button
                                            color="primary"
                                            href={`/dashboard/orgunits/detail/orgUnitId/${currentOrgUnit.id}/validated/true/backurl/${encodeURIComponent(window.location.pathname.replace(new RegExp('/', 'g'), '__'))}`}
                                        >
                                        Voir
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
};

OrgUnitPopupComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    currentOrgUnit: PropTypes.object,
    itemId: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    currentOrgUnit: state.orgUnits.currentSubOrgUnit,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitPopupComponent)),
);
