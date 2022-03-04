import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import moment from 'moment';
import { Line } from 'react-chartjs-2';

import Style from './App.style'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API = 'http://localhost:9898'

function App() {
  const $ta = useRef();
  const $login = useRef();
  const $password = useRef();
  const [state, setState] = useState({
    perf: []
  })

  const [apiKeys, setApiKeys] = useState([])
  const [creds, setCreds] = useState({
    login: '',
    password: ''
  })

  const getAllData = async (keys) => {
    for (let apiKey of keys) {
      await getData(apiKey)
    }
  }

  useEffect(() => {
    const storedKeys = localStorage.getItem('keys')
    const storedCreds = localStorage.getItem('creds')

    if (storedCreds && creds.password === '' && creds.password === '') {
      const c = JSON.parse(storedCreds)

      setCreds(c)
    }

    if (storedKeys && apiKeys.length === 0) {
      const p = JSON.parse(storedKeys)

      setApiKeys(p)

      getAllData(p)
    }
  }, [])

  const getApi = async (route, options) => {
    const { headers, ...restOptions } = options;

    const r = await fetch(`${API}/${route}`, {
      headers: {
        ...headers
      },
      ...restOptions
    })
      .then(res => res.json())

    return r
  }

  async function getData(apiKey) {
    const droplets = await getApi('all', {
      headers: {
        'X-Token': apiKey,
      }
    })

    setState({
      ...state,
      [apiKey]: droplets
    })
  }

  const getPerf = apiKey => async () => {
    const dropletsIds = state[apiKey].map(d => d.id)

    const perf = await getApi(`perf`, {
      method: 'POST',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        droplets: dropletsIds
      })
    })

    setState({
      ...state,
      perf: {
        ...state.perf,
        [apiKey]: perf
      }
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      // padding: {
      //   top: 0,
      //   left: -10,
      //   bottom: -15,
      // },
    },
    animation: {
      duration: 0,
    },
    hover: {
      animationDuration: 0,
    },
    responsiveAnimationDuration: 0,
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      title: {
        display: false,
        text: 'Chart.js Line Chart',
      },
    },
  };

  const renderChart = (perfData) => {
    if (!perfData) {
      return null
    }

    const labels = perfData.map(p => moment(p[0] * 1000).format('HH:mm'))

    const data = {
      labels,
      datasets: [
        {
          label: 'Dataset 1',
          data: perfData.map(p => Number(p[1])),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ],
    };

    return <Line options={options} data={data} />
  }

  const updatePerf = (id, index, apiKey) => async () => {
    const perf = await getApi(`perf/${id}`, {
      method: 'POST',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
    })

    let np
    if (state.perf[apiKey]) {
      np = [...state.perf[apiKey]]
    } else {
      np = []
    }

    np[index] = perf

    console.log(np)

    setState({
      ...state,
      perf: {
        ...state.perf,
        [apiKey]: np
      }
    })
  }

  const hardRestart = (id, name, apiKey) => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    await getApi(`restart/${id}/${name}`, {
      headers: {
        'X-Token': apiKey,
      }
    })

    await getData(apiKey)
  }

  const createDroplet = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const name = prompt("enter name:")

    await getApi(`create/${name}`, {
      method: 'POST',
      headers: {
        'X-Token': apiKey,
      },
      body: JSON.stringify({
        creds,
      })
    })

    await getData(apiKey)
  }
  const createDroplets = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const amount = prompt("amount:")
    const prefix = prompt("prefix:")

    const names = Array(Number(amount)).fill(1).map((c, x) => `${prefix}${x + 1}`)

    await getApi(`createAll`, {
      method: 'POST',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        names,
        creds,
      })
    })

    await getData(apiKey)
  }

  const deleteDroplet = (id, apiKey) => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    await getApi(`${id}`, {
      method: 'DELETE',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
    })

    await getData(apiKey)
  }

  const deleteAllDroplet = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    await getApi(`all`, {
      method: 'DELETE',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
    })

    await getData(apiKey)
    setState({
      ...state,
      perf: []
    })
  }

  const processApiKeys = () => {
    setApiKeys([])
    window.localStorage.removeItem('keys')

    const keys = $ta.current.value.split('\n').map(k => k.trim()).filter(k => k !== undefined && k !== '' && k !== null)
    const login = $login.current.value.trim()
    const password = $password.current.value.trim()

    if (keys.length === 0) {
      alert('invalid keys')
      return;
    }

    if(!login || !password) {
      alert('invalid credentials')
      return;
    }

    window.localStorage.setItem('keys', JSON.stringify(keys))
    window.localStorage.setItem('creds', JSON.stringify({login, password}))
    console.log(keys)

    let perf = {}

    keys.forEach(k => perf[k] = [])

    setApiKeys(keys)


    setCreds({
      login,
      password
    })
    setState({
      ...state,
      perf
    })

    getAllData(keys)
  }

  const fillDroplets = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const prefix = prompt("prefix:")

    await getApi(`fill/${prefix}`, {
      method: 'POST',
      headers: {
        'X-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creds
      })
    })

    await getData(apiKey)
  }

  return (
    <div className='container-fluid'>
      <>
          <div className="row">
            <div className="col-9">
              <label for="exampleInputEmail1" className="form-label">Api key:</label>
              <textarea ref={$ta} className="form-control mb-1" defaultValue={apiKeys && apiKeys.join('\n')} rows={"4"} cols={"75"}>
              </textarea>
            </div>
            <div className="col-3">
              <label for="exampleInputEmail1" className="form-label">Login:</label>
              <input type="text" ref={$login} className="form-control mb-1" defaultValue={creds.login} />
              <label for="exampleInputEmail1" className="form-label">Password:</label>
              <input type="text" ref={$password} className="form-control mb-1" defaultValue={creds.password} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={processApiKeys}>Process keys</button>

        {apiKeys.length > 0 && <>
          {apiKeys.map(apiKey => (
            <div className="card mb-2" key={apiKey}>
              <div className="card-body">
                <h5 className="card-title">{apiKey}</h5>

                  <div className="btn-group mb-3">
                    <button className="btn btn-sm btn-primary" onClick={getPerf(apiKey)}>Get Perf All</button>
                    <button className="btn btn-sm btn-primary" onClick={() => getData(apiKey)}>Refresh</button>
                    <button className="btn btn-sm btn-primary" onClick={createDroplet(apiKey)}>Create</button>
                    <button className="btn btn-sm btn-primary" onClick={createDroplets(apiKey)}>Create droplets</button>
                    <button className="btn btn-sm btn-primary" onClick={fillDroplets(apiKey)}>Fill remaining</button>
                    <button className="btn btn-sm btn-danger" onClick={deleteAllDroplet(apiKey)}>Delete All</button>
                  </div>
                  {state[apiKey] && state[apiKey].map((droplet, index) => {

                    return (
                      <div className="row mb-1" key={droplet.id}>
                        <div className="col-4">
                          <Style.Ident>
                            <Style.Name>{droplet.name}</Style.Name>
                            <Style.ID>#{droplet.id}</Style.ID>
                          </Style.Ident>
                        </div>
                        <div className="col-4">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-primary" onClick={updatePerf(droplet.id, index, apiKey)}>update perf</button>
                            <button className="btn btn-sm btn-primary" onClick={hardRestart(droplet.id, droplet.name, apiKey)}>hard restart</button>
                            <button className="btn btn-sm btn-primary" onClick={deleteDroplet(droplet.id, apiKey)}>delete</button>
                          </div>
                        </div>
                        <div className="col-4">
                          <Style.ChartContainer>
                            {renderChart(state?.perf?.[apiKey]?.[index]?.data?.result[0]?.values)}
                          </Style.ChartContainer>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </>}

      </>
    </div>
  );
}

export default App;
