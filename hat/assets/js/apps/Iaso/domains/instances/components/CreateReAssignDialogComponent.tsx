import React, { FunctionComponent, useCallback, useRef } from 'react';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { Period } from '../../periods/models';
import { isValidPeriod } from '../../periods/utils';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@material-ui/core';

type Props = {
    titleMessage: any;
    confirmMessage: any;
    cancelMessage: any;
    formType: {
        id?: number;
        periodType: string;
    };
    currentInstance?: {
        id: number;
        period?: string;
        org_unit?: any;
    };
    onCreateOrReAssign: (_: any, _: any) => any;
    renderTrigger: (any) => any;
    orgUnitTypes: number[];
};

const CreateReAssignDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    confirmMessage = MESSAGES.ok,
    cancelMessage = MESSAGES.cancel,
    renderTrigger,
    formType,
    currentInstance,
    onCreateOrReAssign,
    orgUnitTypes = [],
}) => {
    const { formatMessage } = useSafeIntl();
    const currentFormOrInstanceProp = currentInstance || formType;
    const currentFormOrInstance = { ...currentFormOrInstanceProp };

    const [fieldValue, setFieldValue] = React.useState(() => {
        let initialPeriod = currentInstance?.period;
        // if this is a new Submission or there isn't a current permission calculate
        // an initial
        if (initialPeriod === undefined || initialPeriod === '') {
            // We don't have a current Period
            const toDay = new Date();
            const period = new Period(
                toDay.getFullYear() + `0${toDay.getMonth() + 1}`.slice(-2),
            );
            if (
                formType.periodType !== null &&
                formType.periodType !== undefined
            ) {
                initialPeriod = period.asPeriodType(
                    formType.periodType,
                ).periodString;
            }
        }
        return {
            orgUnit: { value: currentInstance?.org_unit, errors: [] },
            period: { value: initialPeriod, errors: [] },
        };
    });
    const isOriginalPeriodValid = isValidPeriod(
        currentInstance?.period,
        formType.periodType,
    );

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

    const isPeriodDisabled = formType.periodType;
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
            {!isOriginalPeriodValid && (
                <Typography color="error">
                    Current period on Instance is invalid:
                    {currentInstance?.period}
                </Typography>
            )}
            {formType.periodType && (
                <PeriodPicker
                    title={formatMessage(MESSAGES.period)}
                    periodType={formType.periodType}
                    keyName="period"
                    onChange={value => {
                        setFieldValue({
                            ...fieldValue,
                            period: {
                                ...fieldValue.period,
                                value,
                            },
                        });
                    }}
                    activePeriodString={fieldValue.period.value}
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

export default CreateReAssignDialogComponent;
