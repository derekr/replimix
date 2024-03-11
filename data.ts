import type {List, Todo, TodoUpdate, Share} from './shared';
import type {DB} from './database/db.ts';

export type SearchResult = {
  id: string;
  rowversion: number;
};

export type ClientGroupRecord = {
  id: string;
  userID: string;
  cvrVersion: number;
};

export type ClientRecord = {
  id: string;
  clientGroupID: string;
  lastMutationID: number;
};

export type Affected = {
  listIDs: string[];
  userIDs: string[];
};

export function createList(
  db: DB,
  userID: string,
  list: List,
): Affected {
  if (userID !== list.ownerID) {
    throw new Error('Authorization error, cannot create list for other user');
  }
  db.prepare(
    `insert into list (id, ownerid, name, lastmodified) values ($1, $2, $3, now())`).run(list.id, list.ownerID, list.name);
  return {listIDs: [], userIDs: [list.ownerID]};
}

export function deleteList(
  db: DB,
  userID: string,
  listID: string,
): Affected {
  requireAccessToList(db, listID, userID);
  const userIDs = getAccessors(db, listID);
  db.prepare(`delete from list where id = $1`).run(listID);
  return {
    listIDs: [],
    userIDs,
  };
}

export function searchLists(
  db: DB,
  {accessibleByUserID}: {accessibleByUserID: string},
) {
  const rows = db.prepare(
    `select id, xmin as rowversion from list where ownerid = $1 or ` +
      `id in (select listid from share where userid = $1)`,
  ).all(accessibleByUserID);
  return rows as SearchResult[];
}

export function getLists(db: DB, listIDs: string[]) {
  if (listIDs.length === 0) return [];
  const rows = db.prepare(
    `select id, name, ownerid from list where id in (${getPlaceholders(
      listIDs.length,
    )})`,
  ).all(listIDs) as { id: string; name: string; ownerid: string }[];
  return rows.map(r => {
    const list: List = {
      id: r.id,
      name: r.name,
      ownerID: r.ownerid,
    };
    return list;
  });
}

export function createShare(
  db: DB,
  userID: string,
  share: Share,
): Affected {
  requireAccessToList(db, share.listID, userID);
  db.prepare(
    `insert into share (id, listid, userid, lastmodified) values ($1, $2, $3, now())`
  ).run(share.id, share.listID, share.userID);
  return {
    listIDs: [share.listID],
    userIDs: [share.userID],
  };
}

export function deleteShare(
  db: DB,
  userID: string,
  id: string,
): Affected {
  const [share] = getShares(db, [id]);
  if (!share) {
    throw new Error("Specified share doesn't exist");
  }

  requireAccessToList(db, share.listID, userID);
  db.prepare(`delete from share where id = $1`).run(id);
  return {
    listIDs: [share.listID],
    userIDs: [share.userID],
  };
}

export function searchShares(
  db: DB,
  {listIDs}: {listIDs: string[]},
) {
  if (listIDs.length === 0) return [];
  const rows = db.prepare(
    `select s.id, s.xmin as rowversion from share s, list l where s.listid = l.id and l.id in (${getPlaceholders(
      listIDs.length,
    )})`
  ).all(listIDs);
  return rows as SearchResult[];
}

export function getShares(db: DB, shareIDs: string[]) {
  if (shareIDs.length === 0) return [];
  const rows = db.prepare(
    `select id, listid, userid from share where id in (${getPlaceholders(
      shareIDs.length,
    )})`,
  ).all(shareIDs) as { id: string; listid: string; userid: string }[];
  return rows.map(r => {
    const share: Share = {
      id: r.id,
      listID: r.listid,
      userID: r.userid,
    };
    return share;
  });
}

export function createTodo(
  db: DB,
  userID: string,
  todo: Omit<Todo, 'sort'>,
): Affected {
  requireAccessToList(db, todo.listID, userID);
  const rows = db.prepare(
    `select max(ord) as maxord from item where listid = $1`,
  ).all(todo.listID) as { maxord: number }[];
  const maxOrd = rows[0]?.maxord ?? 0;
  db.prepare(
    `insert into item (id, listid, title, complete, ord, lastmodified) values ($1, $2, $3, $4, $5, now())`,
    
  ).run(todo.id, todo.listID, todo.text, todo.completed, maxOrd + 1);
  return {
    listIDs: [todo.listID],
    userIDs: [],
  };
}

export function updateTodo(
  db: DB,
  userID: string,
  update: TodoUpdate,
): Affected {
  const todo = mustGetTodo(db, update.id);
  requireAccessToList(db, todo.listID, userID);
  db.prepare(
    `update item set title = coalesce($1, title), complete = coalesce($2, complete), ord = coalesce($3, ord), lastmodified = now() where id = $4`
  ).run(update.text, update.completed, update.sort, update.id);
  return {
    listIDs: [todo.listID],
    userIDs: [],
  };
}

export function deleteTodo(
  db: DB,
  userID: string,
  todoID: string,
): Affected {
  const todo = mustGetTodo(db, todoID);
  requireAccessToList(db, todo.listID, userID);
  db.prepare(`delete from item where id = $1`).run(todoID);
  return {
    listIDs: [todo.listID],
    userIDs: [],
  };
}

export function searchTodos(
  db: DB,
  {listIDs}: {listIDs: string[]},
) {
  if (listIDs.length === 0) return [];
  const rows = db.prepare(
    `select id, xmin as rowversion from item where listid in (${getPlaceholders(
      listIDs.length,
    )})`,
  ).all(listIDs);
  return rows as SearchResult[];
}

export function mustGetTodo(db: DB, id: string) {
  const [todo] = getTodos(db, [id]);
  if (!todo) {
    throw new Error('Specified todo does not exist');
  }
  return todo;
}

export function getTodos(db: DB, todoIDs: string[]) {
  if (todoIDs.length === 0) return [];
  const rows = db.prepare(
    `select id, listid, title, complete, ord from item where id in (${getPlaceholders(
      todoIDs.length,
    )})`,
  ).all(todoIDs) as { id: string; listid: string; title: string; complete: boolean; ord: number }[];
  return rows.map(r => {
    const todo: Todo = {
      id: r.id,
      listID: r.listid,
      text: r.title,
      completed: r.complete,
      sort: r.ord,
    };
    return todo;
  });
}

export function putClientGroup(
  db: DB,
  clientGroup: ClientGroupRecord,
) {
  const {id, userID, cvrVersion} = clientGroup;
  db.prepare(
    `insert into replicache_client_group
      (id, userid, cvrversion, lastmodified)
    values
      ($1, $2, $3, now())
    on conflict (id) do update set
      userid = $2, cvrversion = $3, lastmodified = now()`,
  ).run(id, userID, cvrVersion);
}

export function getClientGroup(
  db: DB,
  clientGroupID: string,
  userID: string,
): ClientGroupRecord {
  const rows = db.prepare(
    `select userid, cvrversion from replicache_client_group where id = $1`,
  ).all(clientGroupID) as { userid: string; cvrversion: number }[];
  if (!rows || rows.length === 0) {
    return {
      id: clientGroupID,
      userID,
      cvrVersion: 0,
    };
  }
  const r = rows[0];
  if (r.userid !== userID) {
    throw new Error('Authorization error - user does not own client group');
  }
  return {
    id: clientGroupID,
    userID: r.userid,
    cvrVersion: r.cvrversion,
  };
}

export function searchClients(
  db: DB,
  {clientGroupID}: {clientGroupID: string},
) {
  const rows = db.prepare(
    `select id, lastmutationid as rowversion from replicache_client where clientGroupID = $1`,
  ).all(clientGroupID);
  return rows as SearchResult[];
}

export function getClient(
  db: DB,
  clientID: string,
  clientGroupID: string,
): ClientRecord {
  const rows = db.prepare(
    `select id, clientgroupid, lastmutationid from replicache_client where id = $1`,
  ).all(clientID) as { id: string, clientgroupid: string; lastmutationid: number }[];
  if (!rows || rows.length === 0)
    return {
      id: clientID,
      clientGroupID: '',
      lastMutationID: 0,
    };
  const r = rows[0];
  if (r.clientgroupid !== clientGroupID) {
    throw new Error(
      'Authorization error - client does not belong to client group',
    );
  }
  return {
    id: r.id,
    clientGroupID: r.clientgroupid,
    lastMutationID: r.lastmutationid,
  };
}

export function putClient(db: DB, client: ClientRecord) {
  const {id, clientGroupID, lastMutationID} = client;
  db.prepare(
    `
      insert into replicache_client
        (id, clientgroupid, lastmutationid, lastmodified)
      values
        ($1, $2, $3, now())
      on conflict (id) do update set
        lastmutationid = $3, lastmodified = now()
      `,
  ).run(id, clientGroupID, lastMutationID);
}

export function getAccessors(db: DB, listID: string) {
  const rows = db.prepare(
    `select ownerid as userid from list where id = $1 union ` +
      `select userid from share where listid = $1`,
  ).all(listID) as { userid: string }[];
  return rows.map(r => r.userid) as string[];
}

async function requireAccessToList(
  db: DB,
  listID: string,
  accessingUserID: string,
) {
  const rows = db.prepare(
    `select 1 from list where id = $1 and (ownerid = $2 or id in (select listid from share where userid = $2))`,
  ).all(listID, accessingUserID);
  if (rows.length === 0) {
    throw new Error("Authorization error, can't access list");
  }
}

function getPlaceholders(count: number) {
  return Array.from({length: count}, (_, i) => `$${i + 1}`).join(', ');
}