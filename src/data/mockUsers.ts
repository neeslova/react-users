import type { UsersResponse } from '../types/user';
import data from './users.json';

/**
 * Мок-ответ в формате GET https://dummyjson.com/users.
 * В ЛР1 API не используется — данные берутся из локального JSON.
 */
export const mockUsersResponse = data as UsersResponse;
