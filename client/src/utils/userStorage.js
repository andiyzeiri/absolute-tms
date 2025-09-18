// User-scoped localStorage utility to ensure data isolation between different users/companies

const getUserStorageKey = (key, user) => {
  if (!user || !user.company) {
    console.warn('User or company not available for storage key:', key);
    return key; // Fallback to original key
  }
  return `${key}_${user.company}`;
};

export const userStorage = {
  getItem: (key, user) => {
    const scopedKey = getUserStorageKey(key, user);
    return localStorage.getItem(scopedKey);
  },

  setItem: (key, value, user) => {
    const scopedKey = getUserStorageKey(key, user);
    localStorage.setItem(scopedKey, value);
  },

  removeItem: (key, user) => {
    const scopedKey = getUserStorageKey(key, user);
    localStorage.removeItem(scopedKey);
  },

  // Clear all data for current user/company
  clearUserData: (user) => {
    if (!user || !user.company) return;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(`_${user.company}`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

export default userStorage;