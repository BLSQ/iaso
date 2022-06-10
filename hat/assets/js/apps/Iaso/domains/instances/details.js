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
    injectIntl,
    commonStyles,
    LoadingSpinner,
    IconButton as IconButtonComponent,
    ExportButton as ExportButtonComponent,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import {
    setCurrentInstance as setCurrentInstanceAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
    fetchEditUrl as fetchEditUrlAction,
    softDeleteInstance as softDeleteAction,
    restoreInstance as restoreInstanceAction,
    reAssignInstance as reAssignInstanceAction,
} from './actions';
import { redirectToReplace as redirectToReplaceAction } from '../../routing/actions';

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
import { userHasPermission } from '../users/utils';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import { fetchFormOrgUnitTypes } from '../../utils/requests';

const styles = theme => ({
    ...commonStyles(theme),
    alert: {
        marginBottom: theme.spacing(4),
    },
});

const actions = ({
    currentInstance,
    reAssignInstance,
    orgUnitTypes,
    canEditEnketo,
}) => {
    const enketoAction = {
        id: 'instanceEditAction',
        icon: <EnketoIcon />,
        disabled: currentInstance && currentInstance.deleted,
    };
    const defaultActions = [
        {
            id: 'instanceExportAction',
            icon: (
                <ExportInstancesDialogComponent
                    renderTrigger={(openDialog, isInstancesFilterUpdated) => (
                        <ExportButtonComponent
                            onClick={openDialog}
                            isDisabled={isInstancesFilterUpdated}
                            batchExport={false}
                        />
                    )}
                    getFilters={() => ({
                        form_id: currentInstance.form_id,
                        search: `ids:${currentInstance.id}`,
                    })}
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
                    orgUnitTypes={orgUnitTypes}
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
    if (canEditEnketo) {
        return [enketoAction, ...defaultActions];
    }
    return defaultActions;
};

class InstanceDetails extends Component {
    constructor(props) {
        super(props);
        props.setCurrentInstance(null);
        this.state = {
            orgUnitTypeIds: [],
            showDial: true,
        };
    }

    componentDidMount() {
        const {
            params: { instanceId },
            fetchInstanceDetail,
            dispatch,
        } = this.props;
        fetchInstanceDetail(instanceId).then(instanceDetails => {
            fetchFormOrgUnitTypes(dispatch, instanceDetails.form_id).then(
                orgUnitTypeIds => {
                    this.setState({
                        ...this.state,
                        orgUnitTypeIds: orgUnitTypeIds.org_unit_type_ids,
                    });
                },
            );
        });
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

    onLigthBoxToggled(open) {
        this.setState({
            showDial: !open,
        });
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
            currentUser,
        } = this.props;

        const { showDial } = this.state;

        const canEditEnketo = userHasPermission(
            'iaso_update_submission',
            currentUser,
        );
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
                                formIds: currentInstance.form_id,
                            });
                        }
                    }}
                />
                {fetching && <LoadingSpinner />}
                {currentInstance && (
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        {showDial && (
                            <SpeedDialInstanceActions
                                actions={actions({
                                    currentInstance,
                                    reAssignInstance,
                                    orgUnitTypeIds: this.state.orgUnitTypeIds,
                                    canEditEnketo,
                                })}
                                onActionSelected={action =>
                                    this.onActionSelected(action)
                                }
                            />
                        )}
                        <Grid container spacing={4}>
                            <Grid xs={12} md={4} item>
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
                                    id="infos"
                                >
                                    <InstanceDetailsInfos
                                        currentInstance={currentInstance}
                                    />
                                </WidgetPaper>
                                <WidgetPaper
                                    title={formatMessage(MESSAGES.location)}
                                    id="location"
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
                                        id="files"
                                    >
                                        <InstancesFilesList
                                            fetchDetails={false}
                                            instanceDetail={currentInstance}
                                            files={getInstancesFilesList([
                                                currentInstance,
                                            ])}
                                            onLigthBoxToggled={open =>
                                                this.onLigthBoxToggled(open)
                                            }
                                        />
                                    </WidgetPaper>
                                )}
                            </Grid>

                            <Grid xs={12} md={8} item>
                                <WidgetPaper
                                    id="form-contents"
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
    currentUser: null,
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
    currentUser: PropTypes.object,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
    currentInstance: state.instances.current,
    prevPathname: state.routerCustom.prevPathname,
    currentUser: state.users.current,
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
