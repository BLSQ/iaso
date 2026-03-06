import { makeFullModal } from 'bluesquare-components';
import {
    CreateReAssignDialogComponent,
    CreateReAssignDialogProps,
} from '../../../instances/components/CreateReAssignDialogComponent';
import { CreateSubmissionModalButton } from './CreateSubmissionModalButton';

type ButtonProps = {
    onClick: () => void;
    disabled: boolean;
};

export const CreateSubmissionModal = makeFullModal<
    CreateReAssignDialogProps,
    ButtonProps
>(CreateReAssignDialogComponent, CreateSubmissionModalButton);
