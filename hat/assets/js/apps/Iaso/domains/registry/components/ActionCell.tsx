import React, { FunctionComponent } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import MESSAGES from '../messages';
import { userHasPermission } from '../../users/utils';
import { useCurrentUser } from '../../../utils/usersUtils';

import EnketoIcon from '../../instances/components/EnketoIcon';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';

import { LinkToInstance } from '../../instances/components/LinkToInstance';

import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';
import { useDeleteInstance } from '../../instances/hooks/requests/useDeleteInstance';

type Props = {
    settings: any;
};

export const ActionCell: FunctionComponent<Props> = ({ settings }) => {
    const user = useCurrentUser();
    const getEnketoUrl = useGetEnketoUrl(
        window.location.href,
        settings.row.original,
    );
    const { mutate: softDeleteInstance } =
        useDeleteInstance('registry-instances');
    return (
        <section>
            <LinkToInstance instanceId={settings.row.original.id} useIcon />
            {userHasPermission('iaso_update_submission', user) && (
                <>
                    <IconButtonComponent
                        onClick={() => getEnketoUrl()}
                        overrideIcon={EnketoIcon}
                        tooltipMessage={MESSAGES.editOnEnketo}
                    />

                    <DeleteDialog
                        keyName={`instance-${settings.row.original.id}`}
                        titleMessage={MESSAGES.deleteTitle}
                        message={MESSAGES.deleteText}
                        onConfirm={() =>
                            softDeleteInstance(settings.row.original.id)
                        }
                    />
                </>
            )}
        </section>
    );
};
