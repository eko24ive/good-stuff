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
import { chunk } from 'lodash'

import api from './api/api'
import Fleet from './components/Fleet'

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
  const [accountsData, setAccountsData] = useState({})

  const [apiKeys, setApiKeys] = useState([])
  const [passwordAsText, setPasswordAsText] = useState(false)
  const [creds, setCreds] = useState({
    login: '',
    password: ''
  })
  const [loadingState, setLoadingState] = useState({})
  const [strategy, setStrategy] = useState('V2')
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
    const account = await api.getAccountData({
      apiKey
    })

    setAccountsData(prev => ({
      ...prev,
      [apiKey]: account
    }))

    setState(prev => ({
      ...prev,
      [apiKey]: droplets
    }))
    setLoading(apiKey, false)
  }, [])

  const getAllData = useCallback(async (keys) => {
    keys.forEach(apiKey => getData(apiKey))
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

  const updatePerf = (id, index, apiKey) => async () => {
    // setLoading(apiKey, true)

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
    // setLoading(apiKey, false)
  }

  const getPerf = apiKey => async () => {
    const dropletsIds = state[apiKey].map(d => d.id)

    dropletsIds.forEach((d, i) => {
      updatePerf(d, i, apiKey)()
    })
  }

  const hardRestart = (id, name, apiKey) => async () => {
    if (!window.confirm('Are you sure you want to hard restart droplet?')) {
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
    if (!window.confirm('Are you sure you want to delete droplet')) {
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
    if (!window.confirm('Are you sure you want to delete ALL droplets for this API key?')) {
      return null
    }
    setLoading(apiKey, true)

    await api.deleteAllDroplets({ apiKey })

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

  const getExecCommand = ({dropletname}) => {
    let exec = $exec.current.value.trim();

    exec = exec.replace('{password}', creds.password);
    exec = exec.replace('{login}', creds.login);

    if(strategy === 'V2') {
      exec = exec.replace('{dropletname}', dropletname || `d-${Date.now()}`);
    }

    return exec.split('\n')
  }

  const createDroplet = apiKey => async () => {
    if (!window.confirm('Are you sure you want to create droplet?')) {
      return null
    }

    const name = prompt("enter name:")

    setLoading(apiKey, true)

    await api.createDroplet({
      name,
      creds,
      exec: getExecCommand({dropletname: name}),
      apiKey,
    })

    await getData(apiKey)
    setLoading(apiKey, false)

  }

  const createDroplets = apiKey => async () => {
    if (!window.confirm('Are you sure you want to create MULTIPLE droplets?')) {
      return null
    }

    const amount = prompt("amount:")
    const prefix = prompt("prefix:")

    const names = Array(Number(amount)).fill(1).map((c, x) => `${prefix}${x + 1}`)
    setLoading(apiKey, true)


    await api.createDroplets({
      names,
      creds,
      exec: getExecCommand({dropletname: names}),
      apiKey
    })

    await getData(apiKey)
    setLoading(apiKey, false)
  }

  const _fillDroplets = async ({prefix, apiKey}) =>  {
    const droplets = await api.getAllDroplets({apiKey})
    const account = await api.getAccountData({apiKey})

    const limit = account.droplet_limit - droplets.length;

    const names = Array(Number(limit)).fill(1).map((c, x) => `${prefix}${x + 1}`)

    const execCommands = names.map(name => getExecCommand({dropletname: name}))

    await api.fillDroplets({
      names,
      creds,
      execCommands,
      apiKey
    })
  }

  const fillDroplets = apiKey => async () => {
    if (!window.confirm('Are you sure you want to fill droplets for this API key?')) {
      return null
    }

    const prefix = prompt("prefix:")

    setLoading(apiKey, true)

    await _fillDroplets({
      prefix,
      apiKey
    })

    await getData(apiKey)
    setLoading(apiKey, false)
  }

  const deleteEverything = async () => {
    if (!window.confirm('Are you sure you want to delete EVERY droplet?')) {
      return null
    }

    if (!window.confirm('Are you DOUBLE sure?')) {
      return null
    }

    if (!window.confirm('Are you TRIPLE sure?')) {
      return null
    }

    apiKeys.forEach(apiKey => {
      setLoading(apiKey, true)
    })

    await Promise.all(apiKeys.map(async apiKey => {
      return await api.deleteAllDroplets({ apiKey })
    }))

    apiKeys.forEach(async apiKey => {
      getData(apiKey)
    })
  }

  const restartEverything = async () => {
    if (!window.confirm('Are you sure you want to restart EVERY droplet?')) {
      return null
    }

    const prefix = prompt("prefix:")

    apiKeys.forEach(apiKey => {
      setLoading(apiKey, true)
    })

    await Promise.all(apiKeys.map(async apiKey => {
      return await api.deleteAllDroplets({ apiKey })
    }))

    await Promise.all(apiKeys.map(async apiKey => {
      await _fillDroplets({
        prefix,
        apiKey
      })

      return await getData(apiKey)
    }))

    apiKeys.forEach(async apiKey => {
      getData(apiKey)
    })
  }

  const fillEverthing = () => {
    if (!window.confirm('Are you sure you want to fill EVERY api key with droplets?')) {
      return null
    }

    const prefix = prompt("prefix:")

    apiKeys.forEach(apiKey => {
      setLoading(apiKey, true)
    })

    apiKeys.forEach(async apiKey => {
      await _fillDroplets({
        prefix,
        apiKey
      })

      await getData(apiKey)
    })
  }


  const refreshEverything = () => {
    apiKeys.forEach(async apiKey => {
      getData(apiKey)
    })
  }

  return (
    <div className='container-fluid mt-3'>
      <>
        <div className="row">
          <div className="col-md-9 col-xs-12">
            <label className="form-label">Api keys (newline):</label>
            <textarea ref={$ta} className="form-control mb-1" defaultValue={apiKeys && apiKeys.join('\n')} rows={"4"} cols={"75"} placeholder={"apikey1\napikey2\napikey3"} />
          </div>
          <div className="col-md-3 col-xs-12">
            <label className="form-label">Login:</label>
            <input type="text" ref={$login} className="form-control mb-1" defaultValue={creds.login} />
            <label className="form-label">Password <button className="btn btn-outline-primary btn-sm" onClick={() => setPasswordAsText(!passwordAsText)}><i className={`bi ${passwordAsText ? 'bi-eye-slash' : 'bi-eye'}`}></i></button></label>
            <input type={passwordAsText ? "text" : "password"} ref={$password} className="form-control mb-1" defaultValue={creds.password} />
          </div>
        </div>
        <div className="row my-2">
          <div className="col">
            <h4>Strategy</h4>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" onChange={() => setStrategy('V2')} checked={strategy === 'V2'}/>
              <label className="form-check-label" htmlFor="flexRadioDefault2">
                V2
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" onChange={() => setStrategy('custom')} />
              <label className="form-check-label" htmlFor="flexRadioDefault1">
                Custom
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
            {strategy === 'custom' && <textarea
              ref={$exec}
              rows={"4"}
              cols={"75"}
              className="form-control mb-1"
              onChange={() => { }}
              value={'#!/bin/bash\ncd /root\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/custom.txt && chmod +x a.sh && nohup ./a.sh -u {login} -p {password} -f ' + domainsURL + ' >/dev/null 2>&1 &'}
            />}
            {strategy === 'V2' && <textarea
              ref={$exec}
              rows={"4"}
              cols={"75"}
              className="form-control mb-1"
              onChange={() => { }}
              value={'#!/bin/bash\ncd /root\necho vm.swappiness=0 | sudo tee -a /etc/sysctl.conf\nwget -O a.sh https://raw.githubusercontent.com/eko24ive/miniature-palm-tree/main/dc.txt && chmod +x a.sh && nohup ./a.sh -n {login} -d {dropletname} -f ' + domainsURL + ' >/dev/null 2>&1 &'}
            />}
          </div>
        </div>
        <button className="btn btn-primary mt-2" onClick={processApiKeys}>Process keys</button>
        <hr />
        <div className="col">
          {apiKeys.length > 0 && <div className="row">
            <div className="col-md-2">
              <h5>Total instances: {apiKeys.map(k => state[k]).flat().length}</h5>
            </div>
            <div className="col-md-10">
              <button className="btn btn-primary btn-lg me-2" onClick={refreshEverything}>
                <i className="bi bi-arrow-hardRestartwise"></i> Everything
              </button>
              <button className='btn btn-danger btn-lg me-2' onClick={deleteEverything}>
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Delete Everything
              </button>
              <button className='btn btn-warning btn-lg me-2' onClick={restartEverything}>
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Restart Everything
              </button>
              <button className='btn btn-warning btn-lg' onClick={fillEverthing}>
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Fill Everything
              </button>
            </div>
          </div>}
        </div>
        <hr className='my-4' />
        {apiKeys.length > 0 && <>
          {chunk(apiKeys, 2).map(([f, l]) => (
            <div className="row" key={f + l}>
              <div className="col-lg-6 col-md-12 col-xs-12">
                <Fleet
                  apiKey={f}
                  state={state}
                  accountsData={accountsData}
                  loadingState={loadingState}
                  getPerf={getPerf}
                  getData={getData}
                  createDroplet={createDroplet}
                  createDroplets={createDroplets}
                  fillDroplets={fillDroplets}
                  deleteAllDroplet={deleteAllDroplet}
                  updatePerf={updatePerf}
                  hardRestart={hardRestart}
                  deleteDroplet={deleteDroplet}
                />
              </div>
              {l && <div className="col-lg-6 col-md-12 col-xs-12">
                <Fleet
                  apiKey={l}
                  state={state}
                  accountsData={accountsData}
                  loadingState={loadingState}
                  getPerf={getPerf}
                  getData={getData}
                  createDroplet={createDroplet}
                  createDroplets={createDroplets}
                  fillDroplets={fillDroplets}
                  deleteAllDroplet={deleteAllDroplet}
                  updatePerf={updatePerf}
                  hardRestart={hardRestart}
                  deleteDroplet={deleteDroplet}
                />
              </div>}
            </div>
          ))}
        </>}
      </>
    </div>
  );
}

export default App;
