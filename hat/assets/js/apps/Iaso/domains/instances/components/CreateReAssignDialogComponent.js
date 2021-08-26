import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { Period } from '../../periods/models';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

const CreateReAssignDialogComponent = ({
    titleMessage,
    confirmMessage,
    cancelMessage,
    renderTrigger,
    formType,
    currentInstance,
    onCreateOrReAssign,
}) => {
    const currentFormOrInstanceProp = currentInstance || formType;
    const currentFormOrInstance = { ...currentFormOrInstanceProp };

    // Begin check if this is a Form type
    if (
        currentFormOrInstance.period === undefined ||
        currentFormOrInstance.period === ''
    ) {
        const toDay = new Date();
        const period = new Period(
            toDay.getFullYear() + `0${toDay.getMonth() + 1}`.slice(-2),
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

    // copying the current value of the state to restore it on cancel
    const orgUnitCopy = useRef(currentFormOrInstance.org_unit);
    const periodCopy = useRef(currentFormOrInstance.period);

    const onCancel = useCallback(
        closeDialog => {
            setFieldValue({
                ...fieldValue,
                orgUnit: { ...fieldValue.orgUnit, value: orgUnitCopy.current },
            });
            closeDialog();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fieldValue, orgUnitCopy.current],
    );

    const onConfirm = closeDialog => {
        onCreateOrReAssign(currentFormOrInstance, {
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value?.id,
        });
        orgUnitCopy.current = fieldValue.orgUnit.value;
        periodCopy.current = fieldValue.period.value;
        closeDialog();
    };

    let period;
    let nextPeriods;
    let allPeriods = [];
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
            onCancel={onCancel}
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
                <OrgUnitTreeviewModal
                    titleMessage={MESSAGES.selectedOrgUnit}
                    toggleOnLabelClick={false}
                    onConfirm={orgUnit => {
                        setFieldValue({
                            ...fieldValue,
                            orgUnit: {
                                ...fieldValue.orgUnit,
                                value: orgUnit,
                            },
                        });
                    }}
                    multiselect={false}
                    initialSelection={fieldValue.orgUnit.value}
                />
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
