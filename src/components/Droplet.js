import Style from '../App.style'
import moment from 'moment';
import { Line } from 'react-chartjs-2';

const Droplet = ({
  droplet,
  state,
  updatePerf,
  hardRestart,
  deleteDroplet,
  apiKey,
  index,
}) => {
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
          <button className="btn btn-sm btn-primary" onClick={updatePerf(droplet.id, index, apiKey)}><i className="bi bi-graph-up"></i></button>
          <button className="btn btn-sm btn-primary" onClick={hardRestart(droplet.id, droplet.name, apiKey)}><i className="bi bi-arrow-clockwise"></i></button>
          <button className="btn btn-sm btn-primary" onClick={deleteDroplet(droplet.id, apiKey)}><i className="bi bi-trash"></i></button>
        </div>
      </div>
      <div className="col-4">
        <Style.ChartContainer>
          {renderChart(state?.perf?.[apiKey]?.[index]?.data?.result[0]?.values)}
        </Style.ChartContainer>
      </div>
    </div>
  )
}

export default Droplet