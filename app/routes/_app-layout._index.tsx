import { ClientActionFunctionArgs, Form, Link, useLoaderData } from '@remix-run/react'
import { getUserID, setUserID } from './_app-layout'

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const previousUserID = getUserID();
  const userID = (await request.formData()).get('userID') as string
  if (userID != previousUserID) {
    setUserID(userID)
  }
  return { userID: previousUserID }
}

export async function clientLoader() {
  return {
    userID: getUserID(),
  }
}

export default function IndexRoute() {
  const { userID } = useLoaderData<typeof clientLoader>()

  return (
    <div>
      APP{' '}
      <Form method='post'>
        <input name='userID' defaultValue={userID} />
        <input type='submit' value='Change' />
      </Form>
      <Link to='/list/4' prefetch='intent'>
        TODO 4
      </Link>
    </div>
  )
}
