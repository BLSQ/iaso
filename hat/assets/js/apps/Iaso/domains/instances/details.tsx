/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { connect, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import DeleteIcon from '@material-ui/icons/Delete';
import UpdateIcon from '@material-ui/icons/Update';
import EditLocationIcon from '@material-ui/icons/EditLocation';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Alert from '@material-ui/lab/Alert';
import LockIcon from '@material-ui/icons/Lock';
import {
    withStyles,
    Box,
    Grid,
    DialogContentText,
    Typography,
    makeStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';

import {
    // @ts-ignore
    injectIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    ExportButton as ExportButtonComponent,
    // @ts-ignore
    useSafeIntl,
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
import InstanceDetailsLocksHistory from './components/InstanceDetailsLocksHistory';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstanceFileContent from './components/InstanceFileContent';
import SpeedDialInstanceActions from './components/SpeedDialInstanceActions';
import ExportInstancesDialogComponent from './components/ExportInstancesDialogComponent';
import ConfirmCancelDialogComponent from '../../components/dialogs/ConfirmCancelDialogComponent';
import EnketoIcon from './components/EnketoIcon';
import { getInstancesFilesList } from './utils';
import { userHasPermission } from '../users/utils';
import { getRequest } from '../../libs/Api';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import {
    fetchFormOrgUnitTypes,
    saveOrgUnitWithDispatch,
    lockInstanceWithDispatch,
} from '../../utils/requests';

import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../utils/featureFlags';
import { useCurrentUser } from '../../utils/usersUtils';
import { Instance } from './types/instance';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    alert: {
        marginBottom: theme.spacing(4),
    },
    labelContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
        top: 2,
    },
}));

const initialFormState = (orgUnit, value, key) => {
    const orgUnitCopy = {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit?.org_unit_type_id ?? undefined,
        groups: orgUnit.groups.map(g => g) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
    };

    if (key === 'gps') {
        orgUnitCopy.altitude = value.altitude;
        orgUnitCopy.latitude = value.latitude;
        orgUnitCopy.longitude = value.longitude;
    } else {
        orgUnitCopy.reference_instance_id = value;
    }
    return orgUnitCopy;
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
    const newOrgUnit = initialFormState(
        orgUnit,
        referenceSubmissionId,
        'instance_reference',
    );
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

const editGpsFromInstance = (instance, gps) => {
    const currentOrgUnit = instance.org_unit;
    const newOrgUnit = initialFormState(instance.org_unit, gps, 'gps');
    let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });

    orgUnitPayload = {
        ...orgUnitPayload,
        groups:
            orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                ? orgUnitPayload.groups
                : orgUnitPayload.groups.map(g => g.id),
    };
    saveOrgUnitWithDispatch(orgUnitPayload).then(() => {
        window.location.reload(false);
    });
    return null;
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
        'iaso_org_units',
        currentUser,
    );

    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );

    const enketoAction = {
        id: 'instanceEditAction',
        icon: <EnketoIcon />,
        disabled: currentInstance?.deleted,
    };

    const renderTriggerEditGps = openDialog => {
        return <EditLocationIcon onClick={openDialog} />;
    };

    const gpsEqual = instance => {
        const orgUnit = instance.org_unit;
        const formLat = instance?.latitude;
        const formLong = instance?.longitude;
        const formAltitude = instance?.altitude;
        return (
            formLat === orgUnit?.latitude &&
            formLong === orgUnit?.longitude &&
            formAltitude === orgUnit?.altitude
        );
    };

    const editLocationWithInstanceGps = {
        id: 'editLocationWithInstanceGps',
        icon: (
            <ConfirmCancelDialogComponent
                titleMessage={MESSAGES.editGpsFromInstanceTitle}
                onConfirm={() =>
                    editGpsFromInstance(currentInstance, {
                        altitude: currentInstance?.altitude,
                        latitude: currentInstance?.latitude,
                        longitude: currentInstance?.longitude,
                    })
                }
                renderTrigger={({ openDialog }) =>
                    renderTriggerEditGps(openDialog)
                }
            >
                <DialogContentText id="alert-dialog-description">
                    <FormattedMessage
                        defaultMessage="This operation can still be undone"
                        {...MESSAGES.editGpsFromInstanceWarning}
                    />
                </DialogContentText>
            </ConfirmCancelDialogComponent>
        ),
        disabled: false,
    };

    const deleteRestore = {
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
    };

    const confirmLockUnlockInstance = instance => {
        const instanceParams = {
            id: instance.id,
        };
        return lockInstanceWithDispatch(instanceParams);
    };

    const lockAction = {
        id: 'lockActionTooltip', // used by translation
        icon: (
            <ConfirmCancelDialogComponent
                titleMessage={MESSAGES.lockAction}
                onConfirm={closeDialog => {
                    confirmLockUnlockInstance(currentInstance).then(() => {
                        closeDialog();
                        window.location.reload(false);
                    });
                }}
                renderTrigger={({ openDialog }) => (
                    <LockIcon onClick={openDialog} />
                )}
            >
                <DialogContentText id="alert-dialog-description">
                    <FormattedMessage {...MESSAGES.lockActionDescription} />
                    <br />
                    {currentInstance.is_locked && (
                        <FormattedMessage
                            {...MESSAGES.lockActionExistingLockDescription}
                        />
                    )}
                </DialogContentText>
            </ConfirmCancelDialogComponent>
        ),
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
    ];

    if (
        currentInstance?.altitude !== null &&
        currentInstance?.latitude !== null &&
        currentInstance?.longitude !== null &&
        hasSubmissionPermission !== null &&
        !gpsEqual(currentInstance)
    ) {
        defaultActions = [editLocationWithInstanceGps, ...defaultActions];
    }

    if (currentInstance.can_user_modify) {
        defaultActions = [...defaultActions, deleteRestore];
    }

    if (canEditEnketo && currentInstance.can_user_modify) {
        defaultActions = [enketoAction, ...defaultActions];
    }

    if (currentInstance.can_user_modify) {
        defaultActions = [lockAction, ...defaultActions];
    }

    if (!hasSubmissionPermission || !hasfeatureFlag) return defaultActions;

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

type Props = {
    currentInstance?: Instance;
    params: {
        instanceId: number;
    };
    fetching: boolean;
    router: any;
    redirectToReplace: any;
    prevPathname: any;
    fetchInstanceDetail: any;
    setCurrentInstance: CallableFunction;
    fetchEditUrl: CallableFunction;
    softDelete: CallableFunction;
    restoreInstance: CallableFunction;
    reAssignInstance: CallableFunction;
    redirectToActionInstance: any;
};

const InstanceDetails: FunctionComponent<Props> = props => {
    const [orgUnitTypeIds, setOrgUnitTypeIds] = useState([]);
    const [showDial, setShowDial] = useState(true);
    const [showHistoryLink, setShowHistoryLink] = useState(true);
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        currentInstance,
        fetching,
        reAssignInstance,
        router,
        prevPathname,
        redirectToReplace,
        params,
        redirectToActionInstance,
    } = props;
    useEffect(() => {
        const {
            params: { instanceId },
            fetchInstanceDetail,
            setCurrentInstance,
        } = props;
        setCurrentInstance(null);
        fetchInstanceDetail(instanceId).then(instanceDetails => {
            fetchFormOrgUnitTypes(dispatch, instanceDetails.form_id).then(
                orgUnitTypeIds2 => {
                    setOrgUnitTypeIds(orgUnitTypeIds2.org_unit_type_ids);
                },
            );
        });

        // not showing history link in submission detail if there is only one version/log

        getRequest(
            `/api/logs/?objectId=${instanceId}&order=-created_at&contentType=iaso.instance`,
        ).then(instanceLogsDetails => {
            if (instanceLogsDetails.list.length === 1) {
                setShowHistoryLink(false);
            }
        });
    }, []);

    const onActionSelected = action => {
        if (action.id === 'instanceEditAction' && props.currentInstance) {
            props.fetchEditUrl(props.currentInstance, window.location);
        }

        if (action.id === 'instanceDeleteAction' && props.currentInstance) {
            props.softDelete(props.currentInstance);
        }
        if (action.id === 'instanceRestoreAction' && props.currentInstance) {
            props.restoreInstance(props.currentInstance);
        }
    };

    const onLightBoxToggled = open => {
        setShowDial(!open);
    };

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
                          }: ${currentInstance.file_name.replace('.xml', '')}`
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
                    {currentInstance.can_user_modify && showDial && (
                        <SpeedDialInstanceActions
                            actions={actions({
                                currentInstance,
                                reAssignInstance,
                                orgUnitTypeIds,
                                canEditEnketo,
                                formId,
                                params,
                                currentUser,
                                redirectToActionInstance,
                            })}
                            onActionSelected={action =>
                                onActionSelected(action)
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
                                    {formatMessage(MESSAGES.warningSoftDeleted)}
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

                                {currentInstance && showHistoryLink && (
                                    <Grid container spacing={1}>
                                        <Grid xs={5} item>
                                            <div
                                                className={
                                                    classes.labelContainer
                                                }
                                            >
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    color="inherit"
                                                    title="Historique"
                                                >
                                                    {formatMessage(
                                                        MESSAGES.history,
                                                    )}
                                                </Typography>
                                                :
                                            </div>
                                        </Grid>

                                        <Grid
                                            xs={7}
                                            container
                                            item
                                            justifyContent="flex-start"
                                            alignItems="center"
                                        >
                                            <Typography
                                                variant="body1"
                                                color="inherit"
                                            >
                                                <Link
                                                    to={`${baseUrls.compareInstanceLogs}/instanceIds/${currentInstance.id}`}
                                                >
                                                    {formatMessage(
                                                        MESSAGES.seeAllVersions,
                                                    )}
                                                </Link>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                )}
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

                            <InstanceDetailsLocksHistory
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
                                        onLightBoxToggled={open =>
                                            onLightBoxToggled(open)
                                        }
                                    />
                                </WidgetPaper>
                            )}
                        </Grid>

                        <Grid xs={12} md={8} item>
                            <WidgetPaper
                                id="form-contents"
                                title={formatMessage(MESSAGES.submission)}
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
};

InstanceDetails.defaultProps = {
    prevPathname: null,
    currentInstance: undefined,
    currentUser: null,
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

export default connect(MapStateToProps, MapDispatchToProps)(InstanceDetails);
