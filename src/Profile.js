import { useState,useEffect } from 'react'
import {Row,Col,Form,Button,Card,ListGroup} from 'react-bootstrap'
import {create as ipfsHttpClient} from 'ipfs-http-client'
import { isCursorAtEnd } from '@testing-library/user-event/dist/utils'
const client= ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Profile =({contract}) => {
    const [loading,setLoading]=useState(true)
    const [profile,setProfile]=useState('')
    const [avatar,setAvatar]=useState(null)
    const [username,setUsername]=useState('')
    const [nfts,setNfts]=useState('')
    // Defining a load my nfts func to load the nfts.
    const loadMyNFTs = async () => {
        //Get the nft ids
        const results = await contract.getMyNfts();
        //Fetch the metadata of each nft and add to that nft object
        let nfts = await Promise.all(results.map(async i => {
            //get uri url of nft
            const uri = await contract.tokenURI(i)
            //fetch the nft metadata
            
            const response = await fetch(uri)
            // Store the json response in the container.
            const metadata = await response.json()
            return ({
                id: i,
                username: metadata.username,
                avatar: metadata.avatar
            }) 
        }))
        setNfts(nfts)
        getProfile(nfts)
    }
    const getProfile = async (nfts) => {
        // fetching the address connected to the account.
        const address = await contract.signer.getAddress()
        // Get the accounts nft profile and the id that corresponds to it.
        const id =await contract.profiles(address)
        // Find the id that belongs to the nft profile in nfts array.
        const profile= nfts.find((i) => i.id.toString() === id.toString())
        setProfile(profile)
        setLoading(false)
    }
    // Uploads the image that the user wants to set as avatar to IPFS. or the nft profile they are minting.
    const uploadToIPFS = async (event) => {
        event.preventDefault()
        const file = event.target.files[0]
        if (typeof file !== 'undefined') {
            try{
                const result = await client.add(file)
                setAvatar(`https://ipfs.infura.io/ipfs/${result.path}`)
            }catch (error){
                window.alert("ipfs image upload error:",error)
            }
        }
    }
    // Interacts with the blockchain to mint the profile nft.
    const mintProfile = async (event) => {
        if(!avatar || !username)return 
        try{
            const result = await client.add(JSON.stringify({avatar,username}))
            setLoading(true)
            await (await contract.mint(`https://ipfs.infura.io/ipfs/${result.path}`)).wait()
            loadMyNFTs()
        }catch(error){
            window.alert("ipfs uri upload error:",error)
        }
        
    }
    // To switchprofile with differernt nft they own.
    const switchProfile = async (nft) => {
        setLoading(true)
        // Call the function and wait for the transaction receit to return 
        await (await contract.setProfile(nft.id)).wait()
        getProfile(nfts)
    }
    useEffect(() => {
        if(!nfts) {
            //loadMyNFTs()
            setLoading(false)
        }
    })
    if (loading) return (
        <div className='text-center'>
            <main style={{ padding: "lrem 0" }}>
                <h2>Loading....</h2>
            </main>
        </div>
    )  // Building the user interface of it.
    return (
        <div className="mt-4 text-center">
            {profile ? (<div className="mb-3"><h3 className="mb-3">{profile.username}</h3>
                <img className="mb-3" style={{width:'400px'}} src={profile.avatar}/></div>)
                :
                <h4 className="mb-4">No NFT profile, please create one....</h4>}
            <div className="row">  {/*Helps users to mint nft profile if they dont have */}
                <main role="main" className="col-lg-12 mx-auto" style={{maxWidth:'1000px'}}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control onChange={(e) => setUsername(e.target.value)} size="lg" required type="text" placeholder="Username"/>
                            <div className="d-grid px-0">
                                <Button onClick={mintProfile} variant= "primary" size="lg">
                                    Mint NFT Profile
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main> 
            </div>
           
        </div>
    );
}

export default Profile;