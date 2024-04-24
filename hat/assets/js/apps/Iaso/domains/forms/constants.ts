import MESSAGES from './messages';

export const CR_MODE_NONE = 'CR_MODE_NONE';
export const CR_MODE_IF_REFERENCE_FORM = 'CR_MODE_IF_REFERENCE_FORM';
export const changeRequestModeOptions = [
    CR_MODE_NONE,
    CR_MODE_IF_REFERENCE_FORM,
].map(changeRequestMode => ({
    value: changeRequestMode,
    label: MESSAGES[changeRequestMode.toLowerCase()],
}));
