import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
} from 'react';
import { LoadingSpinner, useRedirectTo } from 'bluesquare-components';
import { isEqual } from 'lodash';
import {
    MissionPolymorphicList,
    useApiMicroplanningMissionsList,
} from 'Iaso/api/missions';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetPlanningDetails } from '../hooks/requests/useGetPlanningDetails';
import { PlanningFormik, usePlanningForm } from '../hooks/usePlanningForm';
import { PageMode, Planning } from '../types';

type PlanningContextValue = {
    planning: Planning;
    mode: PageMode;
    missions: MissionPolymorphicList[];
    isFetchingMissions: boolean;
    formik: PlanningFormik;
    canSave: boolean;
    savePlanning: () => void;
    duplicatePlanning: () => void;
};

const PlanningContext = createContext<PlanningContextValue | undefined>(
    undefined,
);

export const usePlanningContext = (): PlanningContextValue => {
    const context = useContext(PlanningContext);
    if (!context) {
        throw new Error(
            'usePlanningContext must be used within a PlanningProvider',
        );
    }
    return context;
};

type LoadedPlanningProviderProps = {
    planning: Planning;
    mode: PageMode;
    children: ReactNode;
};

const LoadedPlanningProvider: FC<LoadedPlanningProviderProps> = ({
    planning,
    mode,
    children,
}) => {
    // TODO Change to custom endpoint to get missions for given planning (this is just for testing)
    const { data: allMissions, isFetching: isFetchingMissions } =
        useApiMicroplanningMissionsList();

    const missions = useMemo(
        () =>
            allMissions?.results?.filter(
                mission => planning.missions.indexOf(mission.id) >= 0,
            ) ?? [],
        [planning, allMissions],
    );

    const formik = usePlanningForm(planning, mode);
    const { values, initialValues, isValid, isSubmitting, handleSubmit } =
        formik;
    const canSave =
        isValid &&
        !isSubmitting &&
        (mode === 'copy' || !isEqual(values, initialValues));

    const savePlanning = useCallback(() => handleSubmit(), [handleSubmit]);

    const redirectTo = useRedirectTo();
    const duplicatePlanning = useCallback(() => {
        redirectTo(baseUrls.planningDetails, {
            planningId: `${planning.id}`,
            mode: 'copy',
        });
    }, [redirectTo, planning.id]);

    const value = useMemo(
        () => ({
            planning,
            mode,
            missions,
            isFetchingMissions,
            formik,
            canSave,
            savePlanning,
            duplicatePlanning,
        }),
        [
            planning,
            mode,
            missions,
            isFetchingMissions,
            formik,
            canSave,
            savePlanning,
            duplicatePlanning,
        ],
    );

    return (
        <PlanningContext.Provider value={value}>
            {children}
        </PlanningContext.Provider>
    );
};

type Props = {
    planningId: string;
    mode: PageMode;
    children: ReactNode;
};

export const PlanningProvider: FC<Props> = ({ planningId, mode, children }) => {
    const { data: planning, isLoading } = useGetPlanningDetails(planningId);

    if (isLoading) {
        return <LoadingSpinner />;
    }
    if (!planning) {
        return null;
    }
    return (
        <LoadedPlanningProvider planning={planning} mode={mode}>
            {children}
        </LoadedPlanningProvider>
    );
};
