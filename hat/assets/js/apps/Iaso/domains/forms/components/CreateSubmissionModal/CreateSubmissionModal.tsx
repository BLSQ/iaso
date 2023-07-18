import { makeFullModal } from 'bluesquare-components';
import { CreateReAssignDialogComponent } from '../../../instances/components/CreateReAssignDialogComponent';
import { CreateSubmissionModalButton } from './CreateSubmissionModalButton';

export const CreateSubmissionModal = makeFullModal(
    CreateReAssignDialogComponent,
    CreateSubmissionModalButton,
);
