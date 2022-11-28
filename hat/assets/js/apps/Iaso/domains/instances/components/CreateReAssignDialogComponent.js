import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { Period } from '../../periods/models';
import { usePrettyPeriod } from '../../periods/utils';
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
    orgUnitTypes,
}) => {
    const formatPeriod = usePrettyPeriod();
    const currentFormOrInstanceProp = currentInstance || formType;
    const currentFormOrInstance = { ...currentFormOrInstanceProp };

    // Begin check if this is a Form type
    if (
        currentFormOrInstance.period === undefined ||
        currentFormOrInstance.period === ''
    ) {
        const toDay = new Date();
        // Should have day
        // Or just move this logic to the Period object

        // Apparently we just build the string and parse it afterward
        const period = new Period(
            toDay.getFullYear() + `0${toDay.getMonth() + 1}`.slice(-2),
        );
        currentFormOrInstance.period =
            currentFormOrInstance.periodType !== null &&
            currentFormOrInstance.periodType !== undefined
                ? period.asPeriodType(currentFormOrInstance.periodType)
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
                Boolean(fieldValue.orgUnit.value) &&
                (Boolean(isPeriodDisabled) ||
                    (!isPeriodDisabled && Boolean(fieldValue.period.value)))
            }
        >
            {currentFormOrInstance.period !== undefined &&
                currentFormOrInstance.period !== null && (
                    <InputComponent
                        disabled={
                            currentFormOrInstance.period === undefined ||
                            currentFormOrInstance.period === null
                        }
                        clearable={false}
                        keyValue="period"
                        onChange={(_key, value) =>
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
                            label: formatPeriod(p),
                            value: p,
                        }))}
                        label={MESSAGES.period}
                        required
                    />
                )}
            <>
                <OrgUnitTreeviewModal
                    required
                    clearable={false}
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
                    allowedTypes={orgUnitTypes}
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
    orgUnitTypes: [],
};

CreateReAssignDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    confirmMessage: PropTypes.object,
    cancelMessage: PropTypes.object,
    formType: PropTypes.object,
    currentInstance: PropTypes.object,
    onCreateOrReAssign: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array,
};

export default CreateReAssignDialogComponent;
