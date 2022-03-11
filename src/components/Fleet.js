import Style from '../App.style'
import Droplet from './Droplet'

const Fleet = ({
  apiKey,
  state,
  accountsData,
  loadingState,
  getPerf,
  getData,
  createDroplet,
  createDroplets,
  fillDroplets,
  deleteAllDroplet,
  updatePerf,
  hardRestart,
  deleteDroplet,
}) => {
  return (
    <div className="card mb-4" key={apiKey}>
      {loadingState[apiKey] && <Style.ProgressContainer>
        <i className="bi bi-arrow-clockwise"></i>
      </Style.ProgressContainer>}
      <ul className="list-group list-group-flush">
        <li className="list-group-item">
          <code className="card-title">{apiKey}</code><br />
          <code className="card-title">{accountsData?.[apiKey]?.email}</code><br />
          <code>Droplets: {state?.[apiKey]?.length || 0}/{accountsData?.[apiKey]?.droplet_limit || 0}</code><br />
        </li>
      </ul>
      <div className="card-body">
        <div className="btn-group mb-3">
          <button className="btn btn-primary" data-tooltip="Get perforamce" onClick={getPerf(apiKey)}><i className="bi bi-graph-up"></i></button>
          <button className="btn btn-primary" data-tooltip="Fetch droplets" onClick={() => getData(apiKey)}><i className="bi bi-arrow-clockwise"></i></button>
        </div>
        <div className="btn-group mb-3 mx-3">
          <button className="btn btn-primary" data-tooltip="Crete droplet" onClick={createDroplet(apiKey)}><i className="bi bi-plus-lg"></i></button>
          <button className="btn btn-primary" onClick={createDroplets(apiKey)}>Create droplets</button>
          <button className="btn btn-primary" onClick={fillDroplets(apiKey)}>Fill remaining</button>
        </div>
        <div className="btn-group mb-3">
          <button className="btn btn-danger" data-tooltip="Delete all droplets" onClick={deleteAllDroplet(apiKey)}><i className="bi bi-trash"></i></button>
        </div>
        <Style.Fleet>
          {state[apiKey] && state[apiKey].map((droplet, index) => {
            return <Droplet
              key={droplet.id}
              droplet={droplet}
              state={state}
              updatePerf={updatePerf}
              hardRestart={hardRestart}
              deleteDroplet={deleteDroplet}
              apiKey={apiKey}
              index={index}
            />
          })}
        </Style.Fleet>
      </div>
    </div>
  )
}

export default Fleet