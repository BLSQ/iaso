import React, { FunctionComponent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { useGetBeneficiaryDetails } from '../../requests';
import { BeneficiaryDetailsContent } from './BeneficiaryDetailsContent';
import { QueryResultView } from './QueryResultView';

type DialogProps = {
    entityId: number | undefined;
    onClose: () => void;
};

// All the data of a beneficiary: entity, reference form and every submission linked to it
export const BeneficiaryDialog: FunctionComponent<DialogProps> = ({
    entityId,
    onClose,
}) => {
    const { formatMessage } = useSafeIntl();
    const query = useGetBeneficiaryDetails(entityId);
    return (
        <Dialog
            open={entityId !== undefined}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    py: 1.5,
                }}
            >
                {formatMessage(MESSAGES.beneficiaryData)}
                <IconButton
                    onClick={onClose}
                    sx={{ color: '#fff' }}
                    aria-label={formatMessage(MESSAGES.close)}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
                {entityId !== undefined && (
                    <QueryResultView
                        query={query}
                        errorMessage={formatMessage(MESSAGES.couldNotLoadData)}
                    >
                        {details => (
                            <BeneficiaryDetailsContent details={details} />
                        )}
                    </QueryResultView>
                )}
            </DialogContent>
        </Dialog>
    );
};
