// Centralized localStorage keys for the application
// This is the single source of truth for all storage keys

export const STORAGE_KEYS = {
  // Authentication
  USERS_KEY: "fahrme:users",
  SESSION_KEY: "fahrme:session",
  PROFILE_KEY: "fahrme:profile",
  USER_KEY: "fahrme:user",
  
  // User data
  MY_CARS_KEY: "fahrme:my-cars",
  MAIN_VEHICLE_KEY: 'fahrme:mainVehicle',
  LEGACY_MAIN_VEHICLE_KEY: 'mainVehicle',
  INTERACTIONS_KEY: "fahrme:interactions",
  LOGBOOK_LIKES_KEY: "fahrme:logbook-likes",
  
  // Logbook
  LOGBOOK_DRAFT_PREFIX: "fahrme:logbook:draft:",
  LOGBOOK_COMMENTS_PREFIX: "fahrme:logbook:comments:",
  LOGBOOK_ENTRIES_PREFIX: "fahrme:logbook:",
  
  // Likes system
  LIKES_SET_KEY: "fahrme:likes:set",
  LIKES_COUNTERS_KEY: "fahrme:likes:counters",
  
  // Comments
  COMMENTS_PREFIX: "fahrme:comments:",
  
  // Migration flags
  MIGRATION_FLAG_PREFIX: "fahrme:migr:",
  
  // Legacy keys (for migration)
  OLD_PROFILE_KEY: "fahrme:profile",
  OLD_CARS_KEY: "fahrme:my-cars",
  NEW_PROFILE_KEY_PREFIX: "fahrme:profile:",
  NEW_CARS_KEY_PREFIX: "fahrme:my-cars:",
} as const;

// Helper function to get all keys that should be cleared on logout
export function getKeysToClearOnLogout(): string[] {
  return [
    STORAGE_KEYS.SESSION_KEY,
    STORAGE_KEYS.PROFILE_KEY,
    STORAGE_KEYS.USER_KEY,
    STORAGE_KEYS.INTERACTIONS_KEY,
    STORAGE_KEYS.LOGBOOK_LIKES_KEY,
    STORAGE_KEYS.LIKES_SET_KEY,
    STORAGE_KEYS.LIKES_COUNTERS_KEY,
  ];
}

// Helper function to get all draft keys that should be cleared on logout
export function getDraftKeysToClear(): string[] {
  if (typeof window === 'undefined') return [];
  
  const keys = Object.keys(localStorage);
  return keys.filter(key => key.startsWith(STORAGE_KEYS.LOGBOOK_DRAFT_PREFIX));
}
