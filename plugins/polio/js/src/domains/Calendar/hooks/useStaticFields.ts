import { useSelector } from 'react-redux';
import { staticFields } from '../campaignCalendar/staticFields';
import { Field } from '../types';
import { User } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

export const useStaticFields = (isPdf = false): Field[] => {
    const isLogged = useSelector((state: { users: { current: User } }) =>
        Boolean(state.users.current),
    );
    let fields: Field[] = [...staticFields];
    if (isPdf) {
        fields = fields.filter((f: Field) => !f.exportHide);
    }
    if (!isLogged) {
        fields = fields.filter((f: Field) => f.key !== 'edit');
    }
    return fields;
};
