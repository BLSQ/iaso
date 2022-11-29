import React, { FunctionComponent, useState } from 'react';
import { Typography } from '@material-ui/core';
// @ts-ignore
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { Period } from '../../periods/models';
import { isValidPeriod } from '../../periods/utils';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import PeriodPicker from '../../periods/components/PeriodPicker';

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
    // eslint-disable-next-line no-unused-vars
    onCreateOrReAssign: (_: any, __: any) => any;
    orgUnitTypes: number[];
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateReAssignDialogComponent: FunctionComponent<Props> = ({
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

    const onConfirm = () => {
        const currentFormOrInstanceProp = currentInstance || formType;
        onCreateOrReAssign(currentFormOrInstanceProp, {
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value?.id,
        });
        closeDialog();
    };

    const isPeriodRequired = Boolean(formType.periodType);
    return (
        <>
            <ConfirmCancelModal
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                open={isOpen}
                confirmMessage={confirmMessage}
                cancelMessage={cancelMessage}
                maxWidth="xs"
                allowConfirm={
                    Boolean(fieldValue.orgUnit.value) &&
                    isPeriodRequired &&
                    Boolean(fieldValue.period.value)
                }
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
