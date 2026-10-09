import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
} from 'react';
import {
    LoadingSpinner,
    useRedirectTo,
    useRedirectToReplace,
} from 'bluesquare-components';
import { isEqual, union } from 'lodash';
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
    isLoadingPlanning: boolean;
    mode: PageMode;
    missions: MissionPolymorphicList[];
    isFetchingMissions: boolean;
    addMissions: (missionIds: number[]) => void;
    createMission: () => void;
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
    isFetchingPlanning: boolean;
    mode: PageMode;
    newMissionId?: string;
    children: ReactNode;
};

const LoadedPlanningProvider: FC<LoadedPlanningProviderProps> = ({
    planning,
    isFetchingPlanning,
    mode,
    newMissionId,
    children,
}) => {
    // TODO Change to custom endpoint to get missions for given planning (this is just for testing)
    const { data: allMissions, isFetching: isFetchingMissions } =
        useApiMicroplanningMissionsList();

    const formik = usePlanningForm(planning, mode);
    const {
        values,
        initialValues,
        isValid,
        isSubmitting,
        handleSubmit,
        setFieldValue,
    } = formik;

    const missions = useMemo(
        () =>
            allMissions?.results?.filter(mission =>
                values.missions?.includes(mission.id),
            ) ?? [],
        [values.missions, allMissions],
    );

    const addMissions = useCallback(
        (missionIds: number[]) =>
            setFieldValue('missions', union(values.missions, missionIds)),
        [setFieldValue, values.missions],
    );

    // Drop the param once applied so a reload doesn't add the mission again.
    const redirectToReplace = useRedirectToReplace();
    useEffect(() => {
        if (!newMissionId) return;
        addMissions([Number(newMissionId)]);
        redirectToReplace(baseUrls.planningDetails, {
            planningId: `${planning.id}`,
            mode,
        });
    }, [newMissionId, addMissions, redirectToReplace, planning.id, mode]);

    const canSave =
        isValid &&
        !isSubmitting &&
        (mode === 'copy' || !isEqual(values, initialValues));

    const isLoadingPlanning = isSubmitting || isFetchingPlanning;

    const savePlanning = useCallback(() => handleSubmit(), [handleSubmit]);

    const redirectTo = useRedirectTo();
    const duplicatePlanning = useCallback(() => {
        redirectTo(baseUrls.planningDetails, {
            planningId: `${planning.id}`,
            mode: 'copy',
        });
    }, [redirectTo, planning.id]);

    const createMission = useCallback(() => {
        redirectTo(baseUrls.missionsCreate, {
            planningId: `${planning.id}`,
            planningMode: mode,
        });
    }, [redirectTo, planning.id, mode]);

    const value = useMemo(
        () => ({
            planning,
            isLoadingPlanning,
            mode,
            missions,
            isFetchingMissions,
            addMissions,
            createMission,
            formik,
            canSave,
            savePlanning,
            duplicatePlanning,
        }),
        [
            planning,
            isLoadingPlanning,
            mode,
            missions,
            isFetchingMissions,
            addMissions,
            createMission,
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
    newMissionId?: string;
    children: ReactNode;
};

export const PlanningProvider: FC<Props> = ({
    planningId,
    mode,
    newMissionId,
    children,
}) => {
    const {
        data: planning,
        isLoading,
        isFetching,
    } = useGetPlanningDetails(planningId);

    if (isLoading) {
        return <LoadingSpinner />;
    }
    if (!planning) {
        return null;
    }
    return (
        <LoadedPlanningProvider
            planning={planning}
            isFetchingPlanning={isFetching}
            mode={mode}
            newMissionId={newMissionId}
        >
            {children}
        </LoadedPlanningProvider>
    );
};
