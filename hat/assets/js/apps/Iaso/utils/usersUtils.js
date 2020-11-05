const getDisplayName = user =>
    user.first_name || user.last_name
        ? `${user.user_name}
        (${user.first_name ? `${user.first_name}` : ''}
            ${user.first_name && user.last_name ? ' ' : ''}
            ${user.last_name ? `${user.last_name}` : ''}) `
        : user.user_name;

export default getDisplayName;
