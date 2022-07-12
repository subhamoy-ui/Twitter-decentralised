import {
  Link,
  BrowserRouter,
  Routes,
  Route
}from "react-router-dom";
import { useState } from "react"
import { ethers } from "ethers"
import DecentratwitterAbi from './contractsData/decentratwitter.json'
import DecentratwitterAddress from './contractsData/decentratwitter-address.json'
import {Spinner,Navbar,Nav,Button,Container} from 'react-bootstrap'
import Home from "./Home.js"
import Profile from "./Profile.js"
import logo from './logo.png'
import './App.css';
import NavbarToggle from "react-bootstrap/esm/NavbarToggle";

function App() {
  const [loading,setLoading]=useState(true) //To set the laoding state of the App component.
  const [account,setAccount]=useState(null)
  const [contract,setContract]=useState({})
  // connect the wallet to the application by this function
  const web3Handler=async () => {
    // Get the accounts that are inside the metamask
    let accounts = await window.ethereum.request({method: 'eth_requestAccounts' });
    setAccount(accounts[0])  //First account of the array is the account the user is interfacing with.
    // Setup event listeners for metamask

    //This is for the network change.
    window.ethereum.on('chainChanged',() => {
      window.location.reload();
    })
    // This is for the accounts if changed.
    window.ethereum.on('accountsChanged',async()=>{
      setLoading(true)
      web3Handler()
    })
    // Get provider object from Metamask. window.ethereum the metamask injects to the browser
    const provider=new ethers.providers.Web3Provider(window.ethereum)
    // Get Signer from the provider.
    const signer=provider.getSigner()
    loadContract(signer)
  }
  const loadContract =async(signer) => {
    // Get deployed copy of Decentratwitter contract
    const contract=new ethers.Contract(DecentratwitterAddress.address,DecentratwitterAbi.abi,signer)
    setContract(contract)
    setLoading(false)
  }
  
  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navbar expand="lg" bg="secondary" variant="dark">
            <Container>
              <Navbar.Brand href="http://www.dappuniversity.com/bootcamp">
                <img src={logo} width="40" height="40" className="" alt=""/>
                &nbsp; Decentratwitter
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/">Home</Nav.Link>
                  <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                </Nav>
                <Nav>
                  {account ? (
                    <Nav.Link
                      href={`https://etherscan.io/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button nav-buton btn-sm mx-4">
                      <Button variant="outline-light">
                        {account.slice(0,5) + '...' +  account.slice(38,42)}
                      </Button>
                    </Nav.Link>
                  ):(
                    <Button onClick={web3Handler} variant="outline-light">Connect Wallet</Button>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </>
        <div>
          <Routes>
            <Route path="/" element={
              <Home contract={contract} account={account} />
            }/>
            <Route path="/profile" element={
              <Profile contract={contract}/>
            }/>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
    
    
    
    
    
    
    
    