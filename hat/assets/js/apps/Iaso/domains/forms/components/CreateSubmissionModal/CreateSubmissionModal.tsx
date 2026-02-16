import { makeFullModal } from 'bluesquare-components';
import {
    CreateReAssignDialogComponent,
    Props as DialogProps,
} from '../../../instances/components/CreateReAssignDialogComponent';
import { CreateSubmissionModalButton } from './CreateSubmissionModalButton';

type ButtonProps = {
    onClick: () => void;
    disabled?: boolean;
};

export const CreateSubmissionModal = makeFullModal<DialogProps, ButtonProps>(
    CreateReAssignDialogComponent,
    CreateSubmissionModalButton,
);
