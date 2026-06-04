import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { Box, Table, TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import {
    ApiAccountsAiApiKeyRetrieveQueryResult,
    ApiAccountsRetrieveQueryResult,
    useApiAccountsAiApiKeyDestroy,
} from 'Iaso/api/accounts';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { EditAIApiKey } from 'Iaso/domains/accounts/components/modals/EditAIApiKeyModal';
import { userHasAccessToModule } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';

type Props = {
    accountId: number;
    account: ApiAccountsRetrieveQueryResult;
    AIApiKey?: ApiAccountsAiApiKeyRetrieveQueryResult;
};
export const GeneralInfoPanel = ({ accountId, account, AIApiKey }: Props) => {
    const { formatMessage } = useSafeIntl();
    const user = useCurrentUser();
    const { mutateAsync: deleteAIApiKey } = useApiAccountsAiApiKeyDestroy();
    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.generalInfoTitle)}
            data-testid={'accounts-general'}
        >
            <Table>
                <TableBody>
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.name),
                            value: account.name,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.created_at),
                            value: account.created_at,
                        }}
                    />

                    <Row
                        field={{
                            label: formatMessage(MESSAGES.userManualPath),
                            value: account?.user_manual_path,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.forumPath),
                            value: account?.forum_path,
                        }}
                    />
                    {userHasAccessToModule('FORM_AI', user) && (
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.anthropicAPIKey),
                                value: (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {AIApiKey?.anthropic_api_key ??
                                            textPlaceholder}
                                        <Box>
                                            <EditAIApiKey
                                                accountId={accountId}
                                            />
                                            {AIApiKey?.anthropic_api_key && (
                                                <DeleteModal
                                                    type={'icon'}
                                                    onConfirm={() =>
                                                        deleteAIApiKey({
                                                            id: accountId,
                                                        })
                                                    }
                                                    titleMessage={formatMessage(
                                                        MESSAGES.deleteAIApiKey,
                                                    )}
                                                    backdropClick
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                ),
                            }}
                        />
                    )}
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.forceStrongPassword),
                            value: account?.enforce_password_validation ? (
                                <CheckIcon
                                    color={'success'}
                                    aria-label={formatMessage(MESSAGES.yes)}
                                />
                            ) : (
                                <ClearIcon
                                    color={'error'}
                                    aria-label={formatMessage(MESSAGES.no)}
                                />
                            ),
                        }}
                    />
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
