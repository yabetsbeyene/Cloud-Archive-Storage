import { api } from './axios'
import type {
  AccountProfile,
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from '@/types/user'

export const accountApi = {
  get: () => api.get<AccountProfile>('/account').then((response) => response.data),
  updateProfile: (input: UpdateAccountProfileInput) =>
    api.put<AccountProfile>('/account/profile', input).then((response) => response.data),
  updateTheme: (themePreference: AccountProfile['themePreference']) =>
    api
      .put<AccountProfile>('/account/theme', { themePreference })
      .then((response) => response.data),
  changePassword: (input: ChangePasswordInput) =>
    api.put('/account/password', input).then(() => undefined),
}
