import React, {
    FunctionComponent,
    useMemo,
    useCallback,
    useState,
} from 'react';
import { DialogContentText } from '@mui/material';
import { IconButton, ConfirmCancelModal } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { baseUrls } from '../../../constants/urls';
import { isValidCoordinate } from '../../../utils/map/mapUtils';
import { useSaveOrgUnit, SaveOrgUnitPayload } from '../hooks';
import MESSAGES from '../messages';
import { OrgUnit } from '../types/orgUnit';
type Props = {
    orgUnit: OrgUnit;
};

export const ActionCell: FunctionComponent<Props> = ({ orgUnit }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { mutateAsync: saveOu, isLoading: isSaving } = useSaveOrgUnit(
        undefined,
        ['orgunits'],
        MESSAGES.orgUnitRejected,
    );

    const handleRejectOrgUnit = useCallback(() => {
        const payload: SaveOrgUnitPayload = {
            id: orgUnit.id,
            validation_status: 'REJECTED',
        };
        if (orgUnit.groups) {
            payload.groups = orgUnit.groups.map(g => g.id);
        }
        saveOu(payload);
    }, [saveOu, orgUnit.id, orgUnit.groups]);

    const cell = useMemo(() => {
        return (
            <section>
                <IconButton
                    url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/infos`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
                {(orgUnit.has_geo_json ||
                    isValidCoordinate(orgUnit.latitude, orgUnit.longitude)) && (
                    <IconButton
                        url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/map`}
                        icon="map"
                        tooltipMessage={MESSAGES.map}
                    />
                )}

                <IconButton
                    url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/history`}
                    icon="history"
                    tooltipMessage={MESSAGES.history}
                />
                {orgUnit.validation_status !== 'REJECTED' && (
                    <>
                        <IconButton
                            onClick={() => setIsConfirmModalOpen(true)}
                            icon="delete"
                            tooltipMessage={MESSAGES.rejectOrgUnit}
                            disabled={isSaving}
                        />
                        <ConfirmCancelModal
                            open={isConfirmModalOpen}
                            closeDialog={() => setIsConfirmModalOpen(false)}
                            onClose={() => null}
                            id={`reject-orgunit-${orgUnit.id}`}
                            dataTestId={`reject-orgunit-modal-${orgUnit.id}`}
                            titleMessage={MESSAGES.rejectOrgUnit}
                            onConfirm={handleRejectOrgUnit}
                            onCancel={() => setIsConfirmModalOpen(false)}
                            confirmMessage={MESSAGES.yes}
                            cancelMessage={MESSAGES.no}
                        >
                            <DialogContentText id="alert-dialog-description">
                                <FormattedMessage
                                    {...MESSAGES.rejectOrgUnitQuestion}
                                    values={{
                                        name: orgUnit.name,
                                    }}
                                />
                            </DialogContentText>
                        </ConfirmCancelModal>
                    </>
                )}
            </section>
        );
    }, [
        orgUnit.id,
        orgUnit.has_geo_json,
        orgUnit.latitude,
        orgUnit.longitude,
        orgUnit.name,
        orgUnit.validation_status,
        handleRejectOrgUnit,
        isConfirmModalOpen,
        isSaving,
    ]);
    return cell;
};
