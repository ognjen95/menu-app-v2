import { getWebsiteData } from './services/get-service-data'
import { WebsiteBuilderClient } from './containers/website-builder.client'

export default async function WebsiteBuilderPage() {
  const { website, pages } = await getWebsiteData()

  return (
    <WebsiteBuilderClient
      initialWebsite={website}
      initialPages={pages}
    />
  )
}
