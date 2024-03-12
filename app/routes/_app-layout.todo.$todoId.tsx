import { ClientLoaderFunctionArgs, Link, useLoaderData } from "@remix-run/react"

export function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const todoId = params.todoId as string

  return { todoId }
}
export default function TodoRoute() {
  const { todoId } = useLoaderData<typeof clientLoader>()

  return <div>TODO DETAIL: {todoId} <Link to="/">Back</Link></div>
}