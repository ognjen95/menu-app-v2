import type { Metadata } from "next";
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "QR Menu - Dashboard",
    description: "Manage your restaurant menu and orders",
};

export default async function DashboardLayout({
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

    // Check if user has a tenant (business)
    const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

    if (!tenantUser) {
        // User hasn't created a business yet
        return redirect('/onboarding')
    }

    return children;
}
