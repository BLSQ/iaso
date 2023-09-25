import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest } from 'Iaso/libs/Api';

// FIXME this looks like dead code
export const useGetCalendarXlsx = () => {
    return useSnackMutation(body =>
        postRequest('/api/polio/campaigns/create_calendar_xlsx_sheet/', body),
    );
};
