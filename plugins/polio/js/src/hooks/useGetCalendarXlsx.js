import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { postRequest } from 'Iaso/libs/Api';

export const useGetCalendarXlsx = () => {
    return useSnackMutation(
        body => postRequest('/api/polio/campaigns/create_calendar_xlsx_sheet/', body)
    );
};

