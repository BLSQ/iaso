import { defineMessage } from 'react-intl';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { deleteRequest } from 'Iaso/libs/Api';

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
