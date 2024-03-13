import { ClientActionFunctionArgs, Form, useLoaderData, useNavigate } from '@remix-run/react'
import { getUserID, setUserID } from './_app-layout'
import { useReplicache } from '~/replicache/provider'
import { nanoid } from 'nanoid'

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

  return (
    <div>
      APP{' '}
      <Form method='post'>
        <input name='userID' defaultValue={userID} />
        <input type='submit' value='Change' />
      </Form>
      <input
        type='button'
        value="New List"
        onClick={async () => {
          const name = prompt('Enter a new list name')
          if (name) {
            const id = nanoid()
            await replicache?.mutate.createList({ id, name, ownerID: userID })
            navigate(`/list/${id}`)
          }
        }}
      />
    </div>
  )
}
