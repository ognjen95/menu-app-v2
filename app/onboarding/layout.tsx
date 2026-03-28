import type { Metadata } from "next";
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Klopay.app - Setup Your Business",
    description: "Complete your business setup to get started",
};

export default async function OnboardingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createServerSupabaseClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Check if user already has a tenant (completed onboarding)
    const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

    if (tenantUser) {
        // User already has a business, redirect to dashboard
        return redirect('/dashboard')
    }

    return <>{children}</>
}
