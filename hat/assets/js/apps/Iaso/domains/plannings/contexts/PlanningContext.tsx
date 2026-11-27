import React, {
    FC,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { LoadingSpinner, useRedirectTo } from 'bluesquare-components';
import { isEmpty, isEqual, union, unionBy, without } from 'lodash';
import { useApiMicroplanningMissionsList } from 'Iaso/api/missions/endpoints/missions/missions';
import { MissionPolymorphicList } from 'Iaso/api/missions/models/missionPolymorphicList.zod';
import { PaginatedMissionPolymorphicListList } from 'Iaso/api/missions/models/paginatedMissionPolymorphicListList.zod';
import { useApiMicroplanningPlanningsConfigsList } from 'Iaso/api/plannings/endpoints/micro-plannings/micro-plannings';
import { baseUrls } from 'Iaso/constants/urls';
import { SavedPlanningConfig } from '../components/orgUnitLevels/types';
import { useGetPlanningDetails } from '../hooks/requests/useGetPlanningDetails';
import { useClearRootOrgUnitOutsideProject } from '../hooks/useClearRootOrgUnitOutsideProject';
import { useMissingFieldsSnackBar } from '../hooks/useMissingFieldsSnackBar';
import { PlanningFormik, usePlanningForm } from '../hooks/usePlanningForm';
import { PageMode, Planning } from '../types';
import { shouldWarnBeforeSave } from '../utils';

type PlanningContextValue = {
    planning?: Planning;
    isLoadingPlanning: boolean;
    mode: PageMode;
    savedMissions?: PaginatedMissionPolymorphicListList;
    pendingMissions: MissionPolymorphicList[];
    isFetchingMissions: boolean;
    setMissionsPage: (page: number) => void;
    addMissions: (missions: MissionPolymorphicList[]) => void;
    unlinkMission: (missionId: number) => void;
    relinkMission: (missionId: number) => void;
    updatePendingMission: (mission: MissionPolymorphicList) => void;
    formik: PlanningFormik;
    isReadOnly: boolean;
    canSave: boolean;
    savePlanning: () => void;
    isSaveWarningOpen: boolean;
    confirmSave: () => void;
    closeSaveWarning: () => void;
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
    planning?: Planning;
    savedConfigs: SavedPlanningConfig[];
    isFetchingPlanning: boolean;
    mode: PageMode;
    children: ReactNode;
};

const LoadedPlanningProvider: FC<LoadedPlanningProviderProps> = ({
    planning,
    savedConfigs,
    isFetchingPlanning,
    mode,
    children,
}) => {
    const formik = usePlanningForm(planning, savedConfigs, mode);
    useClearRootOrgUnitOutsideProject(formik);
    const {
        values,
        initialValues,
        isSubmitting,
        handleSubmit,
        validateForm,
        setFieldValue,
    } = formik;

    const [missionsPage, setMissionsPage] = useState(1);
    const { data: savedMissions, isFetching: isFetchingMissions } =
        useApiMicroplanningMissionsList(
            {
                planning_ids: planning ? [planning.id] : [],
                page: missionsPage,
                limit: 10,
            },
            { query: { enabled: Boolean(planning), keepPreviousData: true } },
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

    const updatePendingMission = useCallback(
        (updatedMission: MissionPolymorphicList) =>
            setAddedMissions(previous =>
                previous.map(mission =>
                    mission.id === updatedMission.id ? updatedMission : mission,
                ),
            ),
        [],
    );

    const isReadOnly = Boolean(planning?.deprecated);
    const canSave =
        !isReadOnly &&
        !isSubmitting &&
        (mode === 'copy' || !isEqual(values, initialValues));

    const isLoadingPlanning = isSubmitting || isFetchingPlanning;

    const [isSaveWarningOpen, setIsSaveWarningOpen] = useState(false);
    const { openMissingFieldsSnackBar, closeMissingFieldsSnackBar } =
        useMissingFieldsSnackBar();
    const shouldWarn = shouldWarnBeforeSave(formik, mode);
    const savePlanning = useCallback(async () => {
        const errors = await validateForm();
        if (!isEmpty(errors)) {
            openMissingFieldsSnackBar(errors);
            handleSubmit();
            return;
        }
        closeMissingFieldsSnackBar();
        if (shouldWarn) {
            setIsSaveWarningOpen(true);
        } else {
            handleSubmit();
        }
    }, [
        validateForm,
        openMissingFieldsSnackBar,
        closeMissingFieldsSnackBar,
        shouldWarn,
        handleSubmit,
    ]);
    const confirmSave = useCallback(() => {
        setIsSaveWarningOpen(false);
        handleSubmit();
    }, [handleSubmit]);
    const closeSaveWarning = useCallback(() => setIsSaveWarningOpen(false), []);

    const redirectTo = useRedirectTo();
    const duplicatePlanning = useCallback(() => {
        redirectTo(baseUrls.planningDetails, {
            planningId: planning && `${planning.id}`,
            mode: 'copy',
        });
    }, [redirectTo, planning]);

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
            updatePendingMission,
            formik,
            isReadOnly,
            canSave,
            savePlanning,
            isSaveWarningOpen,
            confirmSave,
            closeSaveWarning,
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
            updatePendingMission,
            formik,
            isReadOnly,
            canSave,
            savePlanning,
            isSaveWarningOpen,
            confirmSave,
            closeSaveWarning,
            duplicatePlanning,
        ],
    );

    return (
        <PlanningContext.Provider value={value}>
            {children}
        </PlanningContext.Provider>
    );
};

const EMPTY_CONFIGS: SavedPlanningConfig[] = [];

type Props = {
    planningId: string;
    mode: PageMode;
    children: ReactNode;
};

export const PlanningProvider: FC<Props> = ({ planningId, mode, children }) => {
    const {
        data: planning,
        isLoading,
        isFetching,
    } = useGetPlanningDetails(planningId);
    const { data: savedConfigs, isLoading: isLoadingConfigs } =
        useApiMicroplanningPlanningsConfigsList(Number(planningId), undefined, {
            query: { enabled: Boolean(planningId) },
        });

    if (isLoading || isLoadingConfigs) {
        return <LoadingSpinner />;
    }
    if (!planning && mode !== 'create') {
        return null;
    }
    return (
        <LoadedPlanningProvider
            planning={planning}
            savedConfigs={savedConfigs?.results ?? EMPTY_CONFIGS}
            isFetchingPlanning={isFetching}
            mode={mode}
        >
            {children}
        </LoadedPlanningProvider>
    );
};
