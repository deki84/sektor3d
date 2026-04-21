import type { CollectionConfig } from 'payload'

export const Scenes: CollectionConfig = {
  slug: 'scenes',
  admin: { useAsTitle: 'title' },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return { createdBy: { equals: user.id } }
    },
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      return { createdBy: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return { createdBy: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ operation, req, data }) => {
        if (operation === 'create' && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },

    {
      name: 'viewerType',
      type: 'select',
      required: true,
      defaultValue: 'gltf',
      options: [
        { label: 'GLTF File', value: 'gltf' },
        { label: 'Shapespark Link', value: 'shapespark' },
        { label: 'iFrame Embed', value: 'iframe' },
      ],
    },
    {
      name: 'scene_uuid',
      type: 'text',
    },

    {
      name: 'gltfFileUrl',
      type: 'text',
      admin: { condition: (data) => data?.viewerType === 'gltf' },
    },
    {
      name: 'shapesparkURL',
      type: 'text',
      admin: { condition: (data) => data?.viewerType === 'shapespark' },
    },
    {
      name: 'iframeCode',
      type: 'textarea',
      admin: { condition: (data) => data?.viewerType === 'iframe' },
    },

    { name: 'cover', type: 'text' },
    { name: 'published', type: 'checkbox', defaultValue: false },
    {
      name: 'r2Key',
      type: 'text',
    },
    {
      name: 'fileHash',
      type: 'text',
    },
    {
      name: 'originalName',
      type: 'text',
    },
    {
      name: 'size',
      type: 'number',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Uploaded', value: 'uploaded' },
        { label: 'Processing', value: 'processing' },
        { label: 'Ready', value: 'ready' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'uploaded',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: { readOnly: true },
    },
  ],
}
