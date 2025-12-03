export const setCookie = (name, value, days, sameSite = 'Lax') => {
    let expires;
    const sameSiteString =
        sameSite === 'None' ? `${sameSite}; Secure` : sameSite;

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toUTCString()}`;
    } else {
        expires = '';
    }

    document.cookie = `${name}=${value}${expires}; path=/; SameSite=${sameSiteString};`;
};

export const getCookie = name => {
    const nameEQ = `${name}=`;
    const cookiesArray = document.cookie
        .split(';')
        .map(cookieString => cookieString.trim())
        .filter(cookie => cookie.indexOf(nameEQ) === 0);

    if (cookiesArray.length === 0) {
        return null;
    }
    const cookie = cookiesArray[0];
    return cookie.substring(nameEQ.length, cookie.length);
};

export const eraseCookie = name => {
    setCookie(name, '', -1);
};
