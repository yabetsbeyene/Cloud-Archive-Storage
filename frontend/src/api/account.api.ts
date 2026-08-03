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
  updateProfilePicture: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<AccountProfile>('/account/profile-picture', form)
      .then((response) => response.data)
  },
  removeProfilePicture: () =>
    api
      .delete<AccountProfile>('/account/profile-picture')
      .then((response) => response.data),
  getProfilePicture: (userSub?: string) =>
    api
      .get<Blob>(
        userSub ? `/users/${userSub}/profile-picture` : '/account/profile-picture',
        { responseType: 'blob' },
      )
      .then((response) => response.data),
}
