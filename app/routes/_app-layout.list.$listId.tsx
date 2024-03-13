import { ClientLoaderFunctionArgs, Link, useLoaderData } from '@remix-run/react'
import { useReplicache } from '~/replicache/provider'
import { ReadTransaction } from 'replicache'
import { useSubscribe } from 'replicache-react'
import { getList } from 'shared/list'

// Using a clientLoader isn't necessary atm, but 
// want to explore using Remix APIs for validating routes/accessing 
// route data like querying replicache. Helps keep rendering more 
// focused on UI and less on data plumbing.
// Alternatively can use useParams in component.
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

  const replicache = useReplicache()

  const list = useSubscribe(replicache, (tx: ReadTransaction) => getList(tx, listId), { dependencies: [listId] })

  if (!list) return null

  return (
    <div>
      List detail: {listId} {list.name} <Link to='/'>Back</Link>
    </div>
  )
}
