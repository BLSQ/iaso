import { defineMessage } from 'react-intl';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

export const useRemovePage = () =>
    useSnackMutation<any, any, string>(
        (slug: string) => deleteRequest(`/api/pages/${slug}`),
        defineMessage({
            defaultMessage: 'Embedded link successfully removed',
            id: 'iaso.page.deleteSuccess',
        }),
        defineMessage({
            defaultMessage: 'Error removing embedded link',
            id: 'iaso.page.deleteError',
        }),
        ['iaso', 'pages'],
    );
