import { useSelector } from 'react-redux';
import { staticFields } from '../campaignCalendar/staticFields';
import { Field } from '../types';

export const useStaticFields = (isPdf: boolean = false): Field[] => {
    const isLogged = useSelector((state: { users: { current: any } }) =>
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
