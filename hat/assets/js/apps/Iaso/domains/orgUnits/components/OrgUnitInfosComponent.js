import React, { Fragment } from 'react';

import { withStyles, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';
import moment from 'moment';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { makeStyles } from '@material-ui/core/styles';

import {
    injectIntl,
    FormControl as FormControlComponent,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { useSaveOrgUnit } from '../hooks';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { fetchEditUrl as fetchEditUrlAction} from '../../instances/actions';
import MESSAGES from '../../forms/messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import SpeedDialInstanceActions from '../../instances/components/SpeedDialInstanceActions';
import EnketoIcon from '../../instances/components/EnketoIcon';
import LinkIcon from '@material-ui/icons/Link';
import queryString from "query-string"
import omit from 'lodash/omit';
// reformatting orgUnit name so the OU can be passed to the treeview modal
// and selecting the parent for display
const useStyles = makeStyles(theme => ({
    speedDialTop: {
        top: theme.spacing(12.5)
    }
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
      fetchEditUrl(
          instance,
          window.location,
      );
    }
};

const initialFormState = (orgUnit, instanceDefiningId) => {
    return {
        id: orgUnit.id["value"],
        name: orgUnit.name["value"],
        org_unit_type_id: orgUnit.org_unit_type_id["value"]
            ? `${orgUnit.org_unit_type_id["value"]}`
            : null,
        groups: orgUnit.groups["value"]?.map(g => g) ?? [],
        sub_source: orgUnit.sub_source["value"],
        validation_status: orgUnit.validation_status["value"],
        aliases: orgUnit.aliases["value"],
        parent_id: orgUnit.parent_id["value"],
        source_ref: orgUnit.source_ref["value"],
        instance_defining_id: instanceDefiningId,
    };
};

const onError = () =>  {
  if (onError.status === 400) {
    onError.details.forEach(entry => {
      setFieldErrors(entry.errorKey, [entry.errorMessage]);
    });
  }
}

const linkOrgUnitToInstanceDefining = (orgUnit, instanceDefiningId, saveOu) => {
  const currentOrgUnit = orgUnit;
  const newOrgUnit = initialFormState(orgUnit, instanceDefiningId);
  let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });

  orgUnitPayload = {
      ...orgUnitPayload,
      groups:
          orgUnitPayload.groups.length > 0 &&
          !orgUnitPayload.groups[0].id
              ? orgUnitPayload.groups
              : orgUnitPayload.groups.map(g => g.id),
  };
  saveOu(orgUnitPayload)
      .then(ou => {
          window.location.reload(false)
      })
      .catch(onError);
}

const actions = (orgUnit, formId, formDefiningId, instanceId, saveOu) => {
  const instanceDefining = orgUnit.instance_defining;
  const linkOrgUnit = ((formId !== formDefiningId) || instanceDefining);
  return [

      {
          id: 'instanceEditAction',
          icon: <EnketoIcon />,
          disabled: !instanceDefining,
      },
      {
          id: 'linkOrgUnitInstanceDefining',
          icon: <LinkIcon
                  onClick={() => linkOrgUnitToInstanceDefining(orgUnit, instanceId, saveOu)}
                />,
          disabled: linkOrgUnit,
      }
  ];
}

const OrgUnitCreationDetails = ({
  orgUnit
}) => (
  <Fragment>
    <InputComponent
        keyValue="source"
        value={orgUnit.source}
        disabled
        label={MESSAGES.source}
    />
    <InputComponent
        keyValue="created_at"
        value={moment.unix(orgUnit.created_at).format('LTS')}
        disabled
    />
    <InputComponent
        keyValue="updated_at"
        value={moment.unix(orgUnit.updated_at).format('LTS')}
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
    fetchEditUrl,
    params,
    ...props
}) => {
  const { mutateAsync: saveOu, isLoading: savingOu } = useSaveOrgUnit();
  const classes = useStyles();

  const formId = params.formId;
  const formDefiningId = params.formDefiningId;
  const instanceId = params.instanceId;

  return (
        <Grid container spacing={4}>
          {(orgUnit.instance_defining || formId === formDefiningId) && (
            <SpeedDialInstanceActions
                speedDialClasses={classes.speedDialTop}
                actions={actions(orgUnit, formId, formDefiningId, instanceId, saveOu)}
                onActionSelected={action =>
                    onActionSelected(fetchEditUrl, action, orgUnit.instance_defining)
                }
            />
          )}
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
                <OrgUnitCreationDetails orgUnit={orgUnit}/>
              )}
              <InputComponent
                  keyValue="aliases"
                  onChange={onChangeInfo}
                  value={orgUnit.aliases.value}
                  type="arrayInput"
              />
          </Grid>
          <Grid item xs={orgUnit.instance_defining ? 6 : 4}>
          {(orgUnit.id && !orgUnit.instance_defining) && (
              <OrgUnitCreationDetails orgUnit={orgUnit}/>
          )}

          {orgUnit.instance_defining && (
            <WidgetPaper
                id="form-contents"
                title={formatMessage(MESSAGES.detailTitle)}
                IconButton={IconButtonComponent}
                iconButtonProps={{
                    onClick: () =>
                        window.open(
                            orgUnit.instance_defining.file_url,
                            '_blank',
                        ),
                    icon: 'xml',
                    color: 'secondary',
                    tooltipMessage: MESSAGES.downloadXml,
                }}
            >
              <InstanceFileContent
                  instance={orgUnit.instance_defining}
              />
            </WidgetPaper>
          )}
          </Grid>
        </Grid>
  )
};

OrgUnitInfosComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    onChangeInfo: PropTypes.func.isRequired,
    resetTrigger: PropTypes.bool,
    fetchEditUrl: PropTypes.func.isRequired,
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

export default connect(null, MapDispatchToProps)(injectIntl(OrgUnitInfosComponent));
