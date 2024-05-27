import { IconButton as IconButtonComponent } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useQueryClient } from 'react-query';

import MESSAGES from '../messages';

import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import EnketoIcon from '../../instances/components/EnketoIcon';

import { LinkToInstance } from '../../instances/components/LinkToInstance';

import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import * as Permissions from '../../../utils/permissions';
import { useDeleteInstance } from '../../instances/hooks/requests/useDeleteInstance';
import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';

type Props = {
    settings: any;
};

export const ActionCell: FunctionComponent<Props> = ({ settings }) => {
    const queryClient = useQueryClient();
    const getEnketoUrl = useGetEnketoUrl(
        window.location.href,
        settings.row.original,
    );
    const onSuccess = () => {
        queryClient.invalidateQueries('registry-orgunits-without-instances');
    };
    const { mutate: softDeleteInstance } = useDeleteInstance(
        'registry-instances',
        onSuccess,
    );
    return (
        <section>
            <LinkToInstance instanceId={settings.row.original.id} useIcon />
            <DisplayIfUserHasPerm
                permissions={[Permissions.SUBMISSIONS_UPDATE]}
            >
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
            </DisplayIfUserHasPerm>
        </section>
    );
};
