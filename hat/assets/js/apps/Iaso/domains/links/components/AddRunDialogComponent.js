import React, { Fragment, Component } from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import Add from '@mui/icons-material/Add';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
} from '@mui/material';
import { withStyles } from '@mui/styles';

import { injectIntl, commonStyles } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme.spacing(2),
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
});

const getVersions = (sources, sourceId) => {
    const source = sources.find(s => s.id === parseInt(sourceId, 10));
    const versions = source && sourceId ? source.versions : [];
    return versions;
};

class AddRunDialogComponent extends Component {
    // TODO: could use the new base ConfirmCancelDialogComponent
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

    handleClose(isAccepted) {
        const { executeRun } = this.props;
        const runItem = {
            ...this.state,
        };
        delete runItem.open;
        this.toggleDialog();
        if (isAccepted) {
            executeRun(runItem);
        }
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

    render() {
        const {
            classes,
            algorithms,
            sourcesList,
            intl: { formatMessage },
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
            <>
                <Button
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={() => this.toggleDialog()}
                >
                    <Add className={classes.buttonIcon} />
                    <FormattedMessage {...MESSAGES.addRun} />
                </Button>
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={open}
                    classes={{
                        paper: classes.paper,
                    }}
                    onClose={(event, reason) => {
                        if (reason === 'backdropClick') {
                            this.toggleDialog();
                        }
                    }}
                    scroll="body"
                >
                    <DialogTitle className={classes.title}>
                        <FormattedMessage {...MESSAGES.addRun} />
                    </DialogTitle>
                    <DialogContent className={classes.content}>
                        <Grid
                            container
                            spacing={2}
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="algoId"
                                    onChange={(key, value) =>
                                        this.onChange('algoId', value)
                                    }
                                    value={algoId}
                                    type="select"
                                    options={algorithms.map(a => ({
                                        label: a.description,
                                        value: a.id,
                                    }))}
                                    label={MESSAGES.algorithm}
                                />
                            </Grid>
                        </Grid>
                        <Grid
                            container
                            spacing={2}
                            alignItems="center"
                            justifyContent="flex-start"
                        >
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="sourceOriginId"
                                    onChange={(key, value) =>
                                        this.onChange('sourceOriginId', value)
                                    }
                                    value={sourceOriginId}
                                    type="select"
                                    options={
                                        sourcesList
                                            ? sourcesList.map(s => ({
                                                  label: s.name,
                                                  value: s.id,
                                              }))
                                            : []
                                    }
                                    label={MESSAGES.sourceorigin}
                                />
                                <InputComponent
                                    multi={false}
                                    clearable
                                    disabled={!sourceOriginId}
                                    keyValue="versionOrigin"
                                    onChange={(key, value) =>
                                        this.onChange(
                                            'versionOrigin',
                                            `${value}`,
                                        )
                                    }
                                    value={versionOrigin}
                                    type="select"
                                    options={(sourceOriginId
                                        ? getVersions(
                                              sourcesList,
                                              sourceOriginId,
                                          )
                                        : []
                                    ).map(v => ({
                                        label: `${formatMessage(
                                            MESSAGES.version,
                                        )} ${v.number}`,
                                        value: v.number,
                                    }))}
                                    label={MESSAGES.sourceoriginversion}
                                />
                            </Grid>
                            <Grid xs={6} item>
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="sourceDestinationId"
                                    onChange={(key, value) =>
                                        this.onChange(
                                            'sourceDestinationId',
                                            value,
                                        )
                                    }
                                    value={sourceDestinationId}
                                    type="select"
                                    options={
                                        sourcesList
                                            ? sourcesList.map(s => ({
                                                  label: s.name,
                                                  value: s.id,
                                              }))
                                            : []
                                    }
                                    label={MESSAGES.sourcedestination}
                                />
                                <InputComponent
                                    multi={false}
                                    clearable
                                    disabled={!sourceDestinationId}
                                    keyValue="versionDestination"
                                    onChange={(key, value) =>
                                        this.onChange(
                                            'versionDestination',
                                            `${value}`,
                                        )
                                    }
                                    value={versionDestination}
                                    type="select"
                                    options={(sourceDestinationId
                                        ? getVersions(
                                              sourcesList,
                                              sourceDestinationId,
                                          )
                                        : []
                                    ).map(v => ({
                                        label: `${formatMessage(
                                            MESSAGES.version,
                                        )} ${v.number}`,
                                        value: v.number,
                                    }))}
                                    label={MESSAGES.sourcedestinationversion}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions className={classes.action}>
                        <Button
                            onClick={() => this.handleClose(false)}
                            color="primary"
                        >
                            <FormattedMessage {...MESSAGES.cancel} />
                        </Button>
                        <Button
                            onClick={() => this.handleClose(true)}
                            disabled={
                                !algoId ||
                                !sourceOriginId ||
                                !versionOrigin ||
                                !sourceDestinationId ||
                                !versionDestination
                            }
                            color="primary"
                            autoFocus
                        >
                            <FormattedMessage {...MESSAGES.execute} />
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
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
