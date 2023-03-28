/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';

import { Box, Button, Grid } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import {
    useSafeIntl,
    FormControl as FormControlComponent,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { useSaveOrgUnit } from '../hooks';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { fetchEditUrl } from '../../instances/actions';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import SpeedDialInstanceActions from '../../instances/components/SpeedDialInstanceActions';

import { OrgUnitCreationDetails } from './OrgUnitCreationDetails';
import { Actions } from './OrgUnitActions';

import { OrgUnitState, Group, OrgUnit, Action } from '../types/orgUnit';
import { OrgunitType } from '../types/orgunitTypes';
import { Instance } from '../../instances/types/instance';

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

const getParentOrgUnit = (orgUnit: OrgUnit): Partial<OrgUnit> =>
    orgUnit?.parent && {
        id: orgUnit.parent.id,
        name: orgUnit.parent.name,
        source: orgUnit.parent.source,
        source_id: orgUnit.parent.source_id,
        parent: orgUnit.parent.parent,
        parent_name: orgUnit.parent.parent_name,
        validation_status: orgUnit.parent.validation_status,
    };

type Props = {
    orgUnitState: OrgUnitState;
    onChangeInfo: (
        // eslint-disable-next-line no-unused-vars
        key: string,
        // eslint-disable-next-line no-unused-vars
        value: string | number | string[] | number[],
    ) => void;
    orgUnitTypes: OrgunitType[];
    groups: Group[];
    resetTrigger: boolean;
    params: Record<string, string>;
    handleSave: () => void;
    handleReset: () => void;
    orgUnitModified: boolean;
    isFetchingOrgUnitTypes: boolean;
    isFetchingGroups: boolean;
    referenceInstance: Instance;
    // eslint-disable-next-line no-unused-vars
    setFieldErrors: (errors: string) => void;
    orgUnit: OrgUnit;
};

export const OrgUnitInfos: FunctionComponent<Props> = ({
    orgUnitState,
    onChangeInfo,
    orgUnitTypes,
    groups,
    resetTrigger,
    params,
    handleSave,
    handleReset,
    orgUnitModified,
    isFetchingOrgUnitTypes,
    isFetchingGroups,
    referenceInstance,
    setFieldErrors,
    orgUnit,
}) => {
    const { mutateAsync: saveOu } = useSaveOrgUnit();
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { formId } = params;
    const { referenceFormId } = params;
    const { instanceId } = params;

    const showSpeedDialsActions =
        referenceInstance ||
        (formId === referenceFormId &&
            Boolean(formId) &&
            Boolean(referenceFormId));

    const isNewOrgunit = params.orgUnitId === '0';
    const isSaveDisabled =
        orgUnitState.name.value === '' ||
        orgUnitState.org_unit_type_id.value === null;

    const handleActionSelected = (action: Action, instance: Instance) => {
        if (action.id === 'instanceEditAction' && instance) {
            dispatch(fetchEditUrl(instance, window.location));
        }
    };

    return (
        <Grid container spacing={2}>
            {showSpeedDialsActions && (
                <SpeedDialInstanceActions
                    speedDialClasses={classes.speedDialTop}
                    actions={Actions({
                        orgUnitState,
                        formId,
                        referenceFormId,
                        instanceId,
                        saveOu,
                        setFieldErrors,
                        referenceInstance,
                    })}
                    onActionSelected={action =>
                        handleActionSelected(action, referenceInstance)
                    }
                />
            )}
            <Grid item xs={12} md={4}>
                <InputComponent
                    keyValue="name"
                    required
                    onChange={onChangeInfo}
                    value={orgUnitState.name.value}
                    errors={orgUnitState.name.errors}
                    label={MESSAGES.name}
                />

                <InputComponent
                    keyValue="org_unit_type_id"
                    onChange={onChangeInfo}
                    required
                    value={
                        isFetchingOrgUnitTypes
                            ? undefined
                            : orgUnitState.org_unit_type_id.value
                    }
                    errors={orgUnitState.org_unit_type_id.errors}
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
                    value={
                        isFetchingGroups ? undefined : orgUnitState.groups.value
                    }
                    loading={isFetchingGroups}
                    errors={orgUnitState.groups.errors}
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
                    value={orgUnitState.aliases.value}
                    type="arrayInput"
                />
            </Grid>

            <Grid item xs={12} md={4}>
                <InputComponent
                    keyValue="validation_status"
                    isClearable={false}
                    onChange={onChangeInfo}
                    errors={orgUnitState.validation_status.errors}
                    value={orgUnitState.validation_status.value}
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
                />
                <InputComponent
                    keyValue="source_ref"
                    value={orgUnitState.source_ref.value || ''}
                    onChange={onChangeInfo}
                    errors={orgUnitState.source_ref.errors}
                />

                <FormControlComponent
                    errors={orgUnitState.parent.errors}
                    id="ou-tree-input"
                >
                    <OrgUnitTreeviewModal
                        toggleOnLabelClick={false}
                        titleMessage={MESSAGES.selectParentOrgUnit}
                        onConfirm={treeviewOrgUnit => {
                            if (
                                (treeviewOrgUnit
                                    ? treeviewOrgUnit.id
                                    : null) !== orgUnitState.parent?.value?.id
                            ) {
                                onChangeInfo('parent', treeviewOrgUnit);
                            }
                        }}
                        source={orgUnit.source_id}
                        initialSelection={getParentOrgUnit(orgUnit)}
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
                        {!isNewOrgunit && (
                            <Button
                                className={classes.marginLeft}
                                disabled={!orgUnitModified}
                                variant="contained"
                                onClick={() => handleReset()}
                            >
                                {formatMessage(MESSAGES.cancel)}
                            </Button>
                        )}
                        <Button
                            id="save-ou"
                            disabled={isSaveDisabled}
                            variant="contained"
                            className={classes.marginLeft}
                            color="primary"
                            onClick={handleSave}
                        >
                            {formatMessage(MESSAGES.save)}
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
                <Box mt={2}>
                    <OrgUnitCreationDetails orgUnit={orgUnit} params={params} />
                </Box>
            </Grid>

            {referenceInstance && (
                <Grid container item xs={12} md={8}>
                    <Box mt={4} className={classes.formContents}>
                        <WidgetPaper
                            id="form-contents"
                            title={formatMessage(MESSAGES.detailTitle)}
                            IconButton={IconButtonComponent}
                            iconButtonProps={{
                                onClick: () =>
                                    window.open(
                                        referenceInstance.file_url,
                                        '_blank',
                                    ),
                                icon: 'xml',
                                color: 'secondary',
                                tooltipMessage: MESSAGES.downloadXml,
                            }}
                        >
                            <InstanceFileContent instance={referenceInstance} />
                        </WidgetPaper>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};
