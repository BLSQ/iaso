import React, { Fragment, Component } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import Add from '@material-ui/icons/Add';
import {
    withStyles,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
} from '@material-ui/core';
import commonStyles from '../../styles/common';

import InputComponent from '../forms/InputComponent';

const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    content: {
        overflow: 'visible',
    },
});

const getVersions = (sources, sourceId) => {
    const source = sources.find(s => s.id === parseInt(sourceId, 10));
    const versions = source && sourceId ? source.versions : [];
    return versions;
};

class AddRunDialogComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            algoId: null,
            sourceOriginId: null,
            versionOrigin: null,
            sourceDestinationId: null,
            versionDestination: null,
        };
    }

    onChange(key, value) {
        const newState = {
            ...this.state,
        };
        newState[key] = value;
        this.setState(newState);
    }

    toggleDialog() {
        this.setState({
            open: !this.state.open,
        });
    }

    handleClose(isAccepted) {
        const {
            executeRun,
        } = this.props;
        const runItem = {
            ...this.state,
        };
        delete runItem.open;
        this.toggleDialog();
        if (isAccepted) {
            executeRun(runItem);
        }
    }

    render() {
        const {
            classes,
            algorithms,
            sourcesList,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            open,
            algoId,
            sourceOriginId,
            versionOrigin,
            sourceDestinationId,
            versionDestination,
        } = this.state;
        return (
            <Fragment>
                <Button
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={() => this.toggleDialog()}
                >
                    <Add className={classes.buttonIcon} />
                    <FormattedMessage
                        id="iaso.algo.addRun"
                        defaultMessage="Add algorithm run"
                    />
                </Button>
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={open}
                    classes={{
                        paper: classes.paper,
                    }}
                >
                    <DialogTitle>
                        <FormattedMessage
                            id="iaso.algo.addRun"
                            defaultMessage="Add algorithm run"
                        />
                    </DialogTitle>
                    <DialogContent className={classes.content}>
                        <Grid container spacing={2} alignItems="center" justify="flex-start">
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="algoId"
                                    onChange={(key, value) => this.onChange('algoId', value)}
                                    value={algoId}
                                    type="select"
                                    options={algorithms.map(a => ({
                                        label: a.name,
                                        value: a.id,
                                    }))}
                                    label={{
                                        id: 'iaso.label.algorithm',
                                        defaultMessage: 'Algorithm',
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} alignItems="center" justify="flex-start">
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="sourceOriginId"
                                    onChange={(key, value) => this.onChange('sourceOriginId', value)}
                                    value={sourceOriginId}
                                    type="select"
                                    options={sourcesList ? sourcesList.map(s => ({
                                        label: s.name,
                                        value: s.id,
                                    })) : []}
                                    label={{
                                        id: 'iaso.label.sourceorigin',
                                        defaultMessage: 'Origin source',
                                    }}
                                />
                                <InputComponent
                                    multi={false}
                                    clearable
                                    disabled={!sourceOriginId}
                                    keyValue="versionOrigin"
                                    onChange={(key, value) => this.onChange('versionOrigin', value)}
                                    value={versionOrigin}
                                    type="select"
                                    options={(sourceOriginId ? getVersions(sourcesList, sourceOriginId) : []).map(v => ({
                                        label: `${formatMessage({
                                            id: 'iaso.label.version',
                                            defaultMessage: 'Version',
                                        })} ${v.number}`,
                                        value: v.number,
                                    }))}
                                    label={{
                                        id: 'iaso.label.sourceoriginversion',
                                        defaultMessage: 'Origin source version',
                                    }}
                                />
                            </Grid>
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="sourceDestinationId"
                                    onChange={(key, value) => this.onChange('sourceDestinationId', value)}
                                    value={sourceDestinationId}
                                    type="select"
                                    options={sourcesList ? sourcesList.map(s => ({
                                        label: s.name,
                                        value: s.id,
                                    })) : []}
                                    label={{
                                        id: 'iaso.label.sourcedestination',
                                        defaultMessage: 'Destination source',
                                    }}
                                />
                                <InputComponent
                                    multi={false}
                                    clearable
                                    disabled={!sourceDestinationId}
                                    keyValue="versionDestination"
                                    onChange={(key, value) => this.onChange('versionDestination', value)}
                                    value={versionDestination}
                                    type="select"
                                    options={(sourceDestinationId
                                        ? getVersions(sourcesList, sourceDestinationId)
                                        : []).map(v => ({
                                        label: `${formatMessage({
                                            id: 'iaso.label.version',
                                            defaultMessage: 'Version',
                                        })} ${v.number}`,
                                        value: v.number,
                                    }))}
                                    label={{
                                        id: 'iaso.label.sourcedestinationversion',
                                        defaultMessage: 'Destination source version',
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.handleClose(false)} color="primary">
                            <FormattedMessage
                                id="iaso.label.cancel"
                                defaultMessage="Cancel"
                            />
                        </Button>
                        <Button
                            onClick={() => this.handleClose(true)}
                            disabled={(
                                !algoId
                                || !sourceOriginId
                                || !versionOrigin
                                || !sourceDestinationId
                                || !versionDestination
                            )}
                            color="primary"
                            autoFocus
                        >
                            <FormattedMessage
                                id="iaso.label.execute"
                                defaultMessage="Execute"
                            />
                        </Button>
                    </DialogActions>
                </Dialog>
            </Fragment>
        );
    }
}


AddRunDialogComponent.defaultProps = {
    sourcesList: [],
};

AddRunDialogComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    executeRun: PropTypes.func.isRequired,
    algorithms: PropTypes.array.isRequired,
    sourcesList: PropTypes.array,
};

const MapStateToProps = state => ({
    algorithms: state.links.algorithmsList,
    sourcesList: state.orgUnits.sources || [],
});

export default connect(MapStateToProps)(
    withStyles(styles)(injectIntl(AddRunDialogComponent)),
);
