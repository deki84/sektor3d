import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // aktiviert Login / Passwort / JWT in Payload
    verify: {
      generateEmailSubject: () => 'Bitte bestätige deine E-Mail',
      generateEmailHTML: ({ token }) => {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const url = `${baseUrl}/verify?token=${token}`
        return `
          <div style="font-family:system-ui,Segoe UI,Roboto,Arial;">
            <h2>E-Mail bestätigen</h2>
            <p>Klicke auf den Button, um deine E-Mail zu bestätigen:</p>
            <p>
              <a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">
                E-Mail bestätigen
              </a>
            </p>
            <p style="color:#64748b;font-size:12px;">Falls du dich nicht registriert hast, ignoriere diese Mail.</p>
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
      label: 'E-Mail-Adresse',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'], // alle neuen User automatisch 'user'
      label: 'Rolle',
    },
  ],
  hooks: {
    afterForgotPassword: [async ({ collection, context }) => {}],
  },
}

export default Users
