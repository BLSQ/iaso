import React, { FunctionComponent } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import MESSAGES from '../messages';

import EnketoIcon from '../../instances/components/EnketoIcon';

import { useGetEnketoUrl } from '../hooks/useGetEnketoUrl';

type Props = {
    settings: any;
};

export const ActionCell: FunctionComponent<Props> = ({ settings }) => {
    const getEnketoUrl = useGetEnketoUrl(
        window.location.href,
        settings.row.original,
    );

    return (
        <section>
            <IconButtonComponent
                onClick={() => getEnketoUrl()}
                overrideIcon={EnketoIcon}
                tooltipMessage={MESSAGES.editOnEnketo}
            />
        </section>
    );
};
