import Style from '../App.style'
import Droplet from './Droplet'

const Fleet = ({
  apiKey,
  state,
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
    <div className="card mb-2" key={apiKey}>
      {loadingState[apiKey] && <Style.ProgressContainer>
        <i className="bi bi-arrow-clockwise"></i>
      </Style.ProgressContainer>}
      <div className="card-body">
        <h5 className="card-title">{apiKey}</h5>
        <div className="btn-group mb-3">
          <button className="btn btn-primary" onClick={getPerf(apiKey)}><i className="bi bi-graph-up"></i></button>
          <button className="btn btn-primary" onClick={() => getData(apiKey)}><i className="bi bi-arrow-clockwise"></i></button>
        </div>
        <div className="btn-group mb-3 mx-3">
          <button className="btn btn-primary" onClick={createDroplet(apiKey)}><i className="bi bi-plus-lg"></i></button>
          <button className="btn btn-primary" onClick={createDroplets(apiKey)}>Create droplets</button>
          <button className="btn btn-primary" onClick={fillDroplets(apiKey)}>Fill remaining</button>
        </div>
        <div className="btn-group mb-3">
          <button className="btn btn-danger" onClick={deleteAllDroplet(apiKey)}><i className="bi bi-trash"></i></button>
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