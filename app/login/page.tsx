import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProviderSigninBlock from '@/components/ProviderSigninBlock'
import LoginForm from "@/components/LoginForm"

export default async function Login() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        redirect('/dashboard/overview')
    }

    const t = await getTranslations('auth.login')

    return (
        <div className="flex items-center justify-center bg-muted min-h-screen">
            <Card className="w-[350px] mx-auto">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center py-4">
                        <Link href='/'>
                            <Image src="/logo.png" alt="logo" width={50} height={50} />
                        </Link>
                    </div>

                    <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <LoginForm />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
                        </div>
                    </div>
                    <ProviderSigninBlock />
                </CardContent>
                <CardFooter className="flex-col text-center">
                    <Link className="w-full text-sm text-muted-foreground " href="/forgot-password">
                        {t('forgotPassword')}
                    </Link>
                    <Link className="w-full text-sm text-muted-foreground" href="/signup">
                        {t('noAccount')}
                    </Link>
                </CardFooter>
            </Card>
        </div >

    )
}