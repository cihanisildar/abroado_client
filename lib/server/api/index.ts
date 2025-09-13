/**
 * Server API - Centralized exports
 * Import from here to get all server-side API functions
 */

// Posts API
export {
  getPosts,
  getPost,
  getPostComments,
  getPostCountries,
} from './posts';

// Rooms API  
export {
  getRooms,
  getRoom,
} from './rooms';

// Cities API
export {
  getCities,
  getCity,
} from './cities';

// Countries API
export {
  getCountries,
} from './countries';

// Auth API
export {
  getCurrentUser,
} from './auth';

// Utilities
export {
  ServerApiError,
  isServerApiError,
  handleServerApiError,
} from '../utils';