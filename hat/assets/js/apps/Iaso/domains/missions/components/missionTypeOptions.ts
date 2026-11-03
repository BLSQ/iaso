import AssignmentIndIcon from '@mui/icons-material/AssignmentIndOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import MESSAGES from '../messages';

export const MISSION_TYPE_OPTIONS = [
    {
        value: MissionTypeDa2Enum.enum.FORM_FILLING,
        Icon: DescriptionIcon,
        labelMessage: MESSAGES.form,
        descriptionMessage: MESSAGES.formFillingDescription,
    },
    {
        value: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        Icon: LocationOnIcon,
        labelMessage: MESSAGES.orgUnitAndFormChip,
        descriptionMessage: MESSAGES.orgUnitAndFormDescription,
    },
    {
        value: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
        Icon: AssignmentIndIcon,
        labelMessage: MESSAGES.entityAndFormChip,
        descriptionMessage: MESSAGES.entityAndFormDescription,
    },
] as const;
