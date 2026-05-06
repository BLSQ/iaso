import React, { useMemo } from 'react';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import { Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { baseUrls } from 'Iaso/constants/urls';
import { ProjectChip } from 'Iaso/domains/projects/components/ProjectChip';
import { StatusChip } from 'Iaso/domains/validationWorkflowInstances/components/StatusChip';
import { getLocaleDateFormat } from 'Iaso/utils/dates';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';
type ValidationWorkflowInstanceSearchColumnsProps = {
    currentUser: ReturnType<typeof useCurrentUser>;
};

export const useValidationWorkflowInstanceSearchColumns = ({
    currentUser,
}: ValidationWorkflowInstanceSearchColumnsProps): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: '',
                id: 'infos',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    return (
                        <Box display={'flex'} justifyContent={'space-around'}>
                            {settings?.row?.original
                                ?.user_has_been_involved && (
                                <Tooltip
                                    title={formatMessage(
                                        MESSAGES.userHasBeenInvolvedTooltip,
                                    )}
                                >
                                    <PersonIcon color={'action'} />
                                </Tooltip>
                            )}
                            {settings?.row?.original?.requires_user_action && (
                                <Tooltip
                                    title={formatMessage(
                                        MESSAGES.requiresUserActionTooltip,
                                    )}
                                >
                                    <PendingActionsIcon color={'action'} />
                                </Tooltip>
                            )}
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.status),
                id: 'general_validation_status',
                accessor: 'general_validation_status',
                sortable: true,
                Cell: settings => <StatusChip status={settings.value} />,
            },
            {
                Header: formatMessage(MESSAGES.project),
                id: 'project__name',
                accessor: 'project',
                sortable: false,
                Cell: settings => <ProjectChip project={settings.value} />,
            },
            {
                Header: formatMessage(MESSAGES.form),
                id: 'form__name',
                sortable: false,
                accessor: 'form.name',
            },
            {
                Header: formatMessage(MESSAGES.last_updated_at),
                id: 'last_updated',
                sortable: true,
                accessor: 'last_updated',
                Cell: settings =>
                    settings?.value
                        ? moment(settings?.value).format(
                              getLocaleDateFormat('LTS'),
                          )
                        : textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => (
                    <section>
                        <IconButton
                            url={`/${baseUrls.instanceDetail}/referenceFormId/${settings.row.original.form.id}/instanceId/${settings.row.original.id}/accountId/${currentUser.account?.id}/`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewSubmissionDetails}
                        />
                    </section>
                ),
            },
        ],
        [currentUser],
    );
};
