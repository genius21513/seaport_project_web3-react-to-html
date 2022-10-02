import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './containers/Layout';
import CardComponent from './components/CardComponent';

function App() {

  return (
    <div className="App" style={{height: '100%'}}>
      <Layout>
        <CardComponent/>
      </Layout>
    </div>
  );
}

export default App;

