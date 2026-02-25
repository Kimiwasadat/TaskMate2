export const ROLES = {
    CLIENT: 'client',
    COACH: 'coach',
    ADMIN: 'admin',
};

/**
 * Safely extracts and normalizes the role from Clerk's publicMetadata.
 * If no role or an invalid role is provided, it defaults to 'client'.
 * 
 * @param {object} user - The Clerk user object
 * @returns {string} The normalized role ('client', 'coach', or 'admin')
 */
export const normalizeRole = (user) => {
    if (!user || !user.publicMetadata) return ROLES.CLIENT;

    const role = user.publicMetadata.role;

    if (role === ROLES.COACH || role === ROLES.ADMIN) {
        return role;
    }

    // Default to client for any other value or undefined
    return ROLES.CLIENT;
};

/**
 * Checks if a user has permission based on their role and an array of allowed roles.
 * 
 * @param {object} user - The Clerk user object
 * @param {string[]} allowedRoles - Array of roles allowed to access
 * @returns {boolean} True if the user has one of the allowed roles
 */
export const hasRequiredRole = (user, allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const userRole = normalizeRole(user);
    return allowedRoles.includes(userRole);
};
