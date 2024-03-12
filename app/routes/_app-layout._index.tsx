import { Link } from "@remix-run/react";

export default function IndexRoute() {
  return <div>APP <Link to="/todo/4" prefetch="intent">TODO 4</Link></div>
}