import React from 'react';
import { Box } from '@mui/material';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { LinkToForm } from 'Iaso/domains/forms/components/LinkToForm';

export const FormsGroup = (forms: any[]) => {
    if (forms.length === 0) return textPlaceholder;
    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                justifyContent: 'center',
            }}
        >
            {forms.map(form => (
                <LinkToForm
                    key={form.id}
                    formId={form.id}
                    formName={form.name}
                />
            ))}
        </Box>
    );
};
