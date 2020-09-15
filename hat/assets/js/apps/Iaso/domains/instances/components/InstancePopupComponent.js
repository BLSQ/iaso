import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Popup } from 'react-leaflet';
import { injectIntl } from 'react-intl';

import {
    withStyles,
    Card,
    CardMedia,
    CardContent,
    Grid,
    Box,
} from '@material-ui/core';
import AttachFile from '@material-ui/icons/AttachFile';

import PropTypes from 'prop-types';
import moment from 'moment';

import LoadingSpinner from '../../../components/LoadingSpinnerComponent';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';

import commonStyles from '../../../styles/common';
import mapPopupStyles from '../../../styles/mapPopup';

import { getOrgUnitsTree } from '../../orgUnits/utils';

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

class InstancePopupComponent extends Component {
    constructor(props) {
        super(props);
        this.popup = React.createRef();
    }

    confirmDialog() {
        this.props.useLocation(this.props.currentInstance);
        this.popup.current.leafletElement.options.leaflet.map.closePopup();
    }

    render() {
        const {
            classes,
            currentInstance,
            intl: { formatMessage },
            displayUseLocation,
        } = this.props;
        let hasHero = false;
        if (currentInstance) {
            hasHero = currentInstance.files && currentInstance.files.length > 0;
        }
        let orgUnitTree = [];
        if (currentInstance && currentInstance.org_unit) {
            orgUnitTree = getOrgUnitsTree(currentInstance.org_unit);
            orgUnitTree = orgUnitTree.reverse();
        }
        return (
            <Popup className={classes.popup} ref={this.popup}>
                {!currentInstance && <LoadingSpinner />}
                {currentInstance && (
                    <Card className={classes.popupCard}>
                        {hasHero && (
                            <CardMedia
                                className={classes.popupCardMedia}
                                image={currentInstance.files[0]}
                                href={currentInstance.files[0]}
                            />
                        )}
                        <CardContent className={classes.popupCardContent}>
                            {orgUnitTree.map(o => (
                                <PopupItemComponent
                                    key={o.id}
                                    label={o.org_unit_type_name}
                                    value={o ? o.name : null}
                                />
                            ))}
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
                                value={moment
                                    .unix(currentInstance.created_at)
                                    .format('DD/MM/YYYY HH:mm')}
                            />
                            <PopupItemComponent
                                label={formatMessage(MESSAGES.files)}
                                value={
                                    <ul className={classes.fileList}>
                                        <li>
                                            <a
                                                className={classes.fileItem}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={currentInstance.file_url}
                                            >
                                                {currentInstance.file_name}
                                            </a>
                                        </li>
                                        {currentInstance.files.map(f => (
                                            <li
                                                className={classes.fileListItem}
                                                key={f}
                                            >
                                                <a
                                                    className={classes.fileItem}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={f}
                                                >
                                                    <AttachFile />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                }
                            />
                            {displayUseLocation && (
                                <Box className={classes.actionBox}>
                                    <Grid
                                        container
                                        spacing={0}
                                        justify="center"
                                        alignItems="center"
                                    >
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
                                            confirm={() => this.confirmDialog()}
                                        />
                                    </Grid>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Popup>
        );
    }
}
InstancePopupComponent.defaultProps = {
    currentInstance: null,
    displayUseLocation: false,
    useLocation: () => {},
};

InstancePopupComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    currentInstance: PropTypes.object,
    displayUseLocation: PropTypes.bool,
    useLocation: PropTypes.func,
};

const MapStateToProps = state => ({
    currentInstance: state.instances.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(
    connect(
        MapStateToProps,
        MapDispatchToProps,
    )(injectIntl(InstancePopupComponent)),
);
