import React, { ComponentProps, FC } from 'react';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import IconButton from '@mui/material/IconButton/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import {
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { useFormik } from 'formik';
import { useQueryClient } from 'react-query';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    apiMicroplanningMissionsRetrieve,
    getApiMicroplanningMissionsRetrieveQueryKey,
    useApiMicroplanningMissionsRetrieve,
    useApiMicroplanningMissionsUpdate,
} from 'Iaso/api/missions/endpoints/missions/missions';
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions/models/missionPolymorphicRetrieve.zod';
import {
    EditMissionFormConfig,
    EditMissionValues,
    getEditMissionFormConfig,
} from 'Iaso/domains/missions/components/edit/editMissionFormConfig';
import { EditMissionForm } from 'Iaso/domains/missions/components/EditMissionForm';
import MISSION_MESSAGES from 'Iaso/domains/missions/messages';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { toMissionListItem } from '../../utils';
import { planningPanelStyles } from '../shared/styles';
import { MissionFormModal } from './MissionFormModal';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    missionId: number;
};

type EditMissionFormDialogProps = Omit<Props, 'missionId'> & {
    mission: MissionPolymorphicRetrieve;
    config: EditMissionFormConfig;
};

const EditMissionFormDialog: FC<EditMissionFormDialogProps> = ({
    isOpen,
    closeDialog,
    mission,
    config,
}) => {
    const { formatMessage } = useSafeIntl();
    const { updatePendingMission } = usePlanningContext();
    const queryClient = useQueryClient();
    const { mutateAsync: save } = useApiMicroplanningMissionsUpdate({
        mutation: { meta: { ignoreErrorCodes: [400] } },
    });

    const formik = useFormik<EditMissionValues>({
        validationSchema: toFormikValidationSchema(config.schema),
        initialValues: config.initialValues,
        validateOnBlur: true,
        validateOnMount: true,
        onSubmit: withFormikSubmitAsync(async values => {
            await save({ id: mission.id, data: values });
            const updatedMission = await queryClient.fetchQuery(
                getApiMicroplanningMissionsRetrieveQueryKey(mission.id),
                () => apiMicroplanningMissionsRetrieve(mission.id),
            );
            updatePendingMission(toMissionListItem(updatedMission));
            closeDialog();
        }),
    });

    const formProps = {
        formik,
        missionType: config.missionType,
    } as ComponentProps<typeof EditMissionForm>;

    return (
        <MissionFormModal
            id="edit-mission-dialog"
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={formatMessage(MISSION_MESSAGES.editMission)}
            confirmMessage={MISSION_MESSAGES.save}
            formik={formik}
            info={formatMessage(MESSAGES.missionSavedIndependently)}
        >
            <EditMissionForm {...formProps} />
        </MissionFormModal>
    );
};

const EditMissionDialog: FC<Props> = ({ isOpen, closeDialog, missionId }) => {
    const { formatMessage } = useSafeIntl();
    const { data: mission, isLoading } =
        useApiMicroplanningMissionsRetrieve(missionId);

    if (!mission) {
        return (
            <MissionFormModal
                id="edit-mission-dialog"
                isOpen={isOpen}
                closeDialog={closeDialog}
                titleMessage={formatMessage(MISSION_MESSAGES.editMission)}
                confirmMessage={MISSION_MESSAGES.save}
            >
                {isLoading && <LoadingSpinner absolute fixed={false} />}
            </MissionFormModal>
        );
    }
    return (
        <EditMissionFormDialog
            isOpen={isOpen}
            closeDialog={closeDialog}
            mission={mission}
            config={getEditMissionFormConfig(mission)}
        />
    );
};

type EditMissionButtonProps = {
    onClick: () => void;
};

const EditMissionButton: FC<EditMissionButtonProps> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip title={formatMessage(MISSION_MESSAGES.editMission)}>
            <IconButton size="small" onClick={onClick}>
                <CreateOutlinedIcon
                    color="primary"
                    sx={planningPanelStyles.smallIcon}
                />
            </IconButton>
        </Tooltip>
    );
};

const editMissionDialog = makeFullModal(EditMissionDialog, EditMissionButton);

export { editMissionDialog as EditMissionDialog };
