import styled from 'styled-components'

const Container = styled.div`
`

const DropletInfo = styled.div`
display: flex;
justify-content: space-evenly;
align-items: center;
`

const Name = styled.div`
text-transform: uppercase;
font-weight: bold;
`
const ID = styled.div`
`
const Ident = styled.div`
display: flex;
justify-content: space-evenly;
align-items: center;

& * {
  margin: 0 5px;
}
`

const ButtonContainer = styled.div`
display: flex;
justify-content: space-evenly;
align-items: center;

& * {
  margin: 0 5px;
}
`

const ChartContainer = styled.div`
/* height: 60px; */
`

const ProgressContainer = styled.div`
    background: rgb(0 0 0 / 70%);
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 500;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10rem;

    & i {
      animation-name: spin;
      animation-duration: 1000ms;
      animation-iteration-count: infinite;
      animation-timing-function: linear;

      @keyframes spin {
        from {transform:rotate(0deg);}
        to {transform:rotate(360deg);}
      }
    }
`

const Style = {
  Container,
  DropletInfo,
  ChartContainer,
  Name,
  ButtonContainer,
  Ident,
  ProgressContainer,
  ID
}

export default Style