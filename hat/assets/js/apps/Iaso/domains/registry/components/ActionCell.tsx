/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

export const ActionCell = ({ settings }) => {
    const getUrlInstance = data => {
        const rowOriginal = data.row.original;
        // each instance should have a formId
        let initialUrl = `${baseUrls.instanceDetail}/instanceId/${settings.row.original.id}`;
        // there are some instances which don't have a reference form Id
        if (rowOriginal.reference_form_id) {
            initialUrl = `${initialUrl}/referenceFormId/${rowOriginal.reference_form_id}`;
        }
        return `${initialUrl}`;
    };

    return (
        <section>
            <IconButtonComponent
                url={getUrlInstance(settings)}
                icon="remove-red-eye"
                tooltipMessage={MESSAGES.view}
            />
        </section>
    );
};
