import { UseMutationResult } from 'react-query';
import { iasoFetch } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import MESSAGES from '../messages';

// Django's LogoutView only accepts POST, protected by CSRF.
// `next` must be allow-listed in LOGOUT_NEXT_ALLOWED_PATHS, otherwise the server falls back to the login page.
const logout = async (next?: string): Promise<void> => {
    const url = next
        ? `/logout-iaso?next=${encodeURIComponent(next)}`
        : '/logout-iaso';
    const response = await iasoFetch(url, {
        method: 'POST',
        headers: { 'X-CSRFToken': window.CSRF_TOKEN },
    });
    // fetch already followed the server redirect: go where Django sent us
    window.location.href = response.url;
};

export const useLogout = (): UseMutationResult<void, unknown, string | void> =>
    useSnackMutation<void, unknown, string | void>({
        mutationFn: next => logout(next ?? undefined),
        snackErrorMsg: MESSAGES.logoutError,
        showSuccessSnackBar: false,
    });
