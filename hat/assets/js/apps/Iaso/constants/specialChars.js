
const specialChars = [
    {
        value: '%',
        encoded: '%25',
    },
    {
        value: '!',
        encoded: '%21',
    },
    {
        value: '"',
        encoded: '%22',
    },
    {
        value: '#',
        encoded: '%23',
    },
    {
        value: '$',
        encoded: '%24',
    },
    {
        value: '&',
        encoded: '%26',
    },
    {
        value: '\'',
        encoded: '%27',
    },
    {
        value: '(',
        encoded: '%28',
    },
    {
        value: ')',
        encoded: '%29',
    },
    {
        value: '*',
        encoded: '%2A',
    },
    {
        value: '+',
        encoded: '%2B',
    },
    {
        value: ',',
        encoded: '%2C',
    },
    {
        value: '-',
        encoded: '%2D',
    },
    {
        value: '.',
        encoded: '%2E',
    },
    {
        value: '/',
        encoded: '%2F',
    },
    {
        value: ':',
        encoded: '%3A',
    },
    {
        value: ';',
        encoded: '%3B',
    },
    {
        value: '<',
        encoded: '%3C',
    },
    {
        value: '=',
        encoded: '%3D',
    },
    {
        value: '>',
        encoded: '%3E',
    },
    {
        value: '?',
        encoded: '%3F',
    },
    {
        value: '@',
        encoded: '%40',
    },
    {
        value: '[',
        encoded: '%5B',
    },
    {
        value: '\\',
        encoded: '%5C',
    },
    {
        value: ']',
        encoded: '%5D',
    },
    {
        value: '^',
        encoded: '%5E',
    },
    {
        value: '_',
        encoded: '%5F',
    },
    {
        value: '`',
        encoded: '%60',
    },
    {
        value: '{',
        encoded: '%7B',
    },
    {
        value: '|',
        encoded: '%7C',
    },
    {
        value: '}',
        encoded: '%7D',
    },
    {
        value: '~',
        encoded: '%7E',
    },
    {
        value: '¢',
        encoded: '%A2',
    },
    {
        value: '£',
        encoded: '%A3',
    },
    {
        value: '¥',
        encoded: '%A5',
    },
    {
        value: '|',
        encoded: '%A6',
    },
    {
        value: '§',
        encoded: '%A7',
    },
    {
        value: '«',
        encoded: '%AB',
    },
    {
        value: '¬',
        encoded: '%AC',
    },
    {
        value: '¯',
        encoded: '%AD',
    },
    {
        value: 'º',
        encoded: '%B0',
    },
    {
        value: '±',
        encoded: '%B1',
    },
    {
        value: 'ª',
        encoded: '%B2',
    },
    {
        value: ',',
        encoded: '%B4',
    },
    {
        value: 'µ',
        encoded: '%B5',
    },
    {
        value: '»',
        encoded: '%BB',
    },
    {
        value: '¼',
        encoded: '%BC',
    },
    {
        value: '½',
        encoded: '%BD',
    },
    {
        value: '¿',
        encoded: '%BF',
    },
    {
        value: 'À',
        encoded: '%C0',
    },
    {
        value: 'Á',
        encoded: '%C1',
    },
    {
        value: 'Â',
        encoded: '%C2',
    },
    {
        value: 'Ã',
        encoded: '%C3',
    },
    {
        value: 'Ä',
        encoded: '%C4',
    },
    {
        value: 'Å',
        encoded: '%C5',
    },
    {
        value: 'Æ',
        encoded: '%C6',
    },
    {
        value: 'Ç',
        encoded: '%C7',
    },
    {
        value: 'È',
        encoded: '%C8',
    },
    {
        value: 'É',
        encoded: '%C9',
    },
    {
        value: 'Ê',
        encoded: '%CA',
    },
    {
        value: 'Ë',
        encoded: '%CB',
    },
    {
        value: 'Ì',
        encoded: '%CC',
    },
    {
        value: 'Í',
        encoded: '%CD',
    },
    {
        value: 'Î',
        encoded: '%CE',
    },
    {
        value: 'Ï',
        encoded: '%CF',
    },
    {
        value: 'Ð',
        encoded: '%D0',
    },
    {
        value: 'Ñ',
        encoded: '%D1',
    },
    {
        value: 'Ò',
        encoded: '%D2',
    },
    {
        value: 'Ó',
        encoded: '%D3',
    },
    {
        value: 'Ô',
        encoded: '%D4',
    },
    {
        value: 'Õ',
        encoded: '%D5',
    },
    {
        value: 'Ö',
        encoded: '%D6',
    },
    {
        value: 'Ø',
        encoded: '%D8',
    },
    {
        value: 'Ù',
        encoded: '%D9',
    },
    {
        value: 'Ú',
        encoded: '%DA',
    },
    {
        value: 'Û',
        encoded: '%DB',
    },
    {
        value: 'Ü',
        encoded: '%DC',
    },
    {
        value: 'Ý',
        encoded: '%DD',
    },
    {
        value: 'Þ',
        encoded: '%DE',
    },
    {
        value: 'ß',
        encoded: '%DF',
    },
    {
        value: 'à',
        encoded: '%E0',
    },
    {
        value: 'á',
        encoded: '%E1',
    },
    {
        value: 'â',
        encoded: '%E2',
    },
    {
        value: 'ã',
        encoded: '%E3',
    },
    {
        value: 'ä',
        encoded: '%E4',
    },
    {
        value: 'å',
        encoded: '%E5',
    },
    {
        value: 'æ',
        encoded: '%E6',
    },
    {
        value: 'ç',
        encoded: '%E7',
    },
    {
        value: 'è',
        encoded: '%E8',
    },
    {
        value: 'é',
        encoded: '%E9',
    },
    {
        value: 'ê',
        encoded: '%EA',
    },
    {
        value: 'ë',
        encoded: '%EB',
    },
    {
        value: 'ì',
        encoded: '%EC',
    },
    {
        value: 'í',
        encoded: '%ED',
    },
    {
        value: 'î',
        encoded: '%EE',
    },
    {
        value: 'ï',
        encoded: '%EF',
    },
    {
        value: 'ð',
        encoded: '%F0',
    },
    {
        value: 'ñ',
        encoded: '%F1',
    },
    {
        value: 'ò',
        encoded: '%F2',
    },
    {
        value: 'ó',
        encoded: '%F3',
    },
    {
        value: 'ô',
        encoded: '%F4',
    },
    {
        value: 'õ',
        encoded: '%F5',
    },
    {
        value: 'ö',
        encoded: '%F6',
    },
    {
        value: '÷',
        encoded: '%F7',
    },
    {
        value: 'ø',
        encoded: '%F8',
    },
    {
        value: 'ù',
        encoded: '%F9',
    },
    {
        value: 'ú',
        encoded: '%FA',
    },
    {
        value: 'û',
        encoded: '%FB',
    },
    {
        value: 'ü',
        encoded: '%FC',
    },
    {
        value: 'ý',
        encoded: '%FD',
    },
    {
        value: 'þ',
        encoded: '%FE',
    },
    {
        value: 'ÿ',
        encoded: '%FF',
    },
];
export default specialChars;
