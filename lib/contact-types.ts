export type ContactNotification = {
  id: string
  name: string
  email: string
  organisation: string | null
  message: string
  locale: 'it' | 'en'
  createdAt: string
}
