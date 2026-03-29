import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailSubject: () => 'Reset your password',
      // args typed as any because Payload's internal type is not exported
      generateEmailHTML: (args: any) => {
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
      generateEmailHTML: (args: any) => {
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
    read: ({ req: { user } }: { req: { user: any } }) => Boolean(user?.roles?.includes('admin')),
    create: () => true,
    update: ({ req: { user } }: { req: { user: any } }) => Boolean(user?.roles?.includes('admin')),
    delete: (args: any) =>
      Boolean(args?.req?.user?.roles?.includes('admin')) &&
      String(args?.req?.user?.id) !== String(args?.id),
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
