const getDisplayName = user => ((user.firstName || user.lastName) ? (
    `${user.userName}
        (${user.firstName ? `${user.firstName}` : ''}
            ${user.firstName && user.lastName ? ' ' : ''}
            ${user.lastName ? `${user.lastName}` : ''}) `
) : user.userName);

export default getDisplayName;
