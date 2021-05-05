import { Select } from './Select';
import { useGetOrgUnits } from '../../hooks/useGetOrgUnits';

export const OrgUnitsSelect = props => {
    const {
        data: { orgUnits = [] },
    } = useGetOrgUnits();

    return (
        <Select
            {...props}
            options={orgUnits.map(orgUnit => ({
                value: orgUnit.id,
                label: orgUnit.name,
            }))}
        />
    );
};

export default OrgUnitsSelect;
