// Domain
export * from './domains/types'

// Services (client-side only)
export * from './services/use-tables'
// Note: Server-side exports (getTablesPageData) should be imported directly from './services/tables-server'

// Components
export * from './components'

// Containers
export { TablesDialogs, useTablesDialogs } from './containers/tables-dialogs'
export { TablesPageContainer } from './containers/tables-page-container'
