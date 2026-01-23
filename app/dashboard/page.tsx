import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Dashboard() {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/login')
    }

    return (
        <main className="flex-1">
            <div className="container">
                Hello {data.user.email}
            </div>
        </main>)

}