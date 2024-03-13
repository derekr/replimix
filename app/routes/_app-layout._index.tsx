import { ClientActionFunctionArgs, Form, Link, useLoaderData, useNavigate } from '@remix-run/react'
import { getUserID, setUserID } from './_app-layout'
import { useReplicache } from '~/replicache/provider'
import { nanoid } from 'nanoid'
import { useSubscribe } from 'replicache-react'
import { listLists } from 'shared/list.ts'

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const previousUserID = getUserID()
  const userID = (await request.formData()).get('userID') as string
  if (userID != previousUserID) {
    setUserID(userID)
  }
  return { userID: previousUserID }
}

export async function clientLoader() {
  return {
    userID: getUserID()
  }
}

export default function IndexRoute() {
  const { userID } = useLoaderData<typeof clientLoader>()
  const replicache = useReplicache()
  const navigate = useNavigate()

  const lists = useSubscribe(replicache, listLists, { default: [] })
  lists.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      APP{' '}
      <Form method='post'>
        <input name='userID' defaultValue={userID} />
        <input type='submit' value='Change' />
      </Form>
      <input
        type='button'
        value='New List'
        onClick={async () => {
          const name = prompt('Enter a new list name')
          if (name) {
            const id = nanoid()
            await replicache?.mutate.createList({ id, name, ownerID: userID })
            navigate(`/list/${id}`)
          }
        }}
      />
      <ul>
        {lists.map((list) => (
          <li key={list.id}>
            <Link to={`/list/${list.id}`}>{list.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
