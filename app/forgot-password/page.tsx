import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ForgotPasswordForm from '@/features/auth/ui/components/forgot-password-form'

export default function ForgotPassword() {
    const t = useTranslations('auth.forgotPassword')

    return (
        <div className="flex items-center justify-center bg-muted min-h-screen" >
            <Card className="w-[350px] mx-auto">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center py-4">
                        <Image src="/logo.png" alt="logo" width={50} height={50} />
                    </div>

                    <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <ForgotPasswordForm />
                </CardContent>
                <CardFooter className="flex-col text-center">
                    <Link className="w-full text-sm text-muted-foreground " href="/login">
                        {t('backToLogin')}
                    </Link>
                    <Link className="w-full text-sm text-muted-foreground" href="/signup">
                        {t('noAccount')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}