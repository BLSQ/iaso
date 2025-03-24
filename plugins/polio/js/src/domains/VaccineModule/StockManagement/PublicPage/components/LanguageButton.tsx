import React, { FunctionComponent, useCallback } from 'react';
import { Button } from '@mui/material';
import { useLocale } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/contexts/LocaleContext';

type Props = {
    lang: 'en' | 'fr';
};

const getDisplayLang = (lang: 'en' | 'fr'): 'English' | 'Français' => {
    if (lang === 'en') {
        return 'English';
    }
    if (lang === 'fr') {
        return 'Français';
    }
    return lang;
};

export const LanguageButton: FunctionComponent<Props> = ({ lang }) => {
    const { locale: activeLocale, setLocale } = useLocale();
    const displayLang = getDisplayLang(lang);
    const handleClick = useCallback(() => {
        if (activeLocale !== lang) {
            setLocale(lang);
        }
    }, [activeLocale, lang, setLocale]);

    return (
        <Button
            sx={{
                backgroundColor: '#4caf50',
                boxShadow: 'none',
                borderRadius: 0,
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '20px',
                paddingRight: '20px',
                textTransform: 'capitalize',
                fontWeight: 'bold',
                fontSize: '16px',
            }}
            onClick={handleClick}
            variant="contained"
        >
            {displayLang}
        </Button>
    );
};
