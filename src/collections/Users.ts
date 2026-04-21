import type { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

type EmailArgs = { token?: string }
type AccessArgs = { req: { user: User | null } }
type DeleteArgs = { req: { user: User | null }; id?: number | string }

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailSubject: () => 'Reset your password',
      generateEmailHTML: (args?: EmailArgs) => {
        const token = args?.token ?? ''
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const url = `${baseUrl}/reset-password/${token}`
        return `
        <div style="font-family:system-ui,Segoe UI,Roboto,Arial;">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password:</p>
          <p>
            <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">
              Reset password
            </a>
          </p>
          <p style="color:#64748b;font-size:12px;">If you did not request this, please ignore this email.</p>
        </div>
      `
      },
    },
    verify: {
      generateEmailSubject: () => 'Please confirm your email',
      generateEmailHTML: (args: EmailArgs) => {
        const token = args?.token ?? ''
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const url = `${baseUrl}/verify?token=${token}`
        return `
          <div style="font-family:system-ui,Segoe UI,Roboto,Arial;">
            <h2>Confirm your email</h2>
            <p>Click the button below to confirm your email address:</p>
            <p>
              <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">
                Confirm email
              </a>
            </p>
            <p style="color:#64748b;font-size:12px;">If you did not register, please ignore this email.</p>
          </div>
        `
      },
    },
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'System',
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => Boolean(user?.roles?.includes('admin')),
    create: () => true,
    update: ({ req: { user } }: AccessArgs) => Boolean(user?.roles?.includes('admin')),
    delete: ({ req: { user }, id }: DeleteArgs) =>
      Boolean(user?.roles?.includes('admin')) && String(user?.id) !== String(id),
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email address',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'],
      label: 'Role',
    },
  ],
  hooks: {
    afterForgotPassword: [async ({ collection, context }) => {}],
  },
}

export default Users
