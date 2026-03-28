"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState, useFormStatus } from 'react-dom'
import { signup } from '@/app/auth/actions'
import { useTranslations } from 'next-intl'

export default function SignupForm() {
    const t = useTranslations('auth.signup')
    const initialState = {
        message: ''
    }

    const [formState, formAction] = useFormState(signup, initialState)
    const { pending } = useFormStatus()

    return (
        <form action={formAction}>
            <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder={t('namePlaceholder')}
                    name="name"
                    required
                />
            </div>
            <div className="grid gap-2 mt-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    name="email"
                    required
                />
            </div>
            <div className="grid gap-2 mt-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                />
            </div>
            <Button className="w-full mt-4" type="submit" aria-disabled={pending}>  {pending ? t('submitting') : t('submit')}</Button>
            {formState?.message && (
                <p className="text-sm text-red-500 text-center py-2">{formState.message}</p>
            )}
        </form>
    )
}