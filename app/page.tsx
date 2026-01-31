import { redirect } from 'next/navigation'

const url = process.env.NEXT_PUBLIC_LANDING_PAGE || 'https://klopay-app-landing.webflow.io';

export default function LandingPage() {
  redirect(url)
}