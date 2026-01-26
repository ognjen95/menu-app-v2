import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordSuccess() {
    const t = useTranslations('auth.resetPassword')

    return (
        <div className="flex items-center justify-center bg-muted min-h-screen" >
            <Card className="w-[350px] mx-auto">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center py-4">
                        <Link href='/'>
                            <Image src="/logo.png" alt="logo" width={50} height={50} />
                        </Link>
                    </div>

                    <CardTitle className="text-2xl font-bold">{t('successTitle')}</CardTitle>
                    <CardDescription>
                        Login <Link href="/login" className="underline">here</Link>
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}