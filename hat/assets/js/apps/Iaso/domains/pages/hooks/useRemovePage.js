import { defineMessage } from 'react-intl';
import { useSnackMutation } from 'iaso/libs/apiHooks';
import { deleteRequest } from 'iaso/libs/Api';

export const useRemovePage = () =>
    useSnackMutation(
        slug => deleteRequest(`/api/pages/${slug}`),
        defineMessage({
            defaultMessage: 'Page successfully removed',
            id: 'iaso.page.deleteSuccess',
        }),
        defineMessage({
            defaultMessage: 'Error removing page',
            id: 'iaso.page.deleteError',
        }),
        ['iaso', 'pages'],
    );
