import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Popup,
} from 'react-leaflet';
import { injectIntl } from 'react-intl';

import {
    withStyles,
    Card,
    CardMedia,
    CardContent,
} from '@material-ui/core';
import AttachFile from '@material-ui/icons/AttachFile';

import PropTypes from 'prop-types';
import moment from 'moment';

import LoadingSpinner from '../../LoadingSpinnerComponent';
import PopupItemComponent from './PopupItemComponent';

import commonStyles from '../../../styles/common';
import mapPopupStyles from '../../../styles/mapPopup';

import { getOrgUnitsTree } from '../../../utils/orgUnitUtils';

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
});

const MESSAGES = {
    type: {
        id: 'iaso.label.type',
        defaultMessage: 'Type',
    },
    device: {
        id: 'iaso.instance.device',
        defaultMessage: 'IMEI device',
    },
    coordinate: {
        id: 'iaso.instance.coordinate',
        defaultMessage: 'Coordinates',
    },
    created_at: {
        id: 'iaso.instance.created_at',
        defaultMessage: 'Created at',
    },
    files: {
        id: 'iaso.instance.files',
        defaultMessage: 'Files',
    },
    latitude: {
        id: 'iaso.instance.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'iaso.instance.longitude',
        defaultMessage: 'Longitude',
    },
};

class InstancePopupComponent extends Component {
    render() {
        const {
            classes,
            currentInstance,
            itemId,
            intl: {
                formatMessage,
            },
        } = this.props;
        let hasHero = false;
        if (currentInstance && currentInstance.id === itemId) {
            hasHero = currentInstance.files && currentInstance.files.length > 0;
        }
        let orgUnitTree = [];
        if (currentInstance && currentInstance.org_unit) {
            orgUnitTree = getOrgUnitsTree(currentInstance.org_unit);
            orgUnitTree = orgUnitTree.reverse();
        }
        return (
            <Popup className={classes.popup}>
                {
                    !currentInstance
                    && <LoadingSpinner />
                }
                {
                    currentInstance
                    && currentInstance.id === itemId
                    && (
                        <Card className={classes.popupCard}>
                            {
                                hasHero
                                && (
                                    <CardMedia
                                        className={classes.popupCardMedia}
                                        image={currentInstance.files[0]}
                                        href={currentInstance.files[0]}
                                    />
                                )
                            }
                            <CardContent className={classes.popupCardContent}>
                                {
                                    orgUnitTree.map(o => (
                                        <PopupItemComponent
                                            key={o.id}
                                            label={o.org_unit_type_name}
                                            value={o ? o.name : null}
                                        />
                                    ))
                                }
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.device)}
                                    value={currentInstance.device_id}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={currentInstance.latitude}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={currentInstance.longitude}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.created_at)}
                                    value={moment.unix(currentInstance.created_at).format('DD/MM/YYYY HH:mm')}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.files)}
                                    value={(
                                        <ul className={classes.fileList}>
                                            <li>
                                                <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={currentInstance.file_url}>{currentInstance.file_name}</a>
                                            </li>
                                            {currentInstance.files.map(f => (
                                                <li className={classes.fileListItem} key={f}>
                                                    <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={f}>{<AttachFile />}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )
                }
            </Popup>
        );
    }
}
InstancePopupComponent.defaultProps = {
    currentInstance: null,
};

InstancePopupComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    currentInstance: PropTypes.object,
    itemId: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    currentInstance: state.instances.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstancePopupComponent)),
);
