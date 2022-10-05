import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { waitFor } from '../../../../../../../hat/assets/js/apps/Iaso/utils';

const getSteps = async () => {
    await waitFor(1000);
    return [
        {
            key: 'submitted_to_rrt',
            label: 'Submitted to RRT',
        },
        {
            key: 'sent_to_ORPG',
            label: 'Sent to ORPG',
        },
        {
            key: 'feedback_to_gpei',
            label: 'Feedback sent to GPEI',
        },
    ];
};

export const useGetStatusDropDown = () => {
    return useSnackQuery({
        queryFn: () => getSteps(),
        queryKey: ['stepOptions'],
        options: {
            select: data => {
                if (!data) return [];
                return data.map(status => {
                    return {
                        label: status.label,
                        value: status.key,
                    };
                });
            },
        },
    });
};
