import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Popup } from 'react-leaflet';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import {
    withStyles,
    Card,
    CardMedia,
    CardContent,
    Button,
    Grid,
    Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    injectIntl,
    commonStyles,
    mapPopupStyles,
    LoadingSpinner,
} from 'bluesquare-components';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import InstanceDetailsInfos from './InstanceDetailsInfos';
import InstanceDetailsField from './InstanceDetailsField';

import { getOrgUnitsTree } from '../../orgUnits/utils';
import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';

const styles = theme => ({
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
});

class InstancePopupComponent extends Component {
    constructor(props) {
        super(props);
        this.popup = React.createRef();
    }

    confirmDialog() {
        this.props.replaceLocation(this.props.currentInstance);
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
                            <InstanceDetailsInfos
                                currentInstance={currentInstance}
                                fieldsToHide={['device_id']}
                            />
                            {currentInstance.org_unit && (
                                <InstanceDetailsField
                                    label={formatMessage(MESSAGES.groups)}
                                    value={
                                        currentInstance.org_unit.groups &&
                                        currentInstance.org_unit.groups.length >
                                            0
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
                                        displayUseLocation
                                            ? 'center'
                                            : 'flex-end'
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
                                            confirm={() => this.confirmDialog()}
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
                                            <FormattedMessage
                                                {...MESSAGES.see}
                                            />
                                        </Link>
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
InstancePopupComponent.defaultProps = {
    currentInstance: null,
    displayUseLocation: false,
    replaceLocation: () => {},
};

InstancePopupComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    currentInstance: PropTypes.object,
    displayUseLocation: PropTypes.bool,
    replaceLocation: PropTypes.func,
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
