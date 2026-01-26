import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ResetPasswordForm from '@/components/ResetPasswordForm'

export default function ResetPassword() {
    const t = useTranslations('auth.resetPassword')

    return (
        <div className="flex items-center justify-center bg-muted min-h-screen" >
            <Card className="w-[350px] mx-auto">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center py-4">
                        <Image src="/logo.png" alt="logo" width={50} height={50} />
                    </div>

                    <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <ResetPasswordForm />
                </CardContent>
                <CardFooter className="flex-col text-center">
                </CardFooter>
            </Card>
        </div>
    )
}