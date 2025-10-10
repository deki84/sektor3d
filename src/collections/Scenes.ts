import type { CollectionConfig } from 'payload'

export const Scenes: CollectionConfig = {
  slug: 'scenes',

  admin: { useAsTitle: 'title' },
  access: { read: () => true, create: () => true, update: () => true, delete: () => true },

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text' },

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
      //  Validierung
      validate: (value: any, { siblingData }: any) => {
        const hasGLTF = !!siblingData?.gltfFileUrl
        const hasSP = Boolean(siblingData?.shapesparkURL)
        const hasIF = Boolean(siblingData?.iframeCode)

        if (value === 'gltf' && !hasGLTF) return 'Bitte GLTF-URL eintragen.'
        if (value === 'shapespark' && !hasSP) return 'Bitte eine Shapespark-URL eingeben.'
        if (value === 'iframe' && !hasIF) return 'Bitte einen iFrame-Code einfügen.'

        const count = [hasGLTF, hasSP, hasIF].filter(Boolean).length
        if (count > 1) return 'Bitte nur eine Quelle angeben (GLTF ODER Shapespark ODER iFrame).'
        return true
      },
    },

    {
      name: 'gltfFileUrl',
      type: 'text',
      label: 'GLTF URL',
      admin: { condition: (data) => data?.viewerType === 'gltf' },
    },
    {
      name: 'shapesparkURL',
      type: 'text',
    },
    {
      name: 'iframeCode',
      type: 'textarea',
    },
    { name: 'cover', type: 'text' },

    {
      name: 'scene_uuid',
      type: 'text',
    },

    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/ui/GltfPreviewField',
        },
      },
    },

    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'camera',
          type: 'group',
          label: 'Kamera Position',
          fields: [
            { name: 'x', type: 'number', defaultValue: 0 },
            { name: 'y', type: 'number', defaultValue: 1 },
            { name: 'z', type: 'number', defaultValue: 2 },
          ],
        },
        {
          name: 'lightIntensity',
          type: 'number',
          min: 0,
          max: 10,
          admin: { step: 0.1 },
          defaultValue: 1,
        },
        { name: 'ambientOcclusion', type: 'checkbox', defaultValue: true },
        { name: 'postProcessing', type: 'checkbox', defaultValue: false },
      ],
    },

    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
}
