import { saveAction } from '../../redux/actions/formsActions';

const apiKey = 'tasks';

export const killTask = task => dispatch =>
    saveAction(
        dispatch,
        task,
        apiKey,
        'patchTaskSuccess',
        'patchTaskError',
        null,
        'ignoredTaskErrorCode',
    ).then(res => res);
