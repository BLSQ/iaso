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
        options: { period: any; org_unit: any },
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

type DialogProps = {
    renderTrigger: any;
    defaultOpen: boolean;
    iconProps: any;
} & Props;
export const CreateReAssignDialog: FunctionComponent<DialogProps> = ({
    renderTrigger,
    defaultOpen = false,
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    iconProps = {}, // FIXME: Use when converting render trigger
    ...modalProps
}) => {
    const [openModal, setOpenModal] = useState<boolean>(defaultOpen ?? false);
    return (
        <>
            {/* // FIXME change render trigger in calling component */}
            {renderTrigger({
                openDialog: () => setOpenModal(true),
            })}
            {openModal && (
                <CreateReAssignDialogComponent
                    /* eslint-disable-next-line react/jsx-props-no-spreading */
                    {...modalProps}
                    closeDialog={() => setOpenModal(false)}
                    isOpen={openModal}
                />
            )}
        </>
    );
};

export default CreateReAssignDialog;
