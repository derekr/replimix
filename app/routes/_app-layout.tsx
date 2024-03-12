import { ClientLoaderFunctionArgs, Outlet, useLoaderData } from '@remix-run/react'
import { ReplicacheProvider } from '~/replicache/provider';
import { nanoid } from 'nanoid';

export function loader() {
  const licenseKey = process.env.REPLICACHE_LICENSE_KEY;

  if (typeof licenseKey !== 'string') {
    throw new Error('REPLICACHE_LICENSE_KEY is not set')
  }

  return {
    clientConfig: {
      replicache: {
        licenseKey,
      }
    }
  }
}

export function getUserID() {
  let userID = localStorage.getItem('userID');
  if (!userID) {
    userID = nanoid(6);
    localStorage.setItem('userID', userID);
  }

  return userID;
}

export function setUserID(userID: string) {
  localStorage.setItem('userID', userID);
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const serverData = await serverLoader<typeof loader>();
  const userID = getUserID();
  return {
    userID,
    ...serverData,
  };
}

export function HydrateFallback() {
  return <div>loading app…</div>
}
export default function AppLayout() {
  const { clientConfig, userID } = useLoaderData<typeof clientLoader>() 

  return (
    <ReplicacheProvider licenseKey={clientConfig.replicache.licenseKey} userId={userID}>
      App Layout
      <Outlet />
    </ReplicacheProvider>
  )
}

