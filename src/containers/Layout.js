import React from 'react'
import OpenSeaIcon from '../components/openseaIcon'
import './layout.css';
const Layout=({children})=> {
  return (
    <div style={{ width: '100%', height: '100%',backgroundColor: '#3387db',position:'absolute'}}>
        <div className='mt-5'>
            <OpenSeaIcon/>
        </div>
        <div className='cardContainer'>
          {children}
        </div>
        
    </div>
  )
}

export default Layout