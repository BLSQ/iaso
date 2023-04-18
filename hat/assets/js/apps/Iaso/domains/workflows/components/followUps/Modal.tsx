import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    QueryBuilder,
    QueryBuilderFields,
    AddButton,
} from 'bluesquare-components';

import { Grid, Box, useTheme } from '@material-ui/core';
import InputComponent from '../../../../components/forms/InputComponent';
import { EditIconButton } from '../ModalButtons';
import { commaSeparatedIdsToArray } from '../../../../utils/forms';
import { Popper } from '../../../forms/fields/components/Popper';

import { useGetForms } from '../../hooks/requests/useGetForms';
import { useBulkUpdateWorkflowFollowUp } from '../../hooks/requests/useBulkUpdateWorkflowFollowUp';
import { useCreateWorkflowFollowUp } from '../../hooks/requests/useCreateWorkflowFollowUp';
import { parseJson, JSONValue } from '../../../instances/utils/jsonLogicParse';

import MESSAGES from '../../messages';

import { FollowUps } from '../../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    followUp?: FollowUps;
    fields?: QueryBuilderFields;
    versionId: string;
    newOrder?: number;
};
type JsonLogicResult = {
    logic?: JSONValue;
    data?: Record<any, any>;
    errors?: Array<string>;
};

const FollowUpsModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    followUp,
    fields,
    versionId,
    newOrder,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();

    const [logic, setLogic] = useState<JSONValue | undefined>(
        followUp?.condition,
    );
    const [formIds, setForms] = useState<number[]>(
        followUp?.forms.map(form => form.id) || [],
    );
    const { mutate: saveFollowUp } = useBulkUpdateWorkflowFollowUp();
    const { mutate: createFollowUp } = useCreateWorkflowFollowUp(
        closeDialog,
        versionId,
    );
    const { data: forms, isFetching: isFetchingForms } = useGetForms();

    const handleConfirm = useCallback(() => {
        if (followUp?.id) {
            saveFollowUp([
                {
                    id: followUp.id,
                    order: followUp.order,
                    condition: logic || true,
                    form_ids: formIds,
                },
            ]);
        } else {
            createFollowUp({
                condition: logic || true,
                form_ids: formIds,
                order: newOrder || 0,
            });
        }
    }, [
        createFollowUp,
        followUp?.id,
        followUp?.order,
        formIds,
        logic,
        newOrder,
        saveFollowUp,
    ]);
    const formsList = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
    const handleChangeLogic = (result: JsonLogicResult) => {
        let parsedValue;
        if (result?.logic && fields)
            parsedValue = parseJson({
                value: result.logic,
                fields,
            });
        setLogic(parsedValue);
    };
    const allowConfirm = formIds.length > 0;
    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
            titleMessage={
                followUp?.id
                    ? formatMessage(MESSAGES.editFollowUp)
                    : formatMessage(MESSAGES.createFollowUp)
            }
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="md"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="workflow-follow-up"
            id="workflow-follow-up"
            onClose={() => null}
        >
            <Box position="relative" data-test="follow-up-modal">
                <Box
                    position="absolute"
                    top={theme.spacing(-7)}
                    right={theme.spacing(-3)}
                >
                    <Popper />
                </Box>
                {fields && (
                    <QueryBuilder
                        logic={logic}
                        fields={fields}
                        onChange={handleChangeLogic}
                        currentDateString="current_date"
                        currentDateTimeString="current_datetime"
                    />
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <InputComponent
                            type="select"
                            keyValue="forms"
                            onChange={(_, value) =>
                                setForms(commaSeparatedIdsToArray(value))
                            }
                            value={formIds.join(',')}
                            label={MESSAGES.forms}
                            required
                            multi
                            options={formsList}
                            loading={isFetchingForms}
                        />
                    </Grid>
                    <Grid item xs={12} md={4} />
                </Grid>
            </Box>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(FollowUpsModal, EditIconButton);
const AddModalWithButton = makeFullModal(FollowUpsModal, AddButton);

export {
    modalWithButton as FollowUpsModal,
    AddModalWithButton as AddFollowUpsModal,
};
