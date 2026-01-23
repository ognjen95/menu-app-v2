import { NextRequest, NextResponse } from 'next/server'

/**
 * Query handler wrapper for GET requests
 * Provides consistent error handling and response formatting
 */
export function queryHandler<T>(
  handler: (request: NextRequest, context?: any) => Promise<T>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const data = await handler(request, context)
      return NextResponse.json(data)
    } catch (error) {
      console.error('Query handler error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Mutation handler wrapper for POST/PUT/PATCH/DELETE requests
 * Provides consistent error handling and response formatting
 */
export function mutationHandler<T>(
  handler: (request: NextRequest, context?: any) => Promise<T>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const data = await handler(request, context)
      return NextResponse.json(data, { status: 200 })
    } catch (error) {
      console.error('Mutation handler error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
  }
}

/**
 * Async wrapper for server actions
 * Provides consistent error handling for form actions
 */
export async function actionHandler<T>(
  handler: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await handler()
    return { data }
  } catch (error) {
    console.error('Action handler error:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
