import React, { FunctionComponent, useState, useMemo } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
    // @ts-ignore
    QueryBuilder,
    // @ts-ignore
    QueryBuilderFields,
} from 'bluesquare-components';

import { Grid } from '@material-ui/core';
import InputComponent from '../../../components/forms/InputComponent';
import { EditIconButton } from './ModalButtons';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

import { useGetForms } from '../hooks/requests/useGetForms';
import { parseJson, JSONValue } from '../../instances/utils/jsonLogicParse';

import MESSAGES from '../messages';

import { FollowUps } from '../types/workflows';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    followUp: FollowUps;
    fields?: QueryBuilderFields;
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
}) => {
    const { formatMessage } = useSafeIntl();

    const [logic, setLogic] = useState<JSONValue | undefined>(
        followUp.condition,
    );
    const [formIds, setForms] = useState<number[]>(
        followUp.forms.map(form => form.id),
    );
    const handleConfirm = () => {
        return null;
    };
    const { data: forms, isLoading: isLoadingForms } = useGetForms();

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
        if (result?.logic)
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
            titleMessage={formatMessage(MESSAGES.editFollowUp)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="md"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="add-workflow-version"
            id="add-workflow-version"
            onClose={() => null}
        >
            <QueryBuilder
                logic={logic}
                fields={fields}
                onChange={handleChangeLogic}
            />
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
                        loading={isLoadingForms}
                    />
                </Grid>
                <Grid item xs={12} md={4} />
            </Grid>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(FollowUpsModal, EditIconButton);

export { modalWithButton as FollowUpsModal };
