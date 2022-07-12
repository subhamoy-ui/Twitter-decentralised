import { useState,useEffect } from 'react'
import { ethers } from 'ethers'
import {Row,Form,Button,Card,ListGroup} from 'react-bootstrap'
import {create as ipfsHttpClient} from 'ipfs-http-client'

const client= ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Home = ({contract,account})=>{
    const[loading,setLoading]=useState(true) //Laoding state.
    const[hasProfile,setHasProfile]=useState(false)  //Check if the account has any nft profile or not.
    const [posts,setPosts]=useState('')
    const [post,setPost] = useState('')
    const [address,setAddress] = useState('') 
    const loadPosts = async() =>{
        //Get users address
        let address = await contract.signer.getAddress()
        setAddress(address)
        // Check if user owns an nft 
        // and if they do set profile to true
        const balance = await contract.balanceOf(account)
        setHasProfile(()=>balance>0)
        // GEt all posts
        let results = await contract.getAllPosts()
        //Fetch metadata of each post and add that to post object. Promise.all will resolve all the asynchronous calls after all the asynchronous methods.
        let posts = await Promise.all(results.map(async i =>{    // Calls the async methods without waiting for the previous call.
            //use hash to fetch the post's metadata stored on ipfs
            let response = await fetch (`https://ipfs.infura.io/ipfs/${i.hash}`)
            const metadataPost= await response.json()
            //Get the authors nft profile
            const nftId= await contract.profiles(i.author)
            //Get the URI url  of nft profile
            const uri = await contract.tokenURI(nftId)
            //fetch nft profile metadata 
            response = await fetch (uri)
            const metadataProfile = await response.json()
            // Defining the author object.
            const author = {
                address: i.author,
                username: metadataProfile.username,
                avatar: metadataProfile.avatar
            }
            // Defining post object.Basically assimilating.
            let post ={
                id: i.id,
                content: metadataPost.post,
                tipAmount: i.tipAmount,
                author
            }
            return post
        }))
        // When we fetched the metadata post in an array we sort them with the key highest tip amount to lowest tip amount.
        posts=posts.sort((a,b)=>b.tipAmount-a.tipAmount)
        setPosts(posts)
        setLoading(false)  
    }
    useEffect(()=>{
        if(!posts){
            loadPosts()
        }
    })
    const uploadPost = async () => {
        if (!post) return
        let hash
        //Upload to ipfs
        try{
            const result = await client.add(JSON.stringify({post}))
            setLoading(true)
            hash = result.path
        }catch (error){
            window.alert("ipfs image upload error:",error)
        }
        //upload post to blockchain
        await (await contract.uploadPost(hash)).wait()
        loadPosts()
    }
    const tip = async (post) =>{
        //tip post owner
        await (await contract.tipPostOwner(post.id,{value:ethers.utils.parseEther("0.1") })).wait()
        loadPosts()
    }

    if (loading) return (
        <div className='text-center'>
            <main style ={{padding:"lrem 0"}}>
                <h2>Loading....</h2>
            </main>
        </div>
    )
    return(
        <div className="container-fluid mt-5">
        {hasProfile ?
            (<div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{maxWidth : '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control onChange={(e) => setPost(e.target.value)} size="lg" required as="textarea"/>
                            <div className="d-grid px-0">
                                <Button onClick={uploadPost} variant="primary" size="lg">
                                    Post!
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>)
            :
            (<div className="text-center">
                <main style={{ padding:"lrem 0" }}>
                    <h2>Must own an NFT to post</h2>
                </main>
            </div>)
        }
        <p>&nbsp;</p>
        <hr/>
        <p className="my-auto">&nbsp;</p>
        {posts.length > 0 ?
            posts.map((post,key)=>{
                return(
                    <div key={key} className="col-lg-12 my-3 mx-auto" style={{ width:'1000px' }}>
                        <Card border="primary">
                            <Card.Header>
                                <img
                                    className="mr-2"
                                    width='30'
                                    height='30'
                                    src={post.author.avatar}
                                />
                                <small className="ms-2 me-auto d-inline">
                                    {post.author.username}
                                </small>
                                <small className="mt-1 float-end d-inline">
                                    {post.author.address}
                                </small>
                            </Card.Header>
                            <Card.Body color="secondary">
                                <Card.Title>
                                    {post.content}
                                </Card.Title>
                            </Card.Body>
                            <Card.Footer className="list-group-item">
                                <div className="d-inline mt-auto float-start">Tip Amount:{ethers.utils.formatEther(post.tipAmount)} ETH</div>
                                {/* If the address of the user is same and the or user doesnt have any profile return null */}
                                {address===post.author.address || !hasProfile ?
                                    null:<div className="d-inline float-end">
                                        <Button onClick={()=> tip(post)} className="px-0 py-0 font-size-16" variant="Link" size="md">
                                            Tip for 0.1
                                        </Button>
                                    </div>
                                }
                            </Card.Footer>
                        </Card>
                    </div>
                )
            })
            : (
                <div className="text-center">
                    <main style={{ padding:"lrem 0" }}>
                        <h2>No posts yet</h2>
                    </main>
                </div>
            )
        }   
        </div>
    );
}
export default Home