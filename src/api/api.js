const dateNow = () => Math.floor(Date.now() * 0.001)

const getInstanceTemplate = ({ login, password, names, name, exec }) => {
  const processedExec = exec.join('\n');

  if (names) {
    return JSON.stringify({
      "names": names,
      "region": "fra1",
      "size": "s-1vcpu-1gb",
      "image": "ubuntu-20-04-x64",
      "user_data": processedExec
    })
  }

  if (name) {
    return JSON.stringify({
      "name": name,
      "region": "fra1",
      "size": "s-1vcpu-1gb",
      "image": "ubuntu-20-04-x64",
      "user_data": processedExec
    })
  }
}

const requestDO = async (resource, opts = {}) => {
  const { headers, ...restOPTS } = opts;

  const req = await fetch(`https://api.digitalocean.com/v2/${resource}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    ...restOPTS
  })

  let res;

  try {
    res = await req.json()
  } catch (e) {

  }

  return res
}

const getAllDroplets = async ({ apiKey }) => {
  let { droplets } = await requestDO('droplets?per_page=200', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  return droplets
}

const fillDroplets = async ({
  prefix,
  creds,
  exec,
  apiKey
}) => {

  let { droplets } = await requestDO('droplets?per_page=200', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  let { account } = await requestDO('account', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  const limit = account.droplet_limit - droplets.length;

  const names = Array(Number(limit)).fill(1).map((c, x) => `${prefix}${x + 1}`)

  const chunks = names.slice(0, limit).reduce((all, one, i) => {
    const ch = Math.floor(i / 10);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, [])

  let x = []

  for (let names of chunks) {
    const c = await requestDO('droplets', {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      body: getInstanceTemplate({ ...creds, names, exec })
    })

    x.push(c)
  }

  return x
}

const restart = async ({
  id,
  name,
  apiKey,
  creds,
  exec
}) => {
  await requestDO(`droplets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  const c = await requestDO('droplets', {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: getInstanceTemplate({ ...creds, name, exec })
  })

  return c
}

const createDroplet = async ({
  name,
  creds,
  exec,
  apiKey,
}) => {
  const c = await requestDO('droplets', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: getInstanceTemplate({ ...creds, name, exec })
  })

  return c
}


const createDroplets = async ({
  names,
  creds,
  exec,
  apiKey
}) => {
  const chunks = names.reduce((all, one, i) => {
    const ch = Math.floor(i / 10);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, [])

  let x = []

  for (let names of chunks) {
    const c = await requestDO('droplets', {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      body: getInstanceTemplate({ ...creds, names, exec })
    })

    x.push(c)
  }

  return x
}


const getPerformanceByApiKey = async ({
  apiKey,
  dropletsIds
}) => {
  let r = []

  for (let id of dropletsIds) {
    let perf = await requestDO(`monitoring/metrics/droplet/bandwidth?host_id=${id}&interface=public&direction=outbound&start=${dateNow() - 60 * 30}&end=${dateNow()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      }
    })
    r.push(perf)
  }

  return r
}

const getPerformanceById = async ({
  id,
  apiKey
}) => {
  let perf = await requestDO(`monitoring/metrics/droplet/bandwidth?host_id=${id}&interface=public&direction=outbound&start=${dateNow() - 60 * 30}&end=${dateNow()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  return perf
}


const deleteAllDroplets = async ({
  apiKey
}) => {
  let { droplets } = await requestDO('droplets?per_page=200', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })
  droplets = droplets.map(d => d.id)

  droplets.forEach(async (id) => {
    await requestDO(`droplets/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: 'DELETE',
    })
  })

  return { ok: 'ok' }
}

const deleteDroplet = async ({
  id,
  apiKey
}) => {
  const d = await requestDO(`droplets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  })

  return d
}

const api = {
  getAllDroplets,
  getPerformanceByApiKey,
  getPerformanceById,
  restart,
  deleteDroplet,
  deleteAllDroplets,
  createDroplet,
  createDroplets,
  fillDroplets
}

export default api