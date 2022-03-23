import React, { Fragment } from 'react';

import { Grid } from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import {
    injectIntl,
    FormControl as FormControlComponent,
} from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

import MESSAGES from '../../forms/messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';

// reformatting orgUnit name so the OU can be passed to the treeview modal
// and selecting the parent for display
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
const OrgUnitCreationDetails = ({
  org_unit
}) => (
  <Fragment>
    <InputComponent
        keyValue="source"
        value={org_unit.source}
        disabled
        label={MESSAGES.source}
    />
    <InputComponent
        keyValue="created_at"
        value={moment.unix(org_unit.created_at).format('LTS')}
        disabled
    />
    <InputComponent
        keyValue="updated_at"
        value={moment.unix(org_unit.updated_at).format('LTS')}
        disabled
    />
  </Fragment>
);

const OrgUnitInfosComponent = ({
    orgUnit,
    onChangeInfo,
    orgUnitTypes,
    intl: { formatMessage },
    groups,
    resetTrigger,
}) => (
    <Grid container spacing={4}>
        <Grid item xs={4}>
            <InputComponent
                keyValue="name"
                required
                onChange={onChangeInfo}
                value={orgUnit.name.value}
                errors={orgUnit.name.errors}
                label={MESSAGES.name}
            />
            <InputComponent
                keyValue="org_unit_type_id"
                onChange={onChangeInfo}
                required
                value={orgUnit.org_unit_type_id.value}
                errors={orgUnit.org_unit_type_id.errors}
                type="select"
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
                    orgUnit.groups.value.length > 0
                        ? orgUnit.groups.value
                        : null
                }
                errors={orgUnit.groups.errors}
                type="select"
                options={groups.map(g => ({
                    label: g.name,
                    value: g.id,
                }))}
                label={MESSAGES.groups}
            />
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
            />
            <InputComponent
                keyValue="source_ref"
                value={orgUnit.source_ref.value || ''}
                onChange={onChangeInfo}
                errors={orgUnit.source_ref.errors}
            />
            <FormControlComponent
                errors={orgUnit.parent_id.errors}
                marginTopZero
                id="ou-tree-input"
            >
                <OrgUnitTreeviewModal
                    toggleOnLabelClick={false}
                    titleMessage={MESSAGES.selectParentOrgUnit}
                    onConfirm={treeviewOrgUnit => {
                        if (
                            (treeviewOrgUnit ? treeviewOrgUnit.id : null) !==
                            orgUnit.parent_id.value
                        ) {
                            onChangeInfo('parent_id', treeviewOrgUnit?.id);
                        }
                    }}
                    source={orgUnit.source_id}
                    initialSelection={reformatOrgUnit(orgUnit)}
                    resetTrigger={resetTrigger}
                />
            </FormControlComponent>
            {orgUnit.instance_defining && (
              <OrgUnitCreationDetails org_unit={orgUnit}/>
            )}
            <InputComponent
                keyValue="aliases"
                onChange={onChangeInfo}
                value={orgUnit.aliases.value}
                type="arrayInput"
            />
        </Grid>
        <Grid item xs={4}>
        {(orgUnit.id && !orgUnit.instance_defining) && (
            <OrgUnitCreationDetails org_unit={orgUnit}/>
        )}
        </Grid>
    </Grid>
);

OrgUnitInfosComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
    resetTrigger: PropTypes.bool,
};
OrgUnitInfosComponent.defaultProps = {
    resetTrigger: false,
};

export default injectIntl(OrgUnitInfosComponent);
