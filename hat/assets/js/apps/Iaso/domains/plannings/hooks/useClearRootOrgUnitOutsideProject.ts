import { useEffect, useRef } from 'react';
import { useGetPlanningRootOrgUnit } from './requests/useGetPlanningRootOrgUnit';
import { PlanningFormik } from './usePlanningForm';
import { useProjectOrgUnitTypeIds } from './useProjectOrgUnitTypeIds';

export const useClearRootOrgUnitOutsideProject = (
    formik: PlanningFormik,
): void => {
    const { values, setFieldValue, setFieldTouched } = formik;
    const { project, selectedOrgUnit } = values;
    const { orgUnitTypeIds, isFetching } = useProjectOrgUnitTypeIds(project);
    const { data: rootOrgUnit } = useGetPlanningRootOrgUnit(selectedOrgUnit);
    // Only react to project changes, not to an already saved inconsistent planning.
    const checkedProject = useRef(project);

    useEffect(() => {
        if (checkedProject.current === project) return;
        if (!project || !selectedOrgUnit) {
            checkedProject.current = project;
            return;
        }
        if (
            isFetching ||
            !orgUnitTypeIds ||
            rootOrgUnit?.id !== selectedOrgUnit
        )
            return;
        checkedProject.current = project;
        if (!orgUnitTypeIds.includes(rootOrgUnit.org_unit_type_id)) {
            setFieldTouched('selectedOrgUnit', false);
            setFieldValue('selectedOrgUnit', null);
        }
    }, [
        project,
        selectedOrgUnit,
        orgUnitTypeIds,
        isFetching,
        rootOrgUnit,
        setFieldValue,
        setFieldTouched,
    ]);
};
