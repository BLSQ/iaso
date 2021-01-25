import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DeleteIcon from '@material-ui/icons/Delete';
import UpdateIcon from '@material-ui/icons/Update';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Alert from '@material-ui/lab/Alert';
import { withStyles, Box, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    setCurrentInstance as setCurrentInstanceAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
    fetchEditUrl as fetchEditUrlAction,
    softDeleteInstance as softDeleteAction,
    restoreInstance as restoreInstanceAction,
    reAssignInstance as reAssignInstanceAction,
} from './actions';
import { redirectToReplace as redirectToReplaceAction } from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';

import InstanceDetailsInfos from './components/InstanceDetailsInfos';
import InstanceDetailsLocation from './components/InstanceDetailsLocation';
import InstanceDetailsExportRequests from './components/InstanceDetailsExportRequests';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstanceFileContent from './components/InstanceFileContent';
import SpeedDialInstanceActions from './components/SpeedDialInstanceActions';
import ExportInstancesDialogComponent from './components/ExportInstancesDialogComponent';
import EnketoIcon from './components/EnketoIcon';
import { getInstancesFilesList } from './utils';

import MESSAGES from './messages';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/urls';
import injectIntl from '../../libs/intl/injectIntl';

const styles = theme => ({
    ...commonStyles(theme),
    alert: {
        marginBottom: theme.spacing(4),
    },
});

const actions = (currentInstance, reAssignInstance) => [
    {
        id: 'instanceEditAction',
        icon: <EnketoIcon />,
        disabled: currentInstance && currentInstance.deleted,
    },
    {
        id: 'instanceExportAction',
        icon: (
            <ExportInstancesDialogComponent
                getFilters={() => ({
                    form_id: currentInstance.form_id,
                    search: `ids:${currentInstance.id}`,
                })}
                batchExport={false}
            />
        ),
        disabled: currentInstance && currentInstance.deleted,
    },
    {
        id: 'instanceReAssignAction',
        icon: (
            <CreateReAssignDialogComponent
                titleMessage={MESSAGES.reAssignInstance}
                confirmMessage={MESSAGES.reAssignInstanceAction}
                currentInstance={currentInstance}
                onCreateOrReAssign={reAssignInstance}
                renderTrigger={({ openDialog }) => (
                    <UpdateIcon onClick={openDialog} />
                )}
            />
        ),
        disabled: currentInstance && currentInstance.deleted,
    },
    {
        id:
            currentInstance && currentInstance.deleted
                ? 'instanceRestoreAction'
                : 'instanceDeleteAction',
        icon:
            currentInstance && currentInstance.deleted ? (
                <RestoreFromTrashIcon />
            ) : (
                <DeleteIcon />
            ),
        disabled: false,
    },
];

class InstanceDetails extends Component {
    constructor(props) {
        super(props);
        props.setCurrentInstance(null);
    }

    componentDidMount() {
        const {
            params: { instanceId },
            fetchInstanceDetail,
        } = this.props;
        fetchInstanceDetail(instanceId);
    }

    onActionSelected(action) {
        if (action.id === 'instanceEditAction' && this.props.currentInstance) {
            this.props.fetchEditUrl(
                this.props.currentInstance,
                window.location,
            );
        }

        if (
            action.id === 'instanceDeleteAction' &&
            this.props.currentInstance
        ) {
            this.props.softDelete(this.props.currentInstance);
        }
        if (
            action.id === 'instanceRestoreAction' &&
            this.props.currentInstance
        ) {
            this.props.restoreInstance(this.props.currentInstance);
        }
    }

    render() {
        const {
            classes,
            fetching,
            currentInstance,
            reAssignInstance,
            intl: { formatMessage },
            router,
            prevPathname,
            redirectToReplace,
        } = this.props;
        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    title={
                        currentInstance
                            ? `${
                                  currentInstance.form_name
                              }: ${currentInstance.file_name.replace(
                                  '.xml',
                                  '',
                              )}`
                            : ''
                    }
                    displayBackButton
                    goBack={() => {
                        if (prevPathname || !currentInstance) {
                            router.goBack();
                        } else {
                            redirectToReplace(baseUrls.instances, {
                                formId: currentInstance.form_id,
                            });
                        }
                    }}
                />
                {fetching && <LoadingSpinner />}
                {currentInstance && (
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <SpeedDialInstanceActions
                            actions={actions(currentInstance, reAssignInstance)}
                            onActionSelected={action =>
                                this.onActionSelected(action)
                            }
                        />
                        <Grid container spacing={4}>
                            <Grid xs={12} md={5} item>
                                {currentInstance.deleted && (
                                    <Alert
                                        severity="warning"
                                        className={classes.alert}
                                    >
                                        {formatMessage(
                                            MESSAGES.warningSoftDeleted,
                                        )}
                                        <br />
                                        {formatMessage(
                                            MESSAGES.warningSoftDeletedExport,
                                        )}
                                        <br />
                                        {formatMessage(
                                            MESSAGES.warningSoftDeletedDerived,
                                        )}
                                        <br />
                                    </Alert>
                                )}
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.infos)}
                                    padded
                                >
                                    <InstanceDetailsInfos
                                        currentInstance={currentInstance}
                                    />
                                </WidgetPaper>
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.location)}
                                >
                                    <InstanceDetailsLocation
                                        currentInstance={currentInstance}
                                    />
                                </WidgetPaper>
                                <InstanceDetailsExportRequests
                                    currentInstance={currentInstance}
                                    classes={classes}
                                />
                                {currentInstance.files.length > 0 && (
                                    <WidgetPaper
                                        title={formatMessage(MESSAGES.files)}
                                        padded
                                    >
                                        <InstancesFilesList
                                            fetchDetails={false}
                                            instanceDetail={currentInstance}
                                            files={getInstancesFilesList([
                                                currentInstance,
                                            ])}
                                        />
                                    </WidgetPaper>
                                )}
                            </Grid>

                            <Grid xs={12} md={7} item>
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.form)}
                                    IconButton={IconButtonComponent}
                                    iconButtonProps={{
                                        onClick: () =>
                                            window.open(
                                                currentInstance.file_url,
                                                '_blank',
                                            ),
                                        icon: 'xml',
                                        color: 'secondary',
                                        tooltipMessage: MESSAGES.downloadXml,
                                    }}
                                >
                                    <InstanceFileContent
                                        instance={currentInstance}
                                    />
                                </WidgetPaper>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </section>
        );
    }
}

InstanceDetails.defaultProps = {
    prevPathname: null,
    currentInstance: null,
};

InstanceDetails.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetching: PropTypes.bool.isRequired,
    router: PropTypes.object.isRequired,
    redirectToReplace: PropTypes.func.isRequired,
    prevPathname: PropTypes.any,
    currentInstance: PropTypes.object,
    fetchInstanceDetail: PropTypes.func.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
    fetchEditUrl: PropTypes.func.isRequired,
    softDelete: PropTypes.func.isRequired,
    restoreInstance: PropTypes.func.isRequired,
    reAssignInstance: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
    currentInstance: state.instances.current,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchInstanceDetail: fetchInstanceDetailAction,
            fetchEditUrl: fetchEditUrlAction,
            softDelete: softDeleteAction,
            restoreInstance: restoreInstanceAction,
            redirectToReplace: redirectToReplaceAction,
            setCurrentInstance: setCurrentInstanceAction,
            reAssignInstance: reAssignInstanceAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstanceDetails)),
);
