export const getWebsiteUrl = (website?: any): string | null => {
  if (website?.custom_domain) {
    return `https://${website.custom_domain}`
  }

  if (!website?.subdomain) {
    return null
  }

  const isLocalDev = process.env.NODE_ENV === 'development'
  const isStaging = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')

  if (isStaging) {
    return `${window.location.origin}/site/${website.subdomain}`
  }

  if (isLocalDev) {
    return `http://localhost:3000/site/${website.subdomain}`
  }
  
  return `https://${website.subdomain}.klopay.app`
}