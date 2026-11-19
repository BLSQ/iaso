import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';
import { Typography } from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';

const styles = {
    note: { mt: 2 },
} satisfies SxStyles;

type ConfirmPublishedChange = (change: () => void) => void;

const PublishedPlanningConfirmationContext = createContext<
    ConfirmPublishedChange | undefined
>(undefined);

// Runs the change, after asking once per visit of the page when the planning is published.
export const useConfirmPublishedChange = (): ConfirmPublishedChange => {
    const confirm = useContext(PublishedPlanningConfirmationContext);
    if (!confirm) {
        throw new Error(
            'useConfirmPublishedChange must be used within a PublishedPlanningConfirmationProvider',
        );
    }
    return confirm;
};

type Props = {
    children: ReactNode;
};

export const PublishedPlanningConfirmationProvider: FC<Props> = ({
    children,
}) => {
    const { formatMessage } = useSafeIntl();
    const { planning } = useAssignmentsContext();
    const [hasConfirmed, setHasConfirmed] = useState(false);
    const [pendingChange, setPendingChange] = useState<() => void>();

    const confirmPublishedChange = useCallback<ConfirmPublishedChange>(
        change => {
            if (planning.status !== 'published' || hasConfirmed) {
                change();
                return;
            }
            setPendingChange(() => change);
        },
        [planning.status, hasConfirmed],
    );
    const handleCancel = useCallback(() => setPendingChange(undefined), []);
    const handleConfirm = useCallback(() => {
        setHasConfirmed(true);
        pendingChange?.();
        setPendingChange(undefined);
    }, [pendingChange]);

    return (
        <PublishedPlanningConfirmationContext.Provider
            value={confirmPublishedChange}
        >
            {children}
            <ConfirmCancelModal
                open={Boolean(pendingChange)}
                id="published-planning-confirmation"
                dataTestId="published-planning-confirmation"
                titleMessage={formatMessage(
                    MESSAGES.publishedPlanningConfirmationTitle,
                )}
                onClose={handleCancel}
                closeDialog={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.confirm}
            >
                <Typography>
                    {formatMessage(MESSAGES.publishedPlanningConfirmationText)}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={styles.note}
                >
                    {formatMessage(MESSAGES.publishedPlanningConfirmationNote)}
                </Typography>
            </ConfirmCancelModal>
        </PublishedPlanningConfirmationContext.Provider>
    );
};
