/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DeleteIcon from '@material-ui/icons/Delete';
import UpdateIcon from '@material-ui/icons/Update';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Alert from '@material-ui/lab/Alert';
import { withStyles, Box, Grid, DialogContentText } from '@material-ui/core';

import PropTypes from 'prop-types';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import {
    injectIntl,
    commonStyles,
    LoadingSpinner,
    IconButton as IconButtonComponent,
    ExportButton as ExportButtonComponent,
} from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import omit from 'lodash/omit';
import TopBar from '../../components/nav/TopBarComponent';
import {
    setCurrentInstance as setCurrentInstanceAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
    fetchEditUrl as fetchEditUrlAction,
    softDeleteInstance as softDeleteAction,
    restoreInstance as restoreInstanceAction,
    reAssignInstance as reAssignInstanceAction,
} from './actions';
import {
    redirectToReplace as redirectToReplaceAction,
    redirectTo as redirectToAction,
} from '../../routing/actions';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';

import InstanceDetailsInfos from './components/InstanceDetailsInfos';
import InstanceDetailsLocation from './components/InstanceDetailsLocation';
import InstanceDetailsExportRequests from './components/InstanceDetailsExportRequests';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstanceFileContent from './components/InstanceFileContent';
import SpeedDialInstanceActions from './components/SpeedDialInstanceActions';
import ExportInstancesDialogComponent from './components/ExportInstancesDialogComponent';
import ConfirmCancelDialogComponent from '../../components/dialogs/ConfirmCancelDialogComponent';
import EnketoIcon from './components/EnketoIcon';
import { getInstancesFilesList } from './utils';
import { userHasPermission } from '../users/utils';
import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import {
    fetchFormOrgUnitTypes,
    saveOrgUnitWithDispatch,
} from '../../utils/requests';

const styles = theme => ({
    ...commonStyles(theme),
    alert: {
        marginBottom: theme.spacing(4),
    },
});

const initialFormState = (orgUnit, referenceSubmissionId) => {
    return {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit?.org_unit_type_id ?? undefined,
        groups: orgUnit.groups.map(g => g) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
        reference_instance_id: referenceSubmissionId,
    };
};

const linkOrLinkOffOrgUnitToReferenceSubmission = (
    orgUnit,
    referenceSubmissionId,
    redirectToActionInstance,
    formId,
    instanceId,
    referenceFormId,
) => {
    const currentOrgUnit = orgUnit;
    const newOrgUnit = initialFormState(orgUnit, referenceSubmissionId);
    let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });

    orgUnitPayload = {
        ...orgUnitPayload,
        groups:
            orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                ? orgUnitPayload.groups
                : orgUnitPayload.groups.map(g => g.id),
    };
    saveOrgUnitWithDispatch(orgUnitPayload).then(ou => {
        const url = `${baseUrls.orgUnitDetails}/orgUnitId/${ou.id}/formId/${formId}/referenceFormId/${referenceFormId}/instanceId/${instanceId}`;
        redirectToActionInstance(url, {});
    });
};

const actions = ({
    currentInstance,
    reAssignInstance,
    orgUnitTypes,
    canEditEnketo,
    formId,
    params,
    currentUser,
    redirectToActionInstance,
}) => {
    const hasSubmissionPermission = userHasPermission(
        'iaso_submissions',
        currentUser,
    );
    const enketoAction = {
        id: 'instanceEditAction',
        icon: <EnketoIcon />,
        disabled: currentInstance && currentInstance.deleted,
    };
    const { referenceFormId } = params;
    const referenceSubmission = currentInstance.org_unit.reference_instance_id;
    const linkOrgUnit =
        formId !== referenceFormId && referenceSubmission !== null;
    const orgUnitToReferenceSubmission = instance => {
        return linkOrLinkOffOrgUnitToReferenceSubmission(
            currentInstance.org_unit,
            instance,
            redirectToActionInstance,
            formId,
            currentInstance.id,
            referenceFormId,
        );
    };

    const confirmCancelTitleMessage = isItLinked => {
        return isItLinked
            ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
            : MESSAGES.linkOrgUnitToInstanceReferenceTitle;
    };

    const renderTrigger = (isLinked, openDialog) => {
        return isLinked ? (
            <LinkOffIcon onClick={openDialog} />
        ) : (
            <LinkIcon onClick={openDialog} />
        );
    };
    let defaultActions = [
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
        defaultActions = [enketoAction, ...defaultActions];
    }

    if (!hasSubmissionPermission) return defaultActions;

    if (formId.toString() !== referenceFormId) return defaultActions;

    return [
        ...defaultActions,
        {
            id: linkOrgUnit
                ? 'linkOffOrgUnitReferenceSubmission'
                : 'linkOrgUnitReferenceSubmission',
            icon: (
                <ConfirmCancelDialogComponent
                    titleMessage={confirmCancelTitleMessage(linkOrgUnit)}
                    onConfirm={() =>
                        linkOrgUnit
                            ? orgUnitToReferenceSubmission(null)
                            : orgUnitToReferenceSubmission(currentInstance.id)
                    }
                    renderTrigger={({ openDialog }) =>
                        renderTrigger(linkOrgUnit, openDialog)
                    }
                >
                    <DialogContentText id="alert-dialog-description">
                        <FormattedMessage
                            id="iaso.instance.linkOrgUnitToInstanceReferenceWarning"
                            defaultMessage="This operation can still be undone"
                            {...MESSAGES.linkOrgUnitToInstanceReferenceWarning}
                        />
                    </DialogContentText>
                </ConfirmCancelDialogComponent>
            ),
        },
    ];
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
            params,
            redirectToActionInstance,
        } = this.props;
        const { showDial } = this.state;
        const formId = currentInstance?.form_id;
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
                                    formId,
                                    params,
                                    currentUser,
                                    redirectToActionInstance,
                                })}
                                onActionSelected={action =>
                                    this.onActionSelected(action)
                                }
                            />
                        )}
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

                            <Grid xs={12} md={7} item>
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
            redirectToActionInstance: redirectToAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstanceDetails)),
);
