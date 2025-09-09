import React, { FunctionComponent, useState } from 'react';
import UpdateIcon from '@mui/icons-material/Update';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { UseMutateAsyncFunction } from 'react-query';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { Period } from '../../periods/models';
import { isValidPeriod } from '../../periods/utils';
import { ReassignInstancePayload } from '../hooks/useReassignInstance';
import MESSAGES from '../messages';

type Props = {
    titleMessage: any;
    confirmMessage: any;
    cancelMessage: any;
    formType: {
        id: number | string;
        periodType: string;
    };
    currentInstance?: {
        id: number;
        period?: string;
        // eslint-disable-next-line camelcase
        org_unit?: any;
    };
    onCreateOrReAssign: UseMutateAsyncFunction<
        unknown,
        unknown,
        ReassignInstancePayload,
        unknown
    >;
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
    const [fieldValue, setFieldValue] = useState(() => {
        let initialPeriod: string | undefined;
        const initialPeriodErrors: string[] = [];
        if (currentInstance) {
            initialPeriod = currentInstance.period;
            const isOriginalPeriodValid = isValidPeriod(
                initialPeriod,
                formType.periodType,
            );
            if (!isOriginalPeriodValid) {
                initialPeriodErrors.push(
                    formatMessage(MESSAGES.initialPeriodError, {
                        period: currentInstance.period,
                    }),
                );
            }
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
            period: { value: initialPeriod, errors: initialPeriodErrors },
        };
    });
    const isPeriodRequired = Boolean(formType.periodType);
    const allowConfirm =
        Boolean(fieldValue.orgUnit.value) &&
        (!isPeriodRequired || Boolean(fieldValue.period.value));
    // TODO Above logic should be moved to Formik

    const onConfirm = () => {
        const currentFormOrInstanceProp = currentInstance || formType;
        onCreateOrReAssign({
            currentInstance: currentFormOrInstanceProp,
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value?.id,
        });
        // TODO Better error handling
        closeDialog();
    };

    return (
        // @ts-ignore
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            open={isOpen}
            confirmMessage={confirmMessage}
            cancelMessage={cancelMessage}
            maxWidth="xs"
            allowConfirm={allowConfirm}
            closeDialog={closeDialog}
            onClose={closeDialog}
            onCancel={closeDialog}
        >
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
                                errors: [],
                                value,
                            },
                        });
                    }}
                    activePeriodString={fieldValue.period.value}
                    errors={fieldValue.period.errors}
                />
            )}
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
        </ConfirmCancelModal>
    );
};

const CreateReAssignDialog = makeFullModal(
    CreateReAssignDialogComponent,
    AddButton,
);

export const ReAssignDialog = makeFullModal(
    CreateReAssignDialogComponent,
    UpdateIcon,
);

export { CreateReAssignDialog };
