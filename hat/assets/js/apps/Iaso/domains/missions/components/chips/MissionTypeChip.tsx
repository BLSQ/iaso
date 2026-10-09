import React, { FC } from 'react';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { EntityAndFormChip } from './EntityAndFormChip';
import { FormsChip } from './FormsChip';
import { OrgUnitAndFormChip } from './OrgUnitAndFormChip';

type Props = {
    missionType: MissionTypeDa2Enum;
};

export const MissionTypeChip: FC<Props> = ({ missionType }) => {
    switch (missionType) {
        case MissionTypeDa2Enum.enum.FORM_FILLING:
            return <FormsChip />;
        case MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM:
            return <OrgUnitAndFormChip />;
        case MissionTypeDa2Enum.enum.ENTITY_AND_FORM:
            return <EntityAndFormChip />;
        default:
            return null;
    }
};
