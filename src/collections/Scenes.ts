import type { CollectionConfig } from 'payload'

export const Scenes: CollectionConfig = {
  slug: 'scenes',
  admin: { useAsTitle: 'title' },
  access: { read: () => true, create: () => true, update: () => true, delete: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },

    {
      name: 'viewerType',
      type: 'select',
      required: true,
      defaultValue: 'gltf',
      options: [
        { label: 'GLTF Datei', value: 'gltf' },
        { label: 'Shapespark Link', value: 'shapespark' },
        { label: 'iFrame Embed', value: 'iframe' },
      ],
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
  ],
}
