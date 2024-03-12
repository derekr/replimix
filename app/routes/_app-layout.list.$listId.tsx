import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"

export function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const listId = params.listId

  if (typeof listId === 'undefined') {
    throw Error('invalid listId')
  }

  return { listId }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.log('ErrorBoundary', error)
  return <div>Invalid list</div>
}

export function HydrateFallback() {
  return <div>loading…</div>
}
export default function ListRoute() {
  const { listId } = useLoaderData<typeof clientLoader>()

  return <div>TODO DETAIL: {listId} <Link to="/">Back</Link></div>
}