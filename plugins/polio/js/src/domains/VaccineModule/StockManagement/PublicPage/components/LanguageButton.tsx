import React, { FunctionComponent, useCallback } from 'react';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useLocale } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/contexts/LocaleContext';
import MESSAGES from '../messages';

type Props = {
    lang: 'en' | 'fr';
};

export const LanguageButton: FunctionComponent<Props> = ({ lang }) => {
    const { locale: activeLocale, setLocale } = useLocale();
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        if (activeLocale !== lang) {
            setLocale(lang);
        }
    }, [activeLocale, lang, setLocale]);

    return (
        <Button
            sx={{
                backgroundColor: 'green',
                boxShadow: 'none',
                borderRadius: 0,
            }}
            onClick={handleClick}
            variant="contained"
        >
            {formatMessage(MESSAGES[lang])}
        </Button>
    );
};
