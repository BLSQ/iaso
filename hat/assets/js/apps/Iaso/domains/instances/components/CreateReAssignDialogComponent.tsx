import React, { FunctionComponent, useState } from 'react';
import { Typography } from '@material-ui/core';
// @ts-ignore
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { Period } from '../../periods/models';
import { isValidPeriod } from '../../periods/utils';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { Instance } from '../types/instance';

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
        // eslint-disable-next-line camelcase
        org_unit?: any;
    };
    onCreateOrReAssign: (
        // eslint-disable-next-line no-unused-vars
        instanceOrForm: Instance | { id: number },
        // eslint-disable-next-line no-unused-vars,camelcase
        payload: { period: any; org_unit: any },
    ) => void;
    orgUnitTypes: number[];
    isOpen: boolean;
    closeDialog: () => void;
};

export const CreateReAssignDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    confirmMessage = MESSAGES.ok,
    cancelMessage = MESSAGES.cancel,
    formType,
    currentInstance,
    onCreateOrReAssign,
    orgUnitTypes = [],
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const [fieldValue, setFieldValue] = React.useState(() => {
        let initialPeriod: string | undefined;
        if (currentInstance) {
            initialPeriod = currentInstance?.period;
        } else if (formType.periodType) {
            // On creation make a default period
            const toDay = new Date();
            const period = new Period(
                toDay.getFullYear() + `0${toDay.getMonth() + 1}`.slice(-2),
            );
            initialPeriod = period.asPeriodType(
                formType.periodType,
            ).periodString;
        }
        return {
            orgUnit: { value: currentInstance?.org_unit, errors: [] },
            period: { value: initialPeriod, errors: [] },
        };
    });
    const isPeriodRequired = Boolean(formType.periodType);
    const allowConform =
        Boolean(fieldValue.orgUnit.value) &&
        isPeriodRequired &&
        Boolean(fieldValue.period.value);
    // TODO Above logic should be moved to Formik
    const isOriginalPeriodValid = isValidPeriod(
        currentInstance?.period,
        formType.periodType,
    );

    const onConfirm = () => {
        const currentFormOrInstanceProp = currentInstance || formType;
        onCreateOrReAssign(currentFormOrInstanceProp, {
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value?.id,
        });
        closeDialog();
    };

    return (
        <>
            <ConfirmCancelModal
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                open={isOpen}
                confirmMessage={confirmMessage}
                cancelMessage={cancelMessage}
                maxWidth="xs"
                allowConfirm={allowConform}
                closeDialog={closeDialog}
                onCancel={closeDialog}
            >
                {!isOriginalPeriodValid && (
                    <Typography color="error">
                        Current period on Instance is invalid:
                        {currentInstance?.period}
                    </Typography>
                )}
                {isPeriodRequired && (
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
            </ConfirmCancelModal>
        </>
    );
};
