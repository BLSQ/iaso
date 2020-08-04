import React from "react";
import { injectIntl } from "react-intl";
import { FormattedMessage } from "react-intl";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import { Chip, makeStyles, Box, Typography } from "@material-ui/core";

import { connect } from "react-redux";

import UpdateIcon from "@material-ui/icons/Update";
import InputComponent from "../../../components/forms/InputComponent";
import OrgUnitSearch from "../../orgUnits/components/OrgUnitSearch";
import OrgUnitTooltip from "../../orgUnits/components/OrgUnitTooltip";
import { getOrgunitMessage } from "../../orgUnits/utils";
import ConfirmCancelDialogComponent from "../../../components/dialogs/ConfirmCancelDialogComponent";
import { Period } from "../../periods/models";

import MESSAGES from "../messages";

const useStyles = makeStyles((theme) => ({
  chipList: {
    marginTop: theme.spacing(2),
  },
  chipListTitle: {
    marginBottom: theme.spacing(1),
  },
  chip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const ReAssignInstanceDialogComponent = ({
  currentInstance,
  onReAssignInstance,
}) => {
  const classes = useStyles();
  // can do the useState things here...

  const onClosed = () => {
    // do something?
  };

  const handleRemoveOrgUnit = () => {
    setFieldValue({
      ...fieldValue,
      orgUnit: {
        errors: ["Org unit is required!"],
        value: undefined,
      },
    });
  };
  const [fieldValue, setFieldValue] = React.useState({
    orgUnit: { value: currentInstance.org_unit, errors: [] },
    period: { value: currentInstance.period, errors: [] },
  });

  const onConfirm = (closeDialog) => {
    onReAssignInstance(currentInstance, {
      period: fieldValue.period.value,
      org_unit: fieldValue.orgUnit.value.id,
    });

    closeDialog();
  };

  let period,
    nextPeriods,
    previousPeriods = [];
  if (currentInstance.period !== undefined && currentInstance.period !== null) {
    period = new Period(currentInstance.period);
    nextPeriods = period.nextPeriods(2);
    previousPeriods = period.previousPeriods(3);
  }

  return (
    <ConfirmCancelDialogComponent
      renderTrigger={({ openDialog }) => <UpdateIcon onClick={openDialog} />}
      titleMessage={MESSAGES.reAssignInstance}
      onConfirm={onConfirm}
      confirmMessage={MESSAGES.reAssignInstanceAction}
      onClosed={onClosed}
      cancelMessage={MESSAGES.cancel}
      maxWidth="xs"
    >
      <InputComponent
        disabled={
          currentInstance.period === undefined ||
          currentInstance.period === null
        }
        clearable={false}
        keyValue="period"
        onChange={(key, value) =>
          setFieldValue({
            ...fieldValue,
            period: {
              ...fieldValue.period,
              value: value,
            },
          })
        }
        value={fieldValue.period.value}
        errors={fieldValue.period.errors}
        type="select"
        options={previousPeriods.concat(nextPeriods).map((p) => ({
          label: Period.getPrettyPeriod(p),
          value: p,
        }))}
        label={MESSAGES.period}
        required
      />
      <>
        <OrgUnitSearch
          onSelectOrgUnit={(ou) =>
            setFieldValue({
              ...fieldValue,
              orgUnit: {
                ...fieldValue.orgUnit,
                value: ou,
              },
            })
          }
          inputLabelObject={MESSAGES.addOrgUnit}
        />
        {fieldValue.orgUnit.value !== undefined && (
          <Box className={classes.chipList}>
            <Typography variant="subtitle1" className={classes.chipListTitle}>
              <FormattedMessage {...MESSAGES.selectedOrgUnit} />:
            </Typography>
            {
              <OrgUnitTooltip
                orgUnit={fieldValue.orgUnit.value}
                key={fieldValue.orgUnit.value.id}
              >
                <Chip
                  label={getOrgunitMessage(fieldValue.orgUnit.value)}
                  onDelete={() => handleRemoveOrgUnit()}
                  className={classes.chip}
                  color="primary"
                />
              </OrgUnitTooltip>
            }
          </Box>
        )}
      </>
    </ConfirmCancelDialogComponent>
  );
};

ReAssignInstanceDialogComponent.propTypes = {
  // props?
};

export default connect()(injectIntl(ReAssignInstanceDialogComponent));
