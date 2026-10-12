import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    LoadingSpinner,
    useRedirectTo,
    useRedirectToReplace,
} from 'bluesquare-components';
import { isEqual, union, unionBy, without } from 'lodash';
import {
    MissionPolymorphicList,
    MissionPolymorphicRetrieve,
    PaginatedMissionPolymorphicListList,
    useApiMicroplanningMissionsList,
    useApiMicroplanningMissionsRetrieve,
} from 'Iaso/api/missions';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetPlanningDetails } from '../hooks/requests/useGetPlanningDetails';
import { PlanningFormik, usePlanningForm } from '../hooks/usePlanningForm';
import { PageMode, Planning } from '../types';

const toMissionListItem = ({
    description: _description,
    forms,
    ...mission
}: MissionPolymorphicRetrieve): MissionPolymorphicList => ({
    ...mission,
    forms_count: forms.length,
});

type PlanningContextValue = {
    planning: Planning;
    isLoadingPlanning: boolean;
    mode: PageMode;
    savedMissions?: PaginatedMissionPolymorphicListList;
    pendingMissions: MissionPolymorphicList[];
    isFetchingMissions: boolean;
    setMissionsPage: (page: number) => void;
    addMissions: (missions: MissionPolymorphicList[]) => void;
    unlinkMission: (missionId: number) => void;
    relinkMission: (missionId: number) => void;
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
    const formik = usePlanningForm(planning, mode);
    const {
        values,
        initialValues,
        isValid,
        isSubmitting,
        handleSubmit,
        setFieldValue,
    } = formik;

    const [missionsPage, setMissionsPage] = useState(1);
    const { data: savedMissions, isFetching: isFetchingMissions } =
        useApiMicroplanningMissionsList(
            { planning_ids: [planning.id], page: missionsPage, limit: 10 },
            { query: { keepPreviousData: true } },
        );

    // Keep the data of missions picked before saving rather than refetching it.
    const [addedMissions, setAddedMissions] = useState<
        MissionPolymorphicList[]
    >([]);
    const pendingMissions = useMemo(
        () =>
            addedMissions.filter(
                mission =>
                    values.missions?.includes(mission.id) &&
                    !initialValues.missions?.includes(mission.id),
            ),
        [addedMissions, values.missions, initialValues.missions],
    );

    const addMissions = useCallback(
        (missions: MissionPolymorphicList[]) => {
            setAddedMissions(previous => unionBy(previous, missions, 'id'));
            setFieldValue(
                'missions',
                union(
                    values.missions,
                    missions.map(mission => mission.id),
                ),
            );
        },
        [setFieldValue, values.missions],
    );

    const unlinkMission = useCallback(
        (missionId: number) =>
            setFieldValue('missions', without(values.missions, missionId)),
        [setFieldValue, values.missions],
    );

    const relinkMission = useCallback(
        (missionId: number) =>
            setFieldValue('missions', union(values.missions, [missionId])),
        [setFieldValue, values.missions],
    );

    const { data: newMission } = useApiMicroplanningMissionsRetrieve(
        Number(newMissionId),
        {
            query: {
                enabled: Boolean(newMissionId),
                select: toMissionListItem,
            },
        },
    );

    // Drop the param once applied so a reload doesn't add the mission again.
    const redirectToReplace = useRedirectToReplace();
    useEffect(() => {
        if (!newMission) return;
        addMissions([newMission]);
        redirectToReplace(baseUrls.planningDetails, {
            planningId: `${planning.id}`,
            mode,
        });
    }, [newMission, addMissions, redirectToReplace, planning.id, mode]);

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
            savedMissions,
            pendingMissions,
            isFetchingMissions,
            setMissionsPage,
            addMissions,
            unlinkMission,
            relinkMission,
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
            savedMissions,
            pendingMissions,
            isFetchingMissions,
            setMissionsPage,
            addMissions,
            unlinkMission,
            relinkMission,
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
