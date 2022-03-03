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

const Style = {
  Container,
  DropletInfo,
  ChartContainer,
  Name,
  ButtonContainer,
  Ident,
  ID
}

export default Style