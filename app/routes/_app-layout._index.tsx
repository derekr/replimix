import { ClientActionFunctionArgs, Form, Link } from '@remix-run/react'

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const userID = (await request.formData()).get('userID') as string
  console.log('userID', userID)
  localStorage.setItem('userID', userID)
  return { userID }
}

export default function IndexRoute() {
  return (
    <div>
      APP{' '}
      <Form method='post'>
        <input name='userID' />
        <input type='submit' value='Change' />
      </Form>
      <Link to='/list/4' prefetch='intent'>
        TODO 4
      </Link>
    </div>
  )
}
