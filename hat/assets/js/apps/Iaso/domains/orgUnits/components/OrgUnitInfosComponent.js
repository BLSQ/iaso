/* eslint-disable import/extensions */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';

import {
    Box,
    Button,
    Grid,
    DialogContentText,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { makeStyles } from '@material-ui/core/styles';

import {
    injectIntl,
    FormControl as FormControlComponent,
    IconButton as IconButtonComponent,
    LoadingSpinner,
} from 'bluesquare-components';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import omit from 'lodash/omit';
import { FormattedMessage } from 'react-intl';
import GpsFixedIcon from '@material-ui/icons/GpsFixed';
import GpsOffIcon from '@material-ui/icons/GpsOff';
import { useSaveOrgUnit } from '../hooks';
import { useFormState } from '../../../hooks/form';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { fetchEditUrl as fetchEditUrlAction } from '../../instances/actions';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import SpeedDialInstanceActions from '../../instances/components/SpeedDialInstanceActions';
import EnketoIcon from '../../instances/components/EnketoIcon';
import { userHasPermission } from '../../users/utils';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useCurrentUser } from '../../../utils/usersUtils';
import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../../utils/featureFlags';

// reformatting orgUnit name so the OU can be passed to the treeview modal
// and selecting the parent for display
const useStyles = makeStyles(theme => ({
    speedDialTop: {
        top: theme.spacing(12.5),
    },
    marginLeft: {
        marginLeft: '8px',
    },
    formContents: {
        width: '100%',
    },
}));

const reformatOrgUnit = orgUnit => {
    let copy = null;
    if (orgUnit?.parent) {
        // eslint-disable-next-line camelcase
        copy = {
            id: orgUnit?.parent.id,
            name: orgUnit?.parent.name,
            source: orgUnit?.parent.source,
            source_id: orgUnit?.parent.source_id,
            parent: orgUnit?.parent.parent,
            parent_name: orgUnit?.parent.parent_name,
        };
    }
    return copy;
};

const onActionSelected = (fetchEditUrl, action, instance) => {
    if (action.id === 'instanceEditAction' && instance) {
        fetchEditUrl(instance, window.location);
    }
};

const initialFormState = (orgUnit, referenceSubmissionId) => {
    return {
        id: orgUnit.id.value,
        name: orgUnit.name.value,
        creator: orgUnit.creator.value,
        org_unit_type_id:
            orgUnit?.org_unit_type_id.value?.toString() ?? undefined,
        groups: orgUnit.groups.value?.map(g => g) ?? [],
        sub_source: orgUnit.sub_source.value,
        validation_status: orgUnit.validation_status.value,
        aliases: orgUnit.aliases.value,
        parent_id: orgUnit.parent_id.value,
        source_ref: orgUnit.source_ref.value,
        reference_instance_id: referenceSubmissionId,
    };
};

const onError = setFieldErrors => {
    if (onError.status === 400) {
        onError.details.forEach(entry => {
            setFieldErrors(entry.errorKey, [entry.errorMessage]);
        });
    }
};

const linkOrLinkOffOrgUnitToReferenceSubmission = (
    orgUnit,
    referenceSubmissionId,
    saveOu,
    setFieldErrors,
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
    saveOu(orgUnitPayload)
        // eslint-disable-next-line no-unused-vars
        .then(_ou => {
            window.location.reload(false);
        })
        .catch(onError(setFieldErrors));
};

const Actions = (
    orgUnit,
    formId,
    referenceFormId,
    instanceId,
    saveOu,
    setFieldErrors,
) => {
    const currentUser = useCurrentUser();
    const referenceSubmission = orgUnit.reference_instance;
    const linkOrgUnit =
        formId !== referenceFormId || referenceSubmission !== null;
    const hasSubmissionPermission = userHasPermission(
        'iaso_submissions',
        currentUser,
    );

    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );

    const actions = [
        {
            id: 'instanceEditAction',
            icon: <EnketoIcon />,
            disabled: !referenceSubmission,
        },
    ];

    const orgUnitToReferenceSubmission = instance => {
        return linkOrLinkOffOrgUnitToReferenceSubmission(
            orgUnit,
            instance,
            saveOu,
            setFieldErrors,
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

    if (!hasSubmissionPermission || !hasfeatureFlag) return actions;
    return [
        ...actions,
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
                            : orgUnitToReferenceSubmission(instanceId)
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

const Row = ({ label, value }) => {
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

const OrgUnitCreationDetails = ({ orgUnit, formatMessage }) => {
    const latitude = `${formatMessage(MESSAGES.latitude)}: ${
        orgUnit.latitude
    },`;
    const longitude = `${formatMessage(MESSAGES.longitude)}: ${
        orgUnit.longitude
    },`;

    const latitudeLongitude =
        orgUnit.latitude && orgUnit.longitude ? latitude + longitude : false;
    const orgUnitCreatedAt = moment.unix(orgUnit.created_at).format('LTS');
    const orgUnitUpdatedAt = moment.unix(orgUnit.updated_at).format('LTS');

    return (
        <>
            {!orgUnit && <LoadingSpinner absolute />}

            <WidgetPaper showHeader={false} title="">
                <Table size="medium">
                    <TableBody>
                        <Row
                            label={formatMessage(MESSAGES.source)}
                            value={orgUnit.source ?? '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.creator)}
                            value={orgUnit.creator.value ?? '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.created_at)}
                            value={orgUnit.created_at ? orgUnitCreatedAt : '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.updated_at)}
                            value={orgUnit.updated_at ? orgUnitUpdatedAt : '-'}
                        />
                        {!orgUnit.has_geo_json && !latitudeLongitude && (
                            <Row
                                label={<GpsOffIcon color="primary" />}
                                value={formatMessage(
                                    MESSAGES.hasNoGeometryAndGps,
                                )}
                            />
                        )}
                        {orgUnit.has_geo_json && (
                            <Row
                                label={<GpsFixedIcon color="primary" />}
                                value={formatMessage(MESSAGES.hasGeometry)}
                            />
                        )}
                        {latitudeLongitude && (
                            <>
                                <Row
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={orgUnit.latitude}
                                />

                                <Row
                                    label={formatMessage(MESSAGES.LONGITUDE)}
                                    value={orgUnit.longitude}
                                />
                            </>
                        )}
                    </TableBody>
                </Table>
            </WidgetPaper>
        </>
    );
};

const OrgUnitInfosComponent = ({
    orgUnit,
    onChangeInfo,
    orgUnitTypes,
    intl: { formatMessage },
    groups,
    resetTrigger,
    fetchEditUrl,
    params,
    handleSave,
    handleReset,
    orgUnitModified,
    isFetchingOrgUnitTypes,
    isFetchingGroups,
}) => {
    const { mutateAsync: saveOu } = useSaveOrgUnit();
    const classes = useStyles();

    const { formId } = params;
    const { referenceFormId } = params;
    const { instanceId } = params;

    const [setFieldErrors] = useFormState(
        initialFormState(orgUnit, instanceId),
    );

    const showSpeedDialsActions =
        orgUnit.reference_instance ||
        (formId === referenceFormId &&
            Boolean(formId) &&
            Boolean(referenceFormId));

    const isNewOrgunit = params.orgUnitId === '0';

    const isSaveDisabled =
        orgUnit.name.value === '' || orgUnit.org_unit_type_id.value === null;

    return (
        <Grid container spacing={2}>
            {showSpeedDialsActions && (
                <SpeedDialInstanceActions
                    speedDialClasses={classes.speedDialTop}
                    actions={Actions(
                        orgUnit,
                        formId,
                        referenceFormId,
                        instanceId,
                        saveOu,
                        setFieldErrors,
                    )}
                    onActionSelected={action =>
                        onActionSelected(
                            fetchEditUrl,
                            action,
                            orgUnit.reference_instance,
                        )
                    }
                />
            )}
            <Grid item xs={12} md={4}>
                <InputComponent
                    keyValue="name"
                    required
                    onChange={onChangeInfo}
                    value={orgUnit.name.value}
                    errors={orgUnit.name.errors}
                    label={MESSAGES.name}
                    withMarginTop={!orgUnit.reference_instance}
                />

                <InputComponent
                    keyValue="org_unit_type_id"
                    onChange={onChangeInfo}
                    required
                    value={
                        isFetchingOrgUnitTypes
                            ? undefined
                            : orgUnit.org_unit_type_id.value
                    }
                    errors={orgUnit.org_unit_type_id.errors}
                    type="select"
                    loading={isFetchingOrgUnitTypes}
                    options={orgUnitTypes.map(t => ({
                        label: t.name,
                        value: t.id,
                    }))}
                    label={MESSAGES.org_unit_type_id}
                />
                <InputComponent
                    keyValue="groups"
                    onChange={(name, value) =>
                        onChangeInfo(name, commaSeparatedIdsToArray(value))
                    }
                    multi
                    value={isFetchingGroups ? undefined : orgUnit.groups.value}
                    loading={isFetchingGroups}
                    errors={orgUnit.groups.errors}
                    type="select"
                    options={groups.map(g => ({
                        label: g.name,
                        value: g.id,
                    }))}
                    label={MESSAGES.groups}
                />

                <InputComponent
                    keyValue="aliases"
                    onChange={onChangeInfo}
                    value={orgUnit.aliases.value}
                    type="arrayInput"
                />
            </Grid>

            <Grid item xs={12} md={4}>
                <InputComponent
                    keyValue="validation_status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    errors={orgUnit.validation_status.errors}
                    value={orgUnit.validation_status.value}
                    type="select"
                    label={MESSAGES.status}
                    options={[
                        {
                            label: formatMessage(MESSAGES.new),
                            value: 'NEW',
                        },
                        {
                            label: formatMessage(MESSAGES.validated),
                            value: 'VALID',
                        },
                        {
                            label: formatMessage(MESSAGES.rejected),
                            value: 'REJECTED',
                        },
                    ]}
                    withMarginTop
                />
                <InputComponent
                    keyValue="source_ref"
                    value={orgUnit.source_ref.value || ''}
                    onChange={onChangeInfo}
                    errors={orgUnit.source_ref.errors}
                />

                <FormControlComponent
                    errors={orgUnit.parent_id.errors}
                    id="ou-tree-input"
                >
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.selectParentOrgUnit}
                        onConfirm={treeviewOrgUnit => {
                            if (
                                (treeviewOrgUnit
                                    ? treeviewOrgUnit.id
                                    : null) !== orgUnit.parent_id.value
                            ) {
                                onChangeInfo('parent_id', treeviewOrgUnit?.id);
                            }
                        }}
                        source={orgUnit.source_id}
                        initialSelection={reformatOrgUnit(orgUnit)}
                        resetTrigger={resetTrigger}
                    />
                </FormControlComponent>

                <Grid
                    container
                    item
                    xs={12}
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Box mt={1}>
                        <Button
                            id="save-ou"
                            disabled={isSaveDisabled}
                            variant="contained"
                            className={classes.marginLeft}
                            color="primary"
                            onClick={handleSave}
                        >
                            <FormattedMessage {...MESSAGES.save} />
                        </Button>

                        {!isNewOrgunit && (
                            <Button
                                className={classes.marginLeft}
                                disabled={!orgUnitModified}
                                variant="contained"
                                onClick={() => handleReset()}
                            >
                                <FormattedMessage {...MESSAGES.cancel} />
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
                <Box mt={2}>
                    <OrgUnitCreationDetails
                        orgUnit={orgUnit}
                        formatMessage={formatMessage}
                        classes={classes}
                    />
                </Box>
            </Grid>

            {orgUnit.reference_instance && (
                <Grid container item xs={12} md={8}>
                    <Box mt={4} className={classes.formContents}>
                        <WidgetPaper
                            id="form-contents"
                            title={formatMessage(MESSAGES.detailTitle)}
                            IconButton={IconButtonComponent}
                            iconButtonProps={{
                                onClick: () =>
                                    window.open(
                                        orgUnit.reference_instance.file_url,
                                        '_blank',
                                    ),
                                icon: 'xml',
                                color: 'secondary',
                                tooltipMessage: MESSAGES.downloadXml,
                            }}
                        >
                            <InstanceFileContent
                                instance={orgUnit.reference_instance}
                            />
                        </WidgetPaper>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

OrgUnitInfosComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
    resetTrigger: PropTypes.bool,
    fetchEditUrl: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    handleSave: PropTypes.func.isRequired,
    handleReset: PropTypes.func.isRequired,
    orgUnitModified: PropTypes.bool.isRequired,
    isFetchingOrgUnitTypes: PropTypes.bool.isRequired,
    isFetchingGroups: PropTypes.bool.isRequired,
};
OrgUnitInfosComponent.defaultProps = {
    resetTrigger: false,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchEditUrl: fetchEditUrlAction,
        },
        dispatch,
    ),
});

export default connect(
    null,
    MapDispatchToProps,
)(injectIntl(OrgUnitInfosComponent));
