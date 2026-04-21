import { redirect } from 'next/navigation'

export default async function ResetPasswordRedirect({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params // ← await required!
  redirect(`/reset-password/${token}`)
}
