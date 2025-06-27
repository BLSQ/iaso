import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useState,
} from 'react';
import { Tabs, Tab, Box, useTheme, Button, Paper } from '@mui/material';
import {
    JsonLogicTree,
    JsonLogicResult,
    Fields,
} from '@react-awesome-query-builder/mui';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    JsonLogicEditor,
    QueryBuilder,
} from 'bluesquare-components';
import MESSAGES from '../../messages';
import { FormBuilder } from './FormBuilder';
import { TriggerModal } from './TriggerModal';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    initialLogic?: JsonLogicTree;
    fields: Fields;
    // eslint-disable-next-line no-unused-vars
    onChange: (logic?: JsonLogicTree) => void;
    InfoPopper?: ReactNode;
};

const DialogBuilder: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    initialLogic,
    onChange,
    InfoPopper,
}) => {
    const { formatMessage } = useSafeIntl();
    const [formIds, setFormIds] = useState<(string | undefined)[]>([undefined]);
    console.log('formIds', formIds);
    const theme = useTheme();
    const [tab, setTab] = useState<string>('query');

    const handleConfirm = () => {
        closeDialog();
        // compute the logic
    };
    const handleChangeForm = useCallback((newFormId: string, index: number) => {
        setFormIds(prev => {
            const updated = [...prev];
            updated[index] = newFormId;
            return updated;
        });
    }, []);

    const handleDeleteForm = useCallback((index: number) => {
        setFormIds(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    }, []);
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
    };
    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.queryBuilder}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xl"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="entities-query-builder"
            id="entities-query-builder"
            onClose={() => null}
        >
            <Box position="relative">
                {/* allow to display an popper with informations about the fields used */}
                {InfoPopper && (
                    <Box
                        position="absolute"
                        top={theme.spacing(-7)}
                        right={theme.spacing(-3)}
                    >
                        {InfoPopper}
                    </Box>
                )}
                {/* <Tabs
                    value={tab}
                    onChange={(_, newtab) => handleChangeTab(newtab)}
                >
                    <Tab
                        value="query"
                        label={formatMessage(MESSAGES.queryTab)}
                    />
                    <Tab value="json" label={formatMessage(MESSAGES.jsonTab)} />
                </Tabs> */}

                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor: 'grey.100',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                        p: 1,
                    }}
                >
                    {Array.from(formIds).map((formId, index) => (
                        <FormBuilder
                            key={formId || `new-form-${index}`}
                            formId={formId}
                            changeForm={newFormId =>
                                handleChangeForm(newFormId, index)
                            }
                            deleteForm={() => handleDeleteForm(index)}
                            deleteDisabled={formIds.length === 1}
                        />
                    ))}
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            onClick={() =>
                                setFormIds(prev => [...prev, undefined])
                            }
                        >
                            + {formatMessage(MESSAGES.addForm)}
                        </Button>
                    </Box>
                </Paper>
                {/* {tab === 'json' && (
                    <JsonLogicEditor
                        initialLogic={logic}
                        changeLogic={newLogic => setLogic(newLogic)}
                    />
                )} */}
            </Box>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(DialogBuilder, TriggerModal);

export { modalWithButton as DialogBuilder };
