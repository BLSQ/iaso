import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Chip, makeStyles, Box, Typography } from '@material-ui/core';

import InputComponent from '../../../components/forms/InputComponent';
import OrgUnitSearch from '../../orgUnits/components/OrgUnitSearch';
import OrgUnitTooltip from '../../orgUnits/components/OrgUnitTooltip';
import { getOrgunitMessage } from '../../orgUnits/utils';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { Period } from '../../periods/models';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
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

const CreateReAssignDialogComponent = ({
    titleMessage,
    confirmMessage,
    cancelMessage,
    renderTrigger,
    formType,
    currentInstance,
    onCreateOrReAssign,
}) => {
    const classes = useStyles();
    const currentFormOrInstance = currentInstance || formType;

    // Begin check if this is a Form type
    if (currentFormOrInstance.period === undefined || currentFormOrInstance.period === '') {
        const toDay = new Date();
        const period = new Period(
            toDay.getFullYear() + `0${toDay.getMonth()+1}`.slice(-2),
        );
        currentFormOrInstance.period =
            currentFormOrInstance.period_type !== null &&
            currentFormOrInstance.period_type !== undefined
                ? period.asPeriodType(currentFormOrInstance.period_type)
                      .periodString
                : null;
    }
    // End check if this is a Form type

    const [fieldValue, setFieldValue] = React.useState({
        orgUnit: { value: currentFormOrInstance.org_unit, errors: [] },
        period: { value: currentFormOrInstance.period, errors: [] },
    });

    const handleRemoveOrgUnit = () => {
        setFieldValue({
            ...fieldValue,
            orgUnit: {
                errors: ['Org unit is required!'],
                value: undefined,
            },
        });
    };

    const onConfirm = closeDialog => {
        onCreateOrReAssign(currentFormOrInstance, {
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value.id,
        });

        closeDialog();
    };

    let period;
    let nextPeriods;
    let allPeriods;
    let previousPeriods = [];
    if (
        currentFormOrInstance.period !== undefined &&
        currentFormOrInstance.period !== null
    ) {
        period = new Period(currentFormOrInstance.period);

        nextPeriods = period.nextPeriods(2);
        previousPeriods = period.previousPeriods(3);
        previousPeriods.push(currentFormOrInstance.period);
        allPeriods = previousPeriods.concat(nextPeriods);
    }
    const isPeriodDisabled = !currentFormOrInstance.period;
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            confirmMessage={confirmMessage}
            cancelMessage={cancelMessage}
            maxWidth="xs"
            allowConfirm={
                fieldValue.orgUnit.value !== undefined &&
                (Boolean(isPeriodDisabled) ||
                    (!isPeriodDisabled && Boolean(fieldValue.period.value)))
            }
        >
            <InputComponent
                disabled={
                    currentFormOrInstance.period === undefined ||
                    currentFormOrInstance.period === null
                }
                clearable={false}
                keyValue="period"
                onChange={(key, value) =>
                    setFieldValue({
                        ...fieldValue,
                        period: {
                            ...fieldValue.period,
                            value,
                        },
                    })
                }
                value={fieldValue.period.value}
                errors={fieldValue.period.errors}
                type="select"
                options={allPeriods.map(p => ({
                    label: Period.getPrettyPeriod(p),
                    value: p,
                }))}
                label={MESSAGES.period}
                required
            />
            <>
                {!fieldValue.orgUnit.value && (
                    <OrgUnitSearch
                        onSelectOrgUnit={ou =>
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
                )}
                {fieldValue.orgUnit.value !== undefined && (
                    <Box className={classes.chipList}>
                        <Typography
                            variant="subtitle1"
                            className={classes.chipListTitle}
                        >
                            <FormattedMessage {...MESSAGES.selectedOrgUnit} />
                            {':'}
                        </Typography>
                        <OrgUnitTooltip
                            orgUnit={fieldValue.orgUnit.value}
                            key={fieldValue.orgUnit.value.id}
                        >
                            <Chip
                                label={getOrgunitMessage(
                                    fieldValue.orgUnit.value,
                                )}
                                onDelete={() => handleRemoveOrgUnit()}
                                className={classes.chip}
                                color="primary"
                            />
                        </OrgUnitTooltip>
                    </Box>
                )}
            </>
        </ConfirmCancelDialogComponent>
    );
};

CreateReAssignDialogComponent.defaultProps = {
    formType: undefined,
    currentInstance: undefined,
    cancelMessage: MESSAGES.cancel,
    confirmMessage: MESSAGES.ok,
};

CreateReAssignDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    confirmMessage: PropTypes.object,
    cancelMessage: PropTypes.object,
    formType: PropTypes.object,
    currentInstance: PropTypes.object,
    onCreateOrReAssign: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
};

export default CreateReAssignDialogComponent;
