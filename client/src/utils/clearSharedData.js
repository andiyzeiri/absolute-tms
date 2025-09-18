// Utility to clear shared localStorage data that's causing cross-user data leaks

export const clearAllTMSLocalStorage = () => {
  const keysToRemove = [];

  // Find all localStorage keys that start with 'tms_' (except tokens)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('tms_') && !key.includes('token')) {
      keysToRemove.push(key);
    }
  }

  // Remove all the data keys (but keep auth tokens)
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed shared data key: ${key}`);
  });

  console.log(`Cleared ${keysToRemove.length} shared localStorage items`);
  return keysToRemove.length;
};

// Call this when user logs out to clean up their data
export const clearUserDataOnLogout = () => {
  clearAllTMSLocalStorage();
};

export default clearAllTMSLocalStorage;