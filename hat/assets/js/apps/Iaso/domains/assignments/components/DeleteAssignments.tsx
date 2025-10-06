import React, { FunctionComponent } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import { Button } from '@mui/material';
import {
    useSafeIntl,
    formatThousand,
    LoadingSpinner,
} from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { SxStyles } from 'Iaso/types/general';
import { useBulkDeleteAssignments } from '../hooks/requests/useBulkDeleteAssignments';
import MESSAGES from '../messages';
import { Planning } from '../types/planning';

const styles: SxStyles = {
    button: {
        ml: 2,
    },
    icon: {
        mr: 1,
    },
};

type Props = {
    planning?: Planning;
    disabled: boolean;
    count: number;
};

export const DeleteAssignments: FunctionComponent<Props> = ({
    planning,
    disabled,
    count,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: bulkDeleteAssignments, isLoading } =
        useBulkDeleteAssignments(planning?.id);
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <DeleteDialog
                titleMessage={{
                    ...MESSAGES.deleteAssignments,
                    values: {
                        name: planning?.name,
                    },
                }}
                message={{
                    ...MESSAGES.deleteAssignmentsWarning,
                    values: {
                        name: formatThousand(count),
                    },
                }}
                onConfirm={() =>
                    bulkDeleteAssignments({ planning: planning?.id })
                }
                Trigger={({ onClick }) => (
                    <Button
                        variant="outlined"
                        color="error"
                        size="medium"
                        onClick={onClick}
                        sx={styles.button}
                        disabled={disabled}
                    >
                        <ClearIcon sx={styles.icon} />
                        {formatMessage(MESSAGES.emptyAssignments)}
                    </Button>
                )}
            />
        </>
    );
};
