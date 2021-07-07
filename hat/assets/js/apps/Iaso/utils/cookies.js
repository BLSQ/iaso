export const setCookie = (name, value, days) => {
    let expires;

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toGMTString()}`;
    } else {
        expires = '';
    }

    document.cookie = `${name}=${value}${expires}; path=/`;
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
