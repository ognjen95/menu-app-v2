import { redirect } from 'next/navigation'

// Redirect to the main dashboard with layout
export default function Dashboard() {
    redirect('/dashboard/overview')
}