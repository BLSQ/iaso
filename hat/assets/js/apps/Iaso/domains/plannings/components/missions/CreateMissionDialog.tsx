import React, { FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { makeFullModal, useSafeIntl } from 'bluesquare-components';
import { useFormik } from 'formik';
import { useQueryClient } from 'react-query';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
    apiMicroplanningMissionsRetrieve,
    getApiMicroplanningMissionsRetrieveQueryKey,
    useApiMicroplanningMissionsCreate,
} from 'Iaso/api/missions/endpoints/missions/missions';
import { MissionTypeDa2Enum } from 'Iaso/api/missions/models/missionTypeDa2Enum.zod';
import { CreateMissionForm } from 'Iaso/domains/missions/components/CreateMissionForm';
import MISSION_MESSAGES from 'Iaso/domains/missions/messages';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import { usePlanningContext } from '../../contexts/PlanningContext';
import { toMissionListItem } from '../../utils';
import { MissionFormModal } from './MissionFormModal';

const initialValues: MissionCreateBody = {
    name: '',
    mission_type: MissionTypeDa2Enum.enum.FORM_FILLING,
    forms: [],
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateMissionDialog: FC<Props> = ({ isOpen, closeDialog }) => {
    const { formatMessage } = useSafeIntl();
    const { addMissions } = usePlanningContext();
    const queryClient = useQueryClient();

    const { mutateAsync: create } = useApiMicroplanningMissionsCreate({
        mutation: { meta: { ignoreErrorCodes: [400] } },
    });

    const linkCreatedMission = useCallback(
        async (missionId: number) => {
            const mission = await queryClient.fetchQuery(
                getApiMicroplanningMissionsRetrieveQueryKey(missionId),
                () => apiMicroplanningMissionsRetrieve(missionId),
            );
            addMissions([toMissionListItem(mission)]);
        },
        [queryClient, addMissions],
    );

    const formik = useFormik<MissionCreateBody>({
        validationSchema: toFormikValidationSchema(MissionCreateBody),
        initialValues,
        validateOnBlur: true,
        validateOnMount: true,
        onSubmit: withFormikSubmitAsync(async values => {
            const { id } = await create({ data: values });
            await linkCreatedMission(id);
            closeDialog();
        }),
    });

    return (
        <MissionFormModal
            id="create-mission-dialog"
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={formatMessage(MISSION_MESSAGES.newMission)}
            confirmMessage={MISSION_MESSAGES.create}
            formik={formik}
        >
            <CreateMissionForm formik={formik} />
        </MissionFormModal>
    );
};

type CreateMissionButtonProps = {
    onClick: () => void;
};

const CreateMissionButton: FC<CreateMissionButtonProps> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip title={formatMessage(MISSION_MESSAGES.createMission)}>
            <IconButton color="primary" onClick={onClick}>
                <AddIcon />
            </IconButton>
        </Tooltip>
    );
};

const createMissionDialog = makeFullModal(
    CreateMissionDialog,
    CreateMissionButton,
);

export { createMissionDialog as CreateMissionDialog };
